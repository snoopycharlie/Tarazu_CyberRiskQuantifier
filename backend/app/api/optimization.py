"""
app/api/optimization.py — Knapsack Capital Allocation Optimizer, Live What-If & ROSI Curves (Demo Pillar #3).
"""
from __future__ import annotations
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from ..database import get_db
from ..auth import AuthContext, assert_org_access, require_api_key
from ..models import Organization, Control, Sheet, Asset, RiskScore
from ..schemas import (
    ControlOut, ControlUpdate, OptimizeRequest, OptimizeResult,
    WhatIfRequest, WhatIfResult
)
from ..services.optimizer import compute_rosi, estimate_control_risk_reduction
from ..services.ai_service import assess_recommendations
from ..services.rules_engine import (
    OrgContext, AssetContext, VulnContext, ControlsContext,
    compute_asset_risk
)
from ..services import currency_service, period_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/optimization", tags=["Optimization & What-If"])


@router.get("/controls", response_model=list[dict])
async def list_controls(
    org_id: str = Query(...),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_api_key),
    currency: str = Query(default="INR", description="Display currency (INR, USD, EUR, GBP, AED, SGD)"),
):
    """List all organizational controls with status, cost, estimated risk reduction, and ROI."""
    assert_org_access(auth, org_id)
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    # Fetch total org EAL for ROI estimates
    scores_res = await db.execute(
        select(RiskScore)
        .join(Sheet, RiskScore.sheet_id == Sheet.id)
        .where(Sheet.org_id == org_id, RiskScore.asset_id.is_(None))
    )
    scores = scores_res.scalars().all()
    total_eal = sum(s.expected_annual_loss_inr for s in scores) or 50_000_000.0

    controls_res = await db.execute(
        select(Control).where(Control.org_id == org_id).order_by(Control.name.asc())
    )
    controls = controls_res.scalars().all()

    output = []
    for c in controls:
        risk_red = estimate_control_risk_reduction(c.name, org.annual_revenue_inr, total_eal)
        cost = max(c.cost_inr, 1.0)
        roi = risk_red / cost
        try:
            cost_display = currency_service.convert_and_format(c.cost_inr, currency)
            risk_red_display = currency_service.convert_and_format(risk_red, currency)
        except ValueError:
            cost_display = currency_service.convert_and_format(c.cost_inr, "INR")
            risk_red_display = currency_service.convert_and_format(risk_red, "INR")

        output.append({
            "id": c.id,
            "org_id": c.org_id,
            "name": c.name,
            "status": c.status,
            "cost_inr": c.cost_inr,
            "cost_display": cost_display,
            "risk_reduction_inr": round(risk_red, 2),
            "risk_reduction_display": risk_red_display,
            "roi_ratio": round(roi, 2),
            "framework_clause_refs": c.framework_clause_refs or {},
        })

    return output


@router.patch("/controls/{control_id}", response_model=ControlOut)
async def update_control(
    control_id: str,
    payload: ControlUpdate,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_api_key),
):
    """Update control status ('present', 'absent', 'partial') or cost."""
    control = await db.get(Control, control_id)
    if not control:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Control not found")
    assert_org_access(auth, control.org_id)

    if payload.status is not None:
        control.status = payload.status
    if payload.cost_inr is not None:
        control.cost_inr = payload.cost_inr

    await db.commit()
    await db.refresh(control)
    return control


@router.post("/optimize", response_model=OptimizeResult)
async def optimize_controls(
    payload: OptimizeRequest, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """
    Demo Pillar #3 — Greedy Knapsack Investment Optimizer & ROSI Curve Generator.
    Allocates budget across highest-ROI controls and generates cumulative ROSI curve data.
    """
    assert_org_access(auth, payload.org_id)
    org = await db.get(Organization, payload.org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    # Fetch total org EAL
    scores_res = await db.execute(
        select(RiskScore)
        .join(Sheet, RiskScore.sheet_id == Sheet.id)
        .where(Sheet.org_id == payload.org_id, RiskScore.asset_id.is_(None))
    )
    scores = scores_res.scalars().all()
    total_eal = sum(s.expected_annual_loss_inr for s in scores) or 50_000_000.0

    # Fetch controls
    controls_res = await db.execute(
        select(Control).where(Control.org_id == payload.org_id)
    )
    controls = controls_res.scalars().all()

    control_dicts = []
    for c in controls:
        risk_red = estimate_control_risk_reduction(c.name, org.annual_revenue_inr, total_eal)
        control_dicts.append({
            "id": c.id,
            "name": c.name,
            "status": c.status,
            "cost_inr": c.cost_inr,
            "risk_reduction_inr": risk_red,
        })

    # Run optimizer
    rosi_data = compute_rosi(
        controls=control_dicts,
        budget_inr=payload.budget_inr,
        overridden_statuses=payload.overridden_statuses,
        max_risk_reduction_inr=total_eal,
    )

    # Enrich selected controls with org_id
    enriched_selected = [
        {
            "id": s["control_id"],
            "org_id": org.id,
            "control_id": s["control_id"],
            "control_name": s["control_name"],
            "risk_reduction_inr": s["risk_reduction_inr"],
            "cost_inr": s["cost_inr"],
            "roi_ratio": s["roi_ratio"],
            "ai_rationale": None,
        }
        for s in rosi_data["selected_controls"]
    ]

    # Run AI Advisor Agent
    ai_advisor = await assess_recommendations(
        selected_controls=rosi_data["selected_controls"],
        budget_inr=payload.budget_inr,
        total_risk_reduction=rosi_data["total_risk_reduction_inr"],
        org_context={
            "name": org.name,
            "sector": org.sector,
            "size_tier": org.size_tier,
        }
    )

    return OptimizeResult(
        selected_controls=enriched_selected,
        total_cost_inr=rosi_data["total_cost_inr"],
        total_risk_reduction_inr=rosi_data["total_risk_reduction_inr"],
        rosi_curve=rosi_data["rosi_curve"],
        ai_rationale=ai_advisor.get("ai_narrative"),
        ai_mode=ai_advisor.get("ai_mode", "rules_only"),
    )


@router.post("/what-if", response_model=WhatIfResult)
async def what_if_simulation(
    payload: WhatIfRequest,
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_api_key),
    currency: str = Query(default="INR", description="Display currency (INR, USD, EUR, GBP, AED, SGD)"),
    period: str = Query(default="annual", description="EAL period: annual, weekly, monthly, custom"),
    days: int = Query(default=0, description="Days when period=custom"),
):
    """
    Live What-If Simulation endpoint.
    Allows user to toggle controls (e.g. MFA off/on, EDR on/off) and instantly recalculate
    the organization/sheet EAL and see the exact differential without persisting to DB.
    """
    assert_org_access(auth, payload.org_id)
    org = await db.get(Organization, payload.org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    if payload.sheet_id:
        requested_sheet = await db.get(Sheet, payload.sheet_id)
        if not requested_sheet or requested_sheet.org_id != payload.org_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Sheet does not belong to the requested organization")

    # Load assets
    if payload.sheet_id:
        assets_res = await db.execute(
            select(Asset)
            .where(Asset.sheet_id == payload.sheet_id)
            .options(selectinload(Asset.vulnerabilities))
        )
    else:
        assets_res = await db.execute(
            select(Asset)
            .join(Sheet, Asset.sheet_id == Sheet.id)
            .where(Sheet.org_id == payload.org_id)
            .options(selectinload(Asset.vulnerabilities))
        )
    assets = assets_res.scalars().all()

    # Load all controls
    controls_res = await db.execute(select(Control).where(Control.org_id == payload.org_id))
    all_controls = controls_res.scalars().all()

    # Base controls map
    base_controls_data = [{"name": c.name, "status": c.status} for c in all_controls]
    base_controls_ctx = ControlsContext.from_control_list(base_controls_data)

    # Toggled controls map
    toggled_controls_data = []
    for c in all_controls:
        effective_status = payload.toggled_controls.get(c.id, c.status)
        toggled_controls_data.append({"name": c.name, "status": effective_status})
    toggled_controls_ctx = ControlsContext.from_control_list(toggled_controls_data)

    org_ctx = OrgContext(
        sector=org.sector,
        size_tier=org.size_tier,
        employee_count=org.employee_count,
        annual_revenue_inr=org.annual_revenue_inr,
    )

    original_eal = 0.0
    new_eal = 0.0
    all_new_traces = []

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

        base_res = compute_asset_risk(org_ctx, asset_ctx, vuln_ctxs, base_controls_ctx)
        new_res = compute_asset_risk(org_ctx, asset_ctx, vuln_ctxs, toggled_controls_ctx)

        original_eal += base_res.expected_annual_loss_inr
        new_eal += new_res.expected_annual_loss_inr
        all_new_traces.extend(new_res.as_dict_trace())

    delta_inr = round(original_eal - new_eal, 2)
    delta_pct = round((delta_inr / max(original_eal, 1.0)) * 100.0, 1)

    # Pick representative top rule trace changes
    dedup_traces = []
    seen_rules = set()
    for t in all_new_traces:
        if t["rule_id"] not in seen_rules:
            seen_rules.add(t["rule_id"])
            dedup_traces.append(t)

    # Currency + period display fields (additive)
    try:
        orig_display = currency_service.convert_and_format(original_eal, currency)
        new_display = currency_service.convert_and_format(new_eal, currency)
        delta_display = currency_service.convert_and_format(delta_inr, currency)
    except ValueError:
        orig_display = currency_service.convert_and_format(original_eal, "INR")
        new_display = currency_service.convert_and_format(new_eal, "INR")
        delta_display = currency_service.convert_and_format(delta_inr, "INR")

    period_eal = period_service.to_period(original_eal, period, days)
    period_delta = period_service.to_period(delta_inr, period, days)
    period_lbl = period_service.period_label(period, days)
    try:
        period_eal_display = currency_service.convert_and_format(period_eal, currency)
        period_delta_display = currency_service.convert_and_format(period_delta, currency)
    except ValueError:
        period_eal_display = currency_service.convert_and_format(period_eal, "INR")
        period_delta_display = currency_service.convert_and_format(period_delta, "INR")

    return WhatIfResult(
        original_eal_inr=round(original_eal, 2),
        original_eal_display=orig_display,
        new_eal_inr=round(new_eal, 2),
        new_eal_display=new_display,
        delta_inr=delta_inr,
        delta_display=delta_display,
        delta_pct=delta_pct,
        rule_trace=dedup_traces[:10],
        ai_mode="rules_only",
        period=period_lbl,
        period_eal_inr=round(period_eal, 2),
        period_eal_display=period_eal_display,
        period_delta_inr=round(period_delta, 2),
        period_delta_display=period_delta_display,
    )
