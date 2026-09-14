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
from ..models import Organization, Control, Sheet, Asset, RiskScore, GraphEdge
from ..schemas import (
    ControlOut, ControlUpdate, OptimizeRequest, OptimizeResult,
    WhatIfRequest, WhatIfResult, BlastRadiusResult
)
from ..services.optimizer import compute_rosi, estimate_control_risk_reduction
from ..services.ai_service import assess_recommendations
from ..services.blast_radius import compute_blast_radius
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

    # 1. Base Organization Context
    org_ctx = OrgContext(
        sector=org.sector,
        size_tier=org.size_tier,
        employee_count=org.employee_count,
        annual_revenue_inr=org.annual_revenue_inr,
    )

    # 2. Simulated Organization Context (starts identical to base)
    sim_org_ctx = OrgContext(
        sector=org.sector,
        size_tier=org.size_tier,
        employee_count=org.employee_count,
        annual_revenue_inr=org.annual_revenue_inr,
    )

    # State modifications from scenario changes
    toggled_controls_data = []
    unavailable_asset_ids = set()
    global_cvss_shift = 0.0
    global_days_unpatched_shift = 0
    incident_response_multiplier = 1.0

    # Fallback to legacy single-toggles if no new array is passed
    if not payload.changes and (payload.scenario_type or payload.toggled_controls):
        if payload.scenario_type == "revenue_shift" and payload.numeric_shift is not None:
            shift_factor = 1.0 + (payload.numeric_shift / 100.0)
            sim_org_ctx.annual_revenue_inr = max(0.0, org.annual_revenue_inr * shift_factor)
        if payload.scenario_type == "downtime" and payload.target_id:
            unavailable_asset_ids.add(payload.target_id)
        for c in all_controls:
            effective_status = payload.toggled_controls.get(c.id, c.status)
            if payload.scenario_type == "control_toggle" and payload.target_id == c.id and payload.target_state:
                effective_status = payload.target_state
            toggled_controls_data.append({"name": c.name, "status": effective_status})
    else:
        # Process the new generic `changes` array
        # First initialize toggled_controls_data with base statuses
        controls_dict = {c.id: c.status for c in all_controls}
        for change in payload.changes:
            if change.change_type == "metric_shift" and change.target_id == "revenue" and change.value_num is not None:
                shift_factor = 1.0 + (change.value_num / 100.0)
                sim_org_ctx.annual_revenue_inr = max(0.0, org.annual_revenue_inr * shift_factor)
            elif change.change_type == "asset_availability" and change.target_id and change.value_str == "unavailable":
                unavailable_asset_ids.add(change.target_id)
            elif change.change_type == "control_toggle" and change.target_id and change.value_str:
                controls_dict[change.target_id] = change.value_str
            elif change.change_type == "global_vuln_shift" and change.target_id == "cvss" and change.value_num is not None:
                global_cvss_shift += change.value_num
            elif change.change_type == "global_vuln_shift" and change.target_id == "days_unpatched" and change.value_num is not None:
                global_days_unpatched_shift += int(change.value_num)
            elif change.change_type == "incident_response_shift" and change.value_num is not None:
                # E.g. -20% impact means multiplier is 0.8
                incident_response_multiplier *= max(0.0, (1.0 + (change.value_num / 100.0)))
        
        for c in all_controls:
            toggled_controls_data.append({"name": c.name, "status": controls_dict.get(c.id, c.status)})

    toggled_controls_ctx = ControlsContext.from_control_list(toggled_controls_data)

    original_eal = 0.0
    new_eal = 0.0
    all_new_traces = []

    # If downtime scenario, we don't calculate everything standardly, we want blast radius
    # But for a consistent result, we can calculate the normal base and then augment the delta.
    # Actually, we will calculate the base, then for downtime we calculate blast radius and consider that an *addition* to EAL.
    blast_radius_res = None
    affected_assets_count = None
    downstream_impact_inr = None

    if unavailable_asset_ids:
        # We need to run blast radius for all unavailable assets. For simplicity we just do it for the first one for now,
        # or combine them if there are multiple.
        # Let's just pick one if present. A robust solution would do a multi-source traversal.
        primary_target_id = next(iter(unavailable_asset_ids))
        
        # Load edges for blast radius
        asset_ids = {a.id for a in assets}
        edges_res = await db.execute(
            select(GraphEdge).where(
                GraphEdge.source_asset_id.in_(asset_ids) | GraphEdge.target_asset_id.in_(asset_ids)
            )
        )
        edges = edges_res.scalars().all()
        edge_dicts = [
            {
                "source_asset_id": e.source_asset_id,
                "target_asset_id": e.target_asset_id,
                "dependency_strength": e.dependency_strength,
            }
            for e in edges
        ]
        
        # Calculate base risk scores needed for blast radius EAL map
        asset_name_map = {}
        asset_eal_map = {}
        for a in assets:
            asset_name_map[a.id] = a.name
            vulns = [VulnContext(cvss_score=v.cvss_score, days_unpatched=v.days_unpatched, cve_id=v.cve_id, description=v.description) for v in a.vulnerabilities]
            actx = AssetContext(name=a.name, asset_type=a.asset_type, criticality_tag=a.criticality_tag, revenue_dependency_pct=a.revenue_dependency_pct)
            bres = compute_asset_risk(org_ctx, actx, vulns, base_controls_ctx)
            asset_eal_map[a.id] = bres.expected_annual_loss_inr
            
        blast_data = compute_blast_radius(primary_target_id, edge_dicts, asset_eal_map, asset_name_map)
        if blast_data:
            blast_radius_res = BlastRadiusResult(**blast_data)
            affected_assets_count = len(blast_radius_res.reachable_asset_ids)
            downstream_impact_inr = blast_radius_res.total_downstream_exposure_inr

    # Distributions
    dist_before = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    dist_after = {"critical": 0, "high": 0, "medium": 0, "low": 0}
    
    def get_risk_band(eal: float) -> str:
        if eal >= 10_000_000: return "critical"
        if eal >= 2_500_000: return "high"
        if eal >= 500_000: return "medium"
        return "low"

    for a in assets:
        # Base vulnerabilities
        vuln_ctxs = [
            VulnContext(
                cvss_score=v.cvss_score,
                days_unpatched=v.days_unpatched,
                cve_id=v.cve_id,
                description=v.description,
            )
            for v in a.vulnerabilities
        ]
        
        # Sim vulnerabilities with global shifts
        sim_vuln_ctxs = [
            VulnContext(
                cvss_score=min(10.0, max(0.0, (v.cvss_score or 0) + global_cvss_shift)),
                days_unpatched=max(0, (v.days_unpatched or 0) + global_days_unpatched_shift),
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
        original_eal += base_res.expected_annual_loss_inr
        dist_before[get_risk_band(base_res.expected_annual_loss_inr)] += 1
        
        if a.id in unavailable_asset_ids:
            # If the asset is down, its risk effectively fully materializes for this scenario.
            # We skip normal control evaluation for this specific asset.
            penalty = base_res.expected_annual_loss_inr * 2 # Arbitrary severe penalty for direct downtime
            new_eal += penalty
            dist_after["critical"] += 1
            all_new_traces.append({"rule_id": "DOWNTIME", "description": f"Simulated complete downtime for {a.name}", "contribution_inr": penalty, "rule_tier": "universal", "reason": "Asset unavailable"})
            continue
            
        new_res = compute_asset_risk(sim_org_ctx, asset_ctx, sim_vuln_ctxs, toggled_controls_ctx)
        
        # Apply incident response multiplier
        adjusted_new_eal = new_res.expected_annual_loss_inr * incident_response_multiplier
        
        new_eal += adjusted_new_eal
        dist_after[get_risk_band(adjusted_new_eal)] += 1
        
        # Update traces
        for t in new_res.as_dict_trace():
            if incident_response_multiplier != 1.0:
                t["contribution_inr"] *= incident_response_multiplier
            all_new_traces.append(t)

    if downstream_impact_inr:
        new_eal += downstream_impact_inr

    delta_inr = round(original_eal - new_eal, 2)
    delta_pct = round((delta_inr / max(original_eal, 1.0)) * 100.0, 1)

    # Pick representative top rule trace changes
    dedup_traces = []
    seen_rules = set()
    for t in all_new_traces:
        if t["rule_id"] not in seen_rules:
            seen_rules.add(t["rule_id"])
            dedup_traces.append(t)

    period_eal = period_service.to_period(original_eal, period, days)
    period_new_eal = period_service.to_period(new_eal, period, days)
    period_delta = period_service.to_period(delta_inr, period, days)
    period_lbl = period_service.period_label(period, days)
    try:
        period_eal_display = currency_service.convert_and_format(period_eal, currency)
        period_new_display = currency_service.convert_and_format(period_new_eal, currency)
        period_delta_display = currency_service.convert_and_format(period_delta, currency)
    except ValueError:
        period_eal_display = currency_service.convert_and_format(period_eal, "INR")
        period_new_display = currency_service.convert_and_format(period_new_eal, "INR")
        period_delta_display = currency_service.convert_and_format(period_delta, "INR")

    return WhatIfResult(
        original_eal_inr=round(period_eal, 2),
        original_eal_display=period_eal_display,
        new_eal_inr=round(period_new_eal, 2),
        new_eal_display=period_new_display,
        delta_inr=round(period_delta, 2),
        delta_display=period_delta_display,
        delta_pct=delta_pct,
        rule_trace=dedup_traces[:10],
        ai_mode="rules_only",
        period=period_lbl,
        period_eal_inr=round(period_eal, 2),
        period_eal_display=period_eal_display,
        period_delta_inr=round(period_delta, 2),
        period_delta_display=period_delta_display,
        affected_assets_count=affected_assets_count,
        downstream_impact_inr=round(downstream_impact_inr, 2) if downstream_impact_inr else None,
        downstream_impact_display=currency_service.convert_and_format(downstream_impact_inr, currency) if downstream_impact_inr else None,
        blast_radius_result=blast_radius_res,
        
        # New Rich Statistics
        affected_assets_total=len(assets),
        affected_assets_critical=sum(1 for a in assets if a.criticality_tag == "critical"),
        revenue_change_inr=round(sim_org_ctx.annual_revenue_inr - org_ctx.annual_revenue_inr, 2),
        revenue_change_display=currency_service.convert_and_format(sim_org_ctx.annual_revenue_inr - org_ctx.annual_revenue_inr, currency),
        cost_change_inr=0.0, # We're not simulating cost increases yet, but we could!
        risk_distribution_before=dist_before,
        risk_distribution_after=dist_after,
    )
