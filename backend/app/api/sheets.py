"""
app/api/sheets.py — Sheet CRUD, Combined Sheet Creator & Correlation Agent endpoint.
"""
from __future__ import annotations
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..auth import AuthContext, assert_org_access, require_api_key
from ..models import Sheet, Asset, GraphEdge, RiskScore, Organization
from ..schemas import SheetCreate, SheetOut, CorrelationResult
from ..services.ai_service import assess_correlation
from ..services.derived_sheets import resolve_leaf_sheet_ids

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/sheets", tags=["Sheets"])


@router.get("", response_model=list[dict])
async def list_sheets(
    org_id: str = Query(...), db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """List all sheets for an organization with asset counts and latest EAL."""
    assert_org_access(auth, org_id)
    stmt = select(Sheet).where(Sheet.org_id == org_id).order_by(Sheet.created_at.asc())
    result = await db.execute(stmt)
    sheets = result.scalars().all()

    enriched_sheets = []
    for sheet in sheets:
        # Count assets (including leaf sheets for combined views)
        leaf_ids = list(await resolve_leaf_sheet_ids(sheet, db))
        asset_count_res = await db.execute(
            select(func.count(Asset.id)).where(Asset.sheet_id.in_(leaf_ids))
        )
        asset_count = asset_count_res.scalar() or 0

        # Latest sheet risk score
        score_res = await db.execute(
            select(RiskScore)
            .where(RiskScore.sheet_id == sheet.id, RiskScore.asset_id.is_(None))
            .order_by(RiskScore.computed_at.desc())
            .limit(1)
        )
        latest_score = score_res.scalar_one_or_none()

        enriched_sheets.append({
            "id": sheet.id,
            "org_id": sheet.org_id,
            "name": sheet.name,
            "type": sheet.type,
            "source_sheet_ids": sheet.source_sheet_ids or [],
            "is_org_wide_included": sheet.is_org_wide_included,
            "created_at": sheet.created_at,
            "asset_count": asset_count,
            "latest_eal_inr": latest_score.expected_annual_loss_inr if latest_score else 0.0,
            "ai_mode": latest_score.ai_mode if latest_score else "rules_only",
        })

    return enriched_sheets


@router.post("", response_model=SheetOut, status_code=status.HTTP_201_CREATED)
async def create_sheet(
    payload: SheetCreate, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Create a new sheet (base or combined)."""
    assert_org_access(auth, payload.org_id)
    if not await db.get(Organization, payload.org_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    if payload.type != "base":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use /sheets/combine to create a combined sheet")
    sheet = Sheet(
        org_id=payload.org_id,
        name=payload.name,
        type=payload.type,
        source_sheet_ids=payload.source_sheet_ids,
        is_org_wide_included=payload.is_org_wide_included,
    )
    db.add(sheet)
    await db.commit()
    await db.refresh(sheet)
    return sheet


@router.get("/{sheet_id}")
async def get_sheet(
    sheet_id: str, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Get single sheet details with assets and risk score."""
    sheet = await db.get(Sheet, sheet_id)
    if not sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, sheet.org_id)

    leaf_ids = list(await resolve_leaf_sheet_ids(sheet, db))
    # Fetch assets
    assets_res = await db.execute(
        select(Asset)
        .where(Asset.sheet_id.in_(leaf_ids))
        .options(selectinload(Asset.vulnerabilities))
        .order_by(Asset.name.asc())
    )
    assets = assets_res.scalars().all()

    # Latest risk score
    score_res = await db.execute(
        select(RiskScore)
        .where(RiskScore.sheet_id == sheet_id, RiskScore.asset_id.is_(None))
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    latest_score = score_res.scalar_one_or_none()

    return {
        "id": sheet.id,
        "org_id": sheet.org_id,
        "name": sheet.name,
        "type": sheet.type,
        "source_sheet_ids": sheet.source_sheet_ids or [],
        "is_org_wide_included": sheet.is_org_wide_included,
        "created_at": sheet.created_at,
        "asset_count": len(assets),
        "latest_score": {
            "expected_annual_loss_inr": latest_score.expected_annual_loss_inr,
            "rule_trace": latest_score.rule_trace or [],
            "ai_narrative": latest_score.ai_narrative,
            "ai_adjustment_pct": latest_score.ai_adjustment_pct,
            "ai_mode": latest_score.ai_mode,
            "computed_at": latest_score.computed_at,
        } if latest_score else None,
    }


@router.post("/combine", response_model=CorrelationResult)
async def create_combined_sheet(
    payload: SheetCreate, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """
    Stage C — Combined Sheet Creation & AI Correlation Agent.
    Merges multiple base sheets, checks for cross-segment network edges,
    and computes the compounding risk narrative vs naive arithmetic sum.
    """
    source_ids = payload.source_sheet_ids or []
    if len(source_ids) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least 2 source sheets are required to create a combined sheet."
        )

    # Verify sheets and org
    assert_org_access(auth, payload.org_id)
    org = await db.get(Organization, payload.org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    sheets_res = await db.execute(select(Sheet).where(Sheet.id.in_(source_ids)))
    source_sheets = sheets_res.scalars().all()
    if len(source_sheets) < len(source_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more source sheets not found")
    if any(sheet.org_id != payload.org_id for sheet in source_sheets):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Source sheets must belong to the selected organization")

    sheet_name_map = {s.id: s.name for s in source_sheets}

    # 1. Calculate Naive Sum from latest EAL of source sheets
    naive_sum_inr = 0.0
    for s in source_sheets:
        score_res = await db.execute(
            select(RiskScore)
            .where(RiskScore.sheet_id == s.id, RiskScore.asset_id.is_(None))
            .order_by(RiskScore.computed_at.desc())
            .limit(1)
        )
        sc = score_res.scalar_one_or_none()
        if sc:
            naive_sum_inr += sc.expected_annual_loss_inr

    # 2. Gather assets from all underlying base sheets, including nested combined views.
    leaf_sheet_ids: set[str] = set()
    for source_sheet in source_sheets:
        leaf_sheet_ids.update(await resolve_leaf_sheet_ids(source_sheet, db))
    leaf_sheets = (await db.execute(select(Sheet).where(Sheet.id.in_(leaf_sheet_ids)))).scalars().all()
    sheet_name_map.update({sheet.id: sheet.name for sheet in leaf_sheets})
    assets_res = await db.execute(select(Asset).where(Asset.sheet_id.in_(leaf_sheet_ids)))
    all_assets = assets_res.scalars().all()
    asset_id_to_sheet = {a.id: a.sheet_id for a in all_assets}
    asset_id_to_name = {a.id: a.name for a in all_assets}

    # 3. Find cross-sheet edges
    all_edges_res = await db.execute(select(GraphEdge))
    all_edges = all_edges_res.scalars().all()

    assets_res = await db.execute(
        select(Asset)
        .where(Asset.sheet_id.in_(leaf_sheet_ids))
        .options(selectinload(Asset.vulnerabilities))
    )
    all_assets = assets_res.scalars().all()
    asset_id_to_sheet = {a.id: a.sheet_id for a in all_assets}
    asset_id_to_asset = {a.id: a for a in all_assets}

    cross_edges = []
    cross_edge_dicts = []
    edge_descriptions = []
    for edge in all_edges:
        src_sheet = asset_id_to_sheet.get(edge.source_asset_id)
        tgt_sheet = asset_id_to_sheet.get(edge.target_asset_id)
        if src_sheet and tgt_sheet and src_sheet != tgt_sheet:
            cross_edges.append(edge)
            src_a = asset_id_to_asset.get(edge.source_asset_id)
            tgt_a = asset_id_to_asset.get(edge.target_asset_id)
            src_name = src_a.name if src_a else "Asset"
            tgt_name = tgt_a.name if tgt_a else "Asset"
            src_cvss = max([v.cvss_score for v in src_a.vulnerabilities], default=0.0) if (src_a and src_a.vulnerabilities) else 0.0
            
            cross_edge_dicts.append({
                "src_name": src_name,
                "tgt_name": tgt_name,
                "src_type": src_a.asset_type if src_a else "server",
                "tgt_type": tgt_a.asset_type if tgt_a else "server",
                "src_crit": src_a.criticality_tag if src_a else "medium",
                "tgt_crit": tgt_a.criticality_tag if tgt_a else "medium",
                "strength": edge.dependency_strength,
                "src_cvss": src_cvss,
            })
            edge_descriptions.append(
                f"{src_name} ({sheet_name_map.get(src_sheet, 'Sheet')}) → "
                f"{tgt_name} ({sheet_name_map.get(tgt_sheet, 'Sheet')}) [{edge.dependency_strength}]"
            )

    cross_edge_count = len(cross_edges)

    # 4. Fetch active controls for deterministic correlation rules
    from ..models import Control
    controls_res = await db.execute(
        select(Control.name).where(Control.org_id == payload.org_id, Control.status == "present")
    )
    controls_present = [r[0] for r in controls_res.all()]

    # 5. Evaluate 20 deterministic correlation rules (Module 6)
    from ..services.correlation_engine import evaluate_sheet_correlation
    corr_output = evaluate_sheet_correlation(
        sheet_names=[s.name for s in source_sheets],
        naive_sum_inr=naive_sum_inr,
        cross_edges=cross_edge_dicts,
        controls_present=controls_present,
        org_sector=org.sector or "BFSI",
    )

    # 6. Run AI Correlation Agent on top of deterministic rule baseline
    org_ctx = {
        "name": org.name,
        "sector": org.sector,
        "size_tier": org.size_tier,
        "annual_revenue_inr": org.annual_revenue_inr,
    }

    correlation_ai = await assess_correlation(
        sheet_names=[s.name for s in source_sheets],
        naive_sum_inr=naive_sum_inr,
        cross_edge_count=cross_edge_count,
        edge_descriptions=edge_descriptions,
        org_context=org_ctx,
        deterministic_pct=corr_output.compounding_adjustment_pct,
        deterministic_rules=[{"rule_id": r.rule_id, "description": r.description, "adjustment_pct": r.adjustment_delta_pct, "reason": r.reason} for r in corr_output.rule_trace],
    )

    adjustment_pct = correlation_ai.get("adjustment_pct", corr_output.compounding_adjustment_pct)
    adjusted_inr = round(naive_sum_inr * (1.0 + (adjustment_pct / 100.0)), 2)

    # 7. Persist the Combined Sheet
    combined_sheet = Sheet(
        org_id=payload.org_id,
        name=payload.name,
        type="combined",
        source_sheet_ids=source_ids,
        is_org_wide_included=False,
    )
    db.add(combined_sheet)
    await db.flush()

    # 8. Persist RiskScore for the Combined Sheet with full rule trace
    detailed_trace = [
        {
            "rule_id": "COMBINED_NAIVE_SUM",
            "description": f"Arithmetic sum of {len(source_sheets)} source sheets",
            "contribution_inr": naive_sum_inr,
            "rule_tier": "universal",
            "reason": f"Combined sheets: {', '.join(s.name for s in source_sheets)}",
        }
    ]
    for r in corr_output.rule_trace:
        detailed_trace.append({
            "rule_id": r.rule_id,
            "description": r.description,
            "contribution_inr": round(naive_sum_inr * (r.adjustment_delta_pct / 100.0), 2),
            "rule_tier": "correlation_engine",
            "reason": r.reason,
        })

    combined_risk_score = RiskScore(
        sheet_id=combined_sheet.id,
        asset_id=None,
        expected_annual_loss_inr=adjusted_inr,
        rule_trace=detailed_trace,
        ai_narrative=correlation_ai.get("ai_narrative"),
        ai_adjustment_pct=adjustment_pct,
        ai_mode=correlation_ai.get("ai_mode", "rules_only"),
    )
    db.add(combined_risk_score)
    await db.commit()

    return CorrelationResult(
        combined_sheet_id=combined_sheet.id,
        naive_sum_inr=round(naive_sum_inr, 2),
        adjusted_inr=adjusted_inr,
        adjustment_pct=adjustment_pct,
        cross_edge_count=cross_edge_count,
        ai_narrative=correlation_ai.get("ai_narrative"),
        ai_mode=correlation_ai.get("ai_mode", "rules_only"),
    )


@router.get("/{sheet_id}/correlation", response_model=CorrelationResult)
async def get_sheet_correlation(
    sheet_id: str, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Retrieve existing correlation breakdown for a combined sheet."""
    sheet = await db.get(Sheet, sheet_id)
    if not sheet or sheet.type != "combined":
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Combined sheet not found")
    assert_org_access(auth, sheet.org_id)

    score_res = await db.execute(
        select(RiskScore)
        .where(RiskScore.sheet_id == sheet_id, RiskScore.asset_id.is_(None))
        .order_by(RiskScore.computed_at.desc())
        .limit(1)
    )
    score = score_res.scalar_one_or_none()
    if not score:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Risk score not computed for sheet")

    # Extract naive sum and adjustment from rule_trace
    naive_sum = 0.0
    cross_edge_count = 0
    if score.rule_trace:
        for r in score.rule_trace:
            if r.get("rule_id") == "COMBINED_NAIVE_SUM":
                naive_sum = float(r.get("contribution_inr", 0.0))
            if "cross-segment" in r.get("description", "").lower():
                # Extract edge count if present
                import re
                m = re.search(r"(\d+)", r.get("description", ""))
                if m:
                    cross_edge_count = int(m.group(1))

    return CorrelationResult(
        combined_sheet_id=sheet.id,
        naive_sum_inr=naive_sum or score.expected_annual_loss_inr,
        adjusted_inr=score.expected_annual_loss_inr,
        adjustment_pct=score.ai_adjustment_pct or 0.0,
        cross_edge_count=cross_edge_count,
        ai_narrative=score.ai_narrative,
        ai_mode=score.ai_mode,
    )
