"""
app/api/assets.py — Asset Guided Intake, Vulnerability linking & NVD CVE lookup.
"""
from __future__ import annotations
import logging
from typing import Optional, Any
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..auth import AuthContext, assert_org_access, require_api_key
from ..models import Asset, Vulnerability, Sheet, Organization, Control, RiskScore
from ..schemas import AssetCreate, AssetOut, VulnCreate, VulnOut, CVEMatch
from ..services.nvd_client import search_cves, get_cve_by_id
from ..services.rules_engine import (
    OrgContext, AssetContext, VulnContext, ControlsContext,
    compute_asset_risk
)
from ..services.ai_service import assess_risk
from ..services.derived_sheets import recompute_dependent_sheets, resolve_leaf_sheet_ids

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/assets", tags=["Assets"])


class AssetIntakeRequest(BaseModel):
    sheet_id: str
    name: str
    asset_type: str = "Server"
    criticality_tag: str = "standard"
    revenue_dependency_pct: float = Field(default=5.0, ge=0.0, le=100.0)
    metadata_json: Optional[dict[str, Any]] = None
    # Optional initial vulnerability from intake form
    cve_id: Optional[str] = None
    cvss_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    vuln_description: Optional[str] = None
    days_unpatched: int = Field(default=0, ge=0)


async def _recompute_asset_and_sheet_risk(asset: Asset, sheet: Sheet, db: AsyncSession):
    """Helper to recalculate asset EAL and roll it up to the sheet."""
    org = await db.get(Organization, sheet.org_id)
    if not org:
        return

    # Load controls
    controls_res = await db.execute(select(Control).where(Control.org_id == org.id))
    controls = controls_res.scalars().all()
    controls_data = [{"name": c.name, "status": c.status} for c in controls]
    controls_ctx = ControlsContext.from_control_list(controls_data)

    # Load vulnerabilities for this asset
    vulns_res = await db.execute(select(Vulnerability).where(Vulnerability.asset_id == asset.id))
    vulns = vulns_res.scalars().all()
    vuln_ctxs = [
        VulnContext(
            cvss_score=v.cvss_score,
            days_unpatched=v.days_unpatched,
            cve_id=v.cve_id,
            description=v.description,
        )
        for v in vulns
    ]

    org_ctx = OrgContext(
        sector=org.sector,
        size_tier=org.size_tier,
        employee_count=org.employee_count,
        annual_revenue_inr=org.annual_revenue_inr,
    )

    asset_ctx = AssetContext(
        name=asset.name,
        asset_type=asset.asset_type,
        criticality_tag=asset.criticality_tag,
        revenue_dependency_pct=asset.revenue_dependency_pct,
    )

    # Run deterministic rules
    engine_output = compute_asset_risk(org_ctx, asset_ctx, vuln_ctxs, controls_ctx)
    base_eal = engine_output.expected_annual_loss_inr
    rule_trace = engine_output.as_dict_trace()

    # Run AI Assessor (bounded ±30% with zero-key fallback)
    ai_result = await assess_risk(
        base_eal=base_eal,
        rule_trace=rule_trace,
        org_context={
            "name": org.name,
            "sector": org.sector,
            "size_tier": org.size_tier,
            "annual_revenue_inr": org.annual_revenue_inr,
            "employee_count": org.employee_count,
        },
        asset_context={
            "name": asset.name,
            "asset_type": asset.asset_type,
            "criticality_tag": asset.criticality_tag,
        }
    )

    final_eal = ai_result.get("adjusted_eal", base_eal)

    # Persist or update asset RiskScore
    existing_asset_score_res = await db.execute(
        select(RiskScore).where(RiskScore.asset_id == asset.id)
    )
    asset_score = existing_asset_score_res.scalar_one_or_none()
    if not asset_score:
        asset_score = RiskScore(asset_id=asset.id, sheet_id=sheet.id)
        db.add(asset_score)

    asset_score.expected_annual_loss_inr = final_eal
    asset_score.rule_trace = rule_trace
    asset_score.ai_narrative = ai_result.get("ai_narrative")
    asset_score.ai_adjustment_pct = ai_result.get("ai_adjustment_pct", 0.0)
    asset_score.ai_mode = ai_result.get("ai_mode", "rules_only")

    # Update sheet rollup EAL
    all_sheet_assets_res = await db.execute(
        select(Asset).where(Asset.sheet_id == sheet.id)
    )
    all_sheet_assets = all_sheet_assets_res.scalars().all()
    all_sheet_asset_ids = [a.id for a in all_sheet_assets]

    sheet_asset_scores_res = await db.execute(
        select(RiskScore).where(RiskScore.asset_id.in_(all_sheet_asset_ids))
    )
    sheet_asset_scores = sheet_asset_scores_res.scalars().all()
    total_sheet_eal = sum(s.expected_annual_loss_inr for s in sheet_asset_scores if s.asset_id != asset.id) + final_eal

    existing_sheet_score_res = await db.execute(
        select(RiskScore).where(RiskScore.sheet_id == sheet.id, RiskScore.asset_id.is_(None))
    )
    sheet_score = existing_sheet_score_res.scalar_one_or_none()
    if not sheet_score:
        sheet_score = RiskScore(sheet_id=sheet.id, asset_id=None)
        db.add(sheet_score)

    sheet_score.expected_annual_loss_inr = round(total_sheet_eal, 2)
    sheet_score.ai_mode = ai_result.get("ai_mode", "rules_only")
    await recompute_dependent_sheets(sheet.org_id, {sheet.id}, db)
    await db.commit()


@router.get("")
async def list_assets(
    sheet_id: str = Query(...), db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """List assets for a sheet with vulnerabilities and latest risk score."""
    sheet = await db.get(Sheet, sheet_id)
    if not sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, sheet.org_id)
    target_sheet_ids = list(await resolve_leaf_sheet_ids(sheet, db))
    stmt = (
        select(Asset)
        .where(Asset.sheet_id.in_(target_sheet_ids))
        .options(selectinload(Asset.vulnerabilities), selectinload(Asset.risk_scores))
        .order_by(Asset.name.asc())
    )
    result = await db.execute(stmt)
    assets = result.scalars().all()

    output = []
    for a in assets:
        latest_score = a.risk_scores[-1] if a.risk_scores else None
        output.append({
            "id": a.id,
            "sheet_id": a.sheet_id,
            "name": a.name,
            "asset_type": a.asset_type,
            "criticality_tag": a.criticality_tag,
            "revenue_dependency_pct": a.revenue_dependency_pct,
            "metadata_json": a.metadata_json,
            "created_at": a.created_at,
            "vulnerabilities": [
                {
                    "id": v.id,
                    "cve_id": v.cve_id,
                    "cvss_score": v.cvss_score,
                    "description": v.description,
                    "days_unpatched": v.days_unpatched,
                    "source": v.source,
                    "created_at": v.created_at,
                }
                for v in a.vulnerabilities
            ],
            "risk_score": {
                "expected_annual_loss_inr": latest_score.expected_annual_loss_inr,
                "rule_trace": latest_score.rule_trace or [],
                "ai_narrative": latest_score.ai_narrative,
                "ai_adjustment_pct": latest_score.ai_adjustment_pct,
                "ai_mode": latest_score.ai_mode,
            } if latest_score else None,
        })

    return output


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_asset_guided(
    payload: AssetIntakeRequest, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """
    Guided Asset Intake Form endpoint.
    Creates asset, attaches vulnerability if provided, immediately computes explainable EAL & rule trace.
    """
    sheet = await db.get(Sheet, payload.sheet_id)
    if not sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, sheet.org_id)
    if sheet.type != "base":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assets can only be added to base sheets")

    asset = Asset(
        sheet_id=payload.sheet_id,
        name=payload.name,
        asset_type=payload.asset_type,
        criticality_tag=payload.criticality_tag,
        revenue_dependency_pct=payload.revenue_dependency_pct,
        metadata_json=payload.metadata_json or {},
    )
    db.add(asset)
    await db.flush()

    # Attach initial vulnerability if provided
    if payload.cve_id or payload.vuln_description:
        vuln = Vulnerability(
            asset_id=asset.id,
            cve_id=payload.cve_id,
            cvss_score=payload.cvss_score,
            description=payload.vuln_description or "",
            days_unpatched=payload.days_unpatched,
            source="cve_match" if payload.cve_id else "manual",
        )
        db.add(vuln)
        await db.flush()

    await db.commit()
    await db.refresh(asset)

    # Calculate real-time risk score and roll up to sheet
    await _recompute_asset_and_sheet_risk(asset, sheet, db)

    # Return full asset with refreshed score
    res = await db.execute(
        select(Asset)
        .where(Asset.id == asset.id)
        .options(selectinload(Asset.vulnerabilities), selectinload(Asset.risk_scores))
    )
    refreshed = res.scalar_one()
    latest_score = refreshed.risk_scores[-1] if refreshed.risk_scores else None

    return {
        "id": refreshed.id,
        "sheet_id": refreshed.sheet_id,
        "name": refreshed.name,
        "asset_type": refreshed.asset_type,
        "criticality_tag": refreshed.criticality_tag,
        "revenue_dependency_pct": refreshed.revenue_dependency_pct,
        "metadata_json": refreshed.metadata_json,
        "created_at": refreshed.created_at,
        "vulnerabilities": [
            {
                "id": v.id,
                "cve_id": v.cve_id,
                "cvss_score": v.cvss_score,
                "description": v.description,
                "days_unpatched": v.days_unpatched,
            }
            for v in refreshed.vulnerabilities
        ],
        "risk_score": {
            "expected_annual_loss_inr": latest_score.expected_annual_loss_inr,
            "rule_trace": latest_score.rule_trace or [],
            "ai_narrative": latest_score.ai_narrative,
            "ai_adjustment_pct": latest_score.ai_adjustment_pct,
            "ai_mode": latest_score.ai_mode,
        } if latest_score else None,
    }


@router.get("/{asset_id}")
async def get_asset(
    asset_id: str, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Get single asset with all details, vulnerabilities, and full explainability trace."""
    res = await db.execute(
        select(Asset)
        .where(Asset.id == asset_id)
        .options(selectinload(Asset.vulnerabilities), selectinload(Asset.risk_scores))
    )
    asset = res.scalar_one_or_none()
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    sheet = await db.get(Sheet, asset.sheet_id)
    if sheet:
        assert_org_access(auth, sheet.org_id)

    latest_score = asset.risk_scores[-1] if asset.risk_scores else None
    return {
        "id": asset.id,
        "sheet_id": asset.sheet_id,
        "name": asset.name,
        "asset_type": asset.asset_type,
        "criticality_tag": asset.criticality_tag,
        "revenue_dependency_pct": asset.revenue_dependency_pct,
        "metadata_json": asset.metadata_json,
        "created_at": asset.created_at,
        "vulnerabilities": [
            {
                "id": v.id,
                "cve_id": v.cve_id,
                "cvss_score": v.cvss_score,
                "description": v.description,
                "days_unpatched": v.days_unpatched,
                "source": v.source,
                "created_at": v.created_at,
            }
            for v in asset.vulnerabilities
        ],
        "risk_score": {
            "expected_annual_loss_inr": latest_score.expected_annual_loss_inr,
            "rule_trace": latest_score.rule_trace or [],
            "ai_narrative": latest_score.ai_narrative,
            "ai_adjustment_pct": latest_score.ai_adjustment_pct,
            "ai_mode": latest_score.ai_mode,
            "computed_at": latest_score.computed_at,
        } if latest_score else None,
    }


@router.post("/{asset_id}/vulnerabilities", status_code=status.HTTP_201_CREATED)
async def add_vulnerability(
    asset_id: str, payload: VulnCreate, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Add a vulnerability to an asset and trigger real-time re-quantification."""
    asset = await db.get(Asset, asset_id)
    if not asset:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Asset not found")
    sheet = await db.get(Sheet, asset.sheet_id)
    if sheet:
        assert_org_access(auth, sheet.org_id)

    vuln = Vulnerability(
        asset_id=asset.id,
        cve_id=payload.cve_id,
        cvss_score=payload.cvss_score,
        description=payload.description,
        days_unpatched=payload.days_unpatched,
        source=payload.source,
    )
    db.add(vuln)
    await db.commit()

    if sheet:
        await _recompute_asset_and_sheet_risk(asset, sheet, db)

    return vuln


# ── Module 1: Multi-Channel Intake Endpoints ──────────────────────────────────

class ConversationalIntakeReq(BaseModel):
    sheet_id: str
    text: str



@router.post("/intake/conversational")
async def conversational_intake(
    payload: ConversationalIntakeReq,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_api_key),
):
    """
    Channel 2 — Conversational Natural Language Intake (Analyst Agent).
    Parses unstructured text into normalized assets and commits them to the target sheet.
    """
    sheet = await db.get(Sheet, payload.sheet_id)
    if not sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, sheet.org_id)
    if sheet.type != "base":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assets can only be added to base sheets")

    from ..services.ai_service import parse_conversational_intake
    ai_result = await parse_conversational_intake(payload.text)
    extracted_assets = ai_result.get("assets", [])

    created_assets = []
    for item in extracted_assets:
        asset = Asset(
            sheet_id=sheet.id,
            name=item.get("name", "Extracted Asset"),
            asset_type=item.get("asset_type", "Server"),
            criticality_tag=item.get("criticality_tag", "standard"),
            revenue_dependency_pct=float(item.get("revenue_dependency_pct", 5.0)),
            metadata_json={"intake_source": "conversational", "confidence": "high"},
        )
        db.add(asset)
        await db.flush()

        vuln_desc = item.get("vuln_description")
        cve_id = item.get("cve_id")
        cvss = item.get("cvss_score")
        if vuln_desc or cve_id:
            vuln = Vulnerability(
                asset_id=asset.id,
                cve_id=cve_id,
                cvss_score=float(cvss) if cvss else None,
                description=vuln_desc or "",
                days_unpatched=int(item.get("days_unpatched", 30)),
                source="conversational_ai",
            )
            db.add(vuln)
            await db.flush()

        await _recompute_asset_and_sheet_risk(asset, sheet, db)
        created_assets.append(asset)

    await db.commit()
    return {
        "status": "success",
        "created_count": len(created_assets),
        "ai_mode": ai_result.get("ai_mode", "rules_only"),
        "explanation": ai_result.get("explanation", ""),
        "assets": [{"id": a.id, "name": a.name, "asset_type": a.asset_type} for a in created_assets],
    }


@router.post("/intake/upload")
async def file_upload_intake(
    sheet_id: str = Query(...),
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_api_key),
):
    """
    Channel 3 — Document / Spreadsheet Batch Ingestion.
    Supports CSV / JSON exports from Nessus, Qualys, Nmap, or CMDB spreadsheets.
    """
    sheet = await db.get(Sheet, sheet_id)
    if not sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, sheet.org_id)
    if sheet.type != "base":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assets can only be added to base sheets")

    content = await file.read()
    from ..services.intake_engine import parse_csv_or_json_content
    parsed_records = parse_csv_or_json_content(content, file.filename or "import.csv")

    if not parsed_records:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Could not parse valid asset records from file")

    created_assets = []
    for item in parsed_records[:50]:  # limit batch for safety
        asset = Asset(
            sheet_id=sheet.id,
            name=item["name"],
            asset_type=item["asset_type"],
            criticality_tag=item["criticality_tag"],
            revenue_dependency_pct=item["revenue_dependency_pct"],
            metadata_json=item.get("metadata_json", {}),
        )
        db.add(asset)
        await db.flush()

        if item.get("cve_id") or item.get("vuln_description"):
            vuln = Vulnerability(
                asset_id=asset.id,
                cve_id=item.get("cve_id"),
                cvss_score=item.get("cvss_score"),
                description=item.get("vuln_description") or "",
                days_unpatched=item.get("days_unpatched", 30),
                source="file_upload",
            )
            db.add(vuln)
            await db.flush()

        await _recompute_asset_and_sheet_risk(asset, sheet, db)
        created_assets.append(asset)

    await db.commit()
    return {
        "status": "success",
        "filename": file.filename,
        "imported_count": len(created_assets),
        "assets": [{"id": a.id, "name": a.name, "criticality_tag": a.criticality_tag} for a in created_assets],
    }

