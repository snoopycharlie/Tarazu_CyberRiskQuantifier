"""
services/optimizer.py — Greedy control investment optimizer for Tarazu.

Uses risk_reduction_inr / cost_inr as the efficiency metric.
Selects controls greedily up to the budget constraint.
Generates ROSI (Return on Security Investment) curve data.
"""
from __future__ import annotations
from dataclasses import dataclass


@dataclass
class ControlCandidate:
    control_id: str
    control_name: str
    status: str
    cost_inr: float
    risk_reduction_inr: float
    roi_ratio: float


def compute_rosi(
    controls: list[dict],
    budget_inr: float,
    overridden_statuses: dict[str, str] | None = None,
    max_risk_reduction_inr: float | None = None,
) -> dict:
    """
    Greedy knapsack optimization over the control list.

    Controls are ranked by ROI (risk_reduction / cost).
    Items with status="present" are skipped (already implemented).
    Returns selected controls + ROSI curve data points.

    Args:
        controls: list of control dicts with keys: id, name, status, cost_inr, risk_reduction_inr
        budget_inr: available investment budget in ₹
        overridden_statuses: {control_id: new_status} for live what-if analysis
    """
    overrides = overridden_statuses or {}

    candidates: list[ControlCandidate] = []
    for c in controls:
        cid = c["id"]
        effective_status = overrides.get(cid, c.get("status", "absent"))
        if effective_status == "present":
            continue  # already implemented, no ROI to gain

        cost = max(c.get("cost_inr", 0.0), 1.0)  # prevent div/0
        reduction = c.get("risk_reduction_inr", 0.0)

        # Partial credit: partial status gives 50% reduction already, so net is 50%
        if effective_status == "partial":
            reduction = reduction * 0.5
            cost = cost * 0.5  # also costs half (already partially deployed)

        roi = reduction / cost if cost > 0 else 0.0
        candidates.append(ControlCandidate(
            control_id=cid,
            control_name=c.get("name", ""),
            status=effective_status,
            cost_inr=cost,
            risk_reduction_inr=reduction,
            roi_ratio=roi,
        ))

    # Sort by ROI descending (greedy by efficiency)
    candidates.sort(key=lambda x: x.roi_ratio, reverse=True)

    selected: list[ControlCandidate] = []
    remaining_budget = budget_inr
    cumulative_cost = 0.0
    cumulative_reduction = 0.0
    rosi_curve: list[dict] = []

    # Always add a baseline point (origin)
    rosi_curve.append({
        "cumulative_investment_inr": 0.0,
        "cumulative_risk_reduction_inr": 0.0,
        "control_name": "(Baseline)",
        "roi_ratio": 0.0,
    })

    for candidate in candidates:
        if max_risk_reduction_inr is not None and cumulative_reduction >= max_risk_reduction_inr:
            break
        if candidate.cost_inr > remaining_budget:
            continue  # can't afford this one

        if max_risk_reduction_inr is not None:
            remaining_reduction = max(max_risk_reduction_inr - cumulative_reduction, 0.0)
            if remaining_reduction <= 0:
                break
            if candidate.risk_reduction_inr > remaining_reduction:
                candidate = ControlCandidate(
                    control_id=candidate.control_id,
                    control_name=candidate.control_name,
                    status=candidate.status,
                    cost_inr=candidate.cost_inr,
                    risk_reduction_inr=remaining_reduction,
                    roi_ratio=remaining_reduction / candidate.cost_inr,
                )

        selected.append(candidate)
        remaining_budget -= candidate.cost_inr
        cumulative_cost += candidate.cost_inr
        cumulative_reduction += candidate.risk_reduction_inr

        rosi_curve.append({
            "cumulative_investment_inr": round(cumulative_cost, 2),
            "cumulative_risk_reduction_inr": round(cumulative_reduction, 2),
            "control_name": candidate.control_name,
            "roi_ratio": round(candidate.roi_ratio, 2),
        })

    return {
        "selected_controls": [
            {
                "control_id": s.control_id,
                "control_name": s.control_name,
                "risk_reduction_inr": round(s.risk_reduction_inr, 2),
                "cost_inr": round(s.cost_inr, 2),
                "roi_ratio": round(s.roi_ratio, 2),
            }
            for s in selected
        ],
        "total_cost_inr": round(sum(s.cost_inr for s in selected), 2),
        "total_risk_reduction_inr": round(sum(s.risk_reduction_inr for s in selected), 2),
        "rosi_curve": rosi_curve,
    }


def estimate_control_risk_reduction(
    control_name: str,
    org_annual_revenue_inr: float,
    total_eal_inr: float,
) -> float:
    """
    Estimate risk reduction for a control based on its name.
    Used for seeding and for new controls without explicit risk_reduction_inr.
    Based on industry benchmarks (IBM CODB, Verizon DBIR).
    """
    name_lower = control_name.lower()
    rev = org_annual_revenue_inr
    eal = total_eal_inr

    # Calibrated reduction percentages per control type
    if "mfa" in name_lower:
        return eal * 0.35       # MFA removes ~35% EAL (major credential theft vector)
    elif "edr" in name_lower or "endpoint detection" in name_lower:
        return eal * 0.28       # EDR reduces dwell time dramatically
    elif "backup" in name_lower or "immutable" in name_lower:
        return eal * 0.22       # Critical for ransomware recovery cost
    elif "patch" in name_lower:
        return eal * 0.20       # Timely patching removes most CVE exposure
    elif "vulnerability scan" in name_lower:
        return eal * 0.15       # Scanning enables faster patching
    elif "network segmentation" in name_lower:
        return eal * 0.18       # Limits lateral movement blast radius
    elif "dlp" in name_lower or "data loss" in name_lower:
        return eal * 0.12       # DLP limits data exfiltration impact
    elif "privileged access" in name_lower or "pam" in name_lower:
        return eal * 0.25       # PAM is high-impact for BFSI sector
    elif "encryption" in name_lower or "tls" in name_lower:
        return eal * 0.10       # Encryption reduces breach severity
    elif "incident response" in name_lower:
        return eal * 0.15       # Faster response reduces breach cost
    elif "siem" in name_lower or "security monitoring" in name_lower:
        return eal * 0.18       # Monitoring improves detection probability
    elif "web application firewall" in name_lower or "waf" in name_lower:
        return eal * 0.14       # WAF protects customer-facing assets
    elif "awareness" in name_lower or "training" in name_lower:
        return eal * 0.08       # Training reduces phishing/social engineering
    else:
        return eal * 0.10       # Generic control — 10% EAL reduction estimate
