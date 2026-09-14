"""
app/api/risk.py — Risk Quantification calculation triggers for assets and sheets.
"""
from __future__ import annotations
import logging
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..auth import AuthContext, assert_org_access, require_api_key
from ..models import Asset, Sheet, Organization, Control, Vulnerability, RiskScore
from ..schemas import RiskScoreOut
from ..services.rules_engine import (
    OrgContext, AssetContext, VulnContext, ControlsContext,
    compute_asset_risk
)
from ..services.ai_service import assess_risk
from ..services.derived_sheets import recompute_dependent_sheets
from ..services import currency_service, period_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/risk", tags=["Risk Quantification"])


@router.post("/calculate/sheet/{sheet_id}", response_model=dict)
async def recalculate_sheet_risk(
    sheet_id: str,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_api_key),
    currency: str = Query(default="INR", description="Display currency (INR, USD, EUR, GBP, AED, SGD)"),
    period: str = Query(default="annual", description="EAL period: annual, weekly, monthly, custom"),
    days: int = Query(default=0, description="Days when period=custom"),
):
    """Recalculate risk for all assets in a sheet and update sheet rollup."""
    sheet = await db.get(Sheet, sheet_id)
    if not sheet:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Sheet not found")
    assert_org_access(auth, sheet.org_id)
    if sheet.type != "base":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Recalculate a base sheet; combined sheets refresh automatically")

    org = await db.get(Organization, sheet.org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    # Load controls
    controls_res = await db.execute(select(Control).where(Control.org_id == org.id))
    controls = controls_res.scalars().all()
    controls_ctx = ControlsContext.from_control_list([{"name": c.name, "status": c.status} for c in controls])

    org_ctx = OrgContext(
        sector=org.sector,
        size_tier=org.size_tier,
        employee_count=org.employee_count,
        annual_revenue_inr=org.annual_revenue_inr,
    )

    # Load all assets in sheet
    assets_res = await db.execute(
        select(Asset)
        .where(Asset.sheet_id == sheet_id)
        .options(selectinload(Asset.vulnerabilities))
    )
    assets = assets_res.scalars().all()

    total_eal = 0.0
    all_traces = []

    for a in assets:
        vuln_ctxs = [
            VulnContext(
                cvss_score=v.cvss_score,
                days_unpatched=v.days_unpatched,
                cve_id=v.cve_id,
                description=v.description,
            )
            for v in a.vulnerabilities
        ]
        asset_ctx = AssetContext(
            name=a.name,
            asset_type=a.asset_type,
            criticality_tag=a.criticality_tag,
            revenue_dependency_pct=a.revenue_dependency_pct,
        )

        engine_out = compute_asset_risk(org_ctx, asset_ctx, vuln_ctxs, controls_ctx)
        base_eal = engine_out.expected_annual_loss_inr
        rule_trace = engine_out.as_dict_trace()

        # Check / create asset RiskScore
        score_res = await db.execute(select(RiskScore).where(RiskScore.asset_id == a.id))
        score = score_res.scalar_one_or_none()
        if not score:
            score = RiskScore(asset_id=a.id, sheet_id=sheet.id)
            db.add(score)

        score.expected_annual_loss_inr = base_eal
        score.rule_trace = rule_trace
        score.ai_mode = "rules_only"

        total_eal += base_eal
        all_traces.extend(rule_trace)

    # Update sheet rollup score
    sheet_score_res = await db.execute(
        select(RiskScore).where(RiskScore.sheet_id == sheet.id, RiskScore.asset_id.is_(None))
    )
    sheet_score = sheet_score_res.scalar_one_or_none()
    if not sheet_score:
        sheet_score = RiskScore(sheet_id=sheet.id, asset_id=None)
        db.add(sheet_score)

    sheet_score.expected_annual_loss_inr = round(total_eal, 2)
    sheet_score.rule_trace = all_traces[:15]
    sheet_score.ai_mode = "rules_only"

    await recompute_dependent_sheets(sheet.org_id, {sheet.id}, db)
    await db.commit()

    # Period + currency display fields (additive — existing total_eal_inr unchanged)
    period_eal = period_service.to_period(total_eal, period, days)
    period_label = period_service.period_label(period, days)
    try:
        eal_display = currency_service.convert_and_format(total_eal, currency)
        period_eal_display = currency_service.convert_and_format(period_eal, currency)
    except ValueError:
        eal_display = currency_service.convert_and_format(total_eal, "INR")
        period_eal_display = currency_service.convert_and_format(period_eal, "INR")

    return {
        "sheet_id": sheet.id,
        "sheet_name": sheet.name,
        "total_eal_inr": round(total_eal, 2),
        "total_eal_display": eal_display,
        "period": period,
        "period_label": period_label,
        "period_eal_inr": round(period_eal, 2),
        "period_eal_display": period_eal_display,
        "asset_count": len(assets),
        "rule_trace_count": len(all_traces),
    }
