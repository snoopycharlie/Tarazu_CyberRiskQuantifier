"""
services/correlation_engine.py — Correlation / Combination Engine for Tarazu (Module 6).

Implements 20 deterministic correlation rules that calculate compounding financial risk
when combining infrastructure segments based on graph topology, cross-segment edges,
and asset criticality, followed by AI reasoning layer escalation.
"""
from __future__ import annotations
from dataclasses import dataclass
from typing import Optional, Any


@dataclass
class CorrelationRuleResult:
    rule_id: str
    description: str
    adjustment_delta_pct: float
    reason: str


@dataclass
class CorrelationOutput:
    naive_sum_inr: float
    adjusted_inr: float
    compounding_adjustment_pct: float
    cross_edge_count: int
    rule_trace: list[CorrelationRuleResult]
    ai_escalation_needed: bool


def evaluate_sheet_correlation(
    sheet_names: list[str],
    naive_sum_inr: float,
    cross_edges: list[dict[str, Any]],  # [{src_name, tgt_name, src_type, tgt_type, src_crit, tgt_crit, strength, src_cvss}]
    controls_present: list[str],        # e.g. ["Network Segmentation", "ZTNA", "MFA"]
    org_sector: str = "BFSI",
) -> CorrelationOutput:
    """
    Run 20 deterministic rules to calculate compounding risk percentage over naive arithmetic sum.
    """
    trace: list[CorrelationRuleResult] = []
    accumulated_pct: float = 0.0

    edge_count = len(cross_edges)

    # ── Rule C01: Zero cross-segment dependencies ─────────────────────────────
    if edge_count == 0:
        trace.append(CorrelationRuleResult(
            rule_id="C01_ZERO_CROSS_DEPENDENCIES",
            description="No cross-segment dependency edges detected",
            adjustment_delta_pct=0.0,
            reason="Independent infrastructure segments operate in isolation. Combined risk equals pure arithmetic sum (0% compounding).",
        ))
        return CorrelationOutput(
            naive_sum_inr=naive_sum_inr,
            adjusted_inr=naive_sum_inr,
            compounding_adjustment_pct=0.0,
            cross_edge_count=0,
            rule_trace=trace,
            ai_escalation_needed=False,
        )

    # ── Rule C02: Low Edge Density Baseline ───────────────────────────────────
    if 1 <= edge_count <= 2:
        trace.append(CorrelationRuleResult(
            rule_id="C02_LOW_EDGE_DENSITY",
            description=f"Minimal cross-segment interconnections ({edge_count} edges)",
            adjustment_delta_pct=3.0,
            reason="Small number of perimeter links introduces slight operational coupling (+3%).",
        ))
        accumulated_pct += 3.0

    # ── Rule C03: High Edge Density & High Coupling ───────────────────────────
    if edge_count >= 5:
        density_adj = min(15.0, 5.0 + (edge_count * 1.5))
        trace.append(CorrelationRuleResult(
            rule_id="C03_HIGH_COUPLING_DENSITY",
            description=f"Dense multi-segment interconnectivity ({edge_count} cross-sheet edges)",
            adjustment_delta_pct=density_adj,
            reason=f"Multiple lateral paths create extensive attack surfaces across segment boundaries (+{density_adj:.1f}%).",
        ))
        accumulated_pct += density_adj

    # ── Rule C04: Single Point of Failure (SPOF) Cascade ──────────────────────
    src_counts: dict[str, int] = {}
    for e in cross_edges:
        src = e.get("src_name", "src")
        src_counts[src] = src_counts.get(src, 0) + 1
    spofs = [src for src, count in src_counts.items() if count >= 3]
    if spofs:
        trace.append(CorrelationRuleResult(
            rule_id="C04_SPOF_CASCADE_RISK",
            description=f"Single Point of Failure asset '{spofs[0]}' drives multiple downstream segments",
            adjustment_delta_pct=12.0,
            reason="Compromise of a high-fanout gateway triggers simultaneous multi-sheet outage (+12%).",
        ))
        accumulated_pct += 12.0

    # ── Rule C05: Workstation Pivot into Production Core ──────────────────────
    has_workstation_to_core = any(
        e.get("src_type") == "Workstation" and e.get("tgt_crit") in ("core_db", "payment_processing", "crown_jewel")
        for e in cross_edges
    )
    if has_workstation_to_core:
        trace.append(CorrelationRuleResult(
            rule_id="C05_WORKSTATION_TO_CORE_PIVOT",
            description="Direct lateral movement path from user workstation segment to crown jewel database",
            adjustment_delta_pct=16.0,
            reason="Phished employee workstation directly bridges into core production database without DMZ (+16%).",
        ))
        accumulated_pct += 16.0

    # ── Rule C06: Payment Switch to Public Portal Link ────────────────────────
    has_portal_to_payment = any(
        e.get("src_crit") == "customer_portal" and e.get("tgt_crit") == "payment_processing"
        for e in cross_edges
    )
    if has_portal_to_payment:
        trace.append(CorrelationRuleResult(
            rule_id="C06_PORTAL_TO_PAYMENT_PIPELINE",
            description="Exposed web portal directly communicates with Payment Switch",
            adjustment_delta_pct=14.0,
            reason="Public attack surface can forge API payloads directly into payment execution layer (+14%).",
        ))
        accumulated_pct += 14.0

    # ── Rule C07: Branch Network to Corporate Core VPN ────────────────────────
    has_branch_to_core = any(
        "branch" in str(e.get("src_name", "")).lower() and ("core" in str(e.get("tgt_name", "")).lower() or "db" in str(e.get("tgt_name", "")).lower())
        for e in cross_edges
    )
    if has_branch_to_core:
        trace.append(CorrelationRuleResult(
            rule_id="C07_REMOTE_BRANCH_INFILTRATION",
            description="Physical branch office network has persistent VPN trust into central headquarters",
            adjustment_delta_pct=10.0,
            reason="Weak branch physical security allows local rogue implant to access centralized banking assets (+10%).",
        ))
        accumulated_pct += 10.0

    # ── Rule C08: Cloud to On-Prem Hybrid Database Replication ────────────────
    has_cloud_to_db = any(
        e.get("src_type") == "Cloud Resource" and e.get("tgt_type") == "Database"
        for e in cross_edges
    )
    if has_cloud_to_db:
        trace.append(CorrelationRuleResult(
            rule_id="C08_HYBRID_CLOUD_SYNC_EXPOSURE",
            description="Cloud container workloads have continuous synchronization with on-prem core database",
            adjustment_delta_pct=8.0,
            reason="Cloud API key leakage directly exposes on-prem database tables (+8%).",
        ))
        accumulated_pct += 8.0

    # ── Rule C09: Critical Dependency Strength Weighting ──────────────────────
    strong_edges = [e for e in cross_edges if e.get("strength") == "strong"]
    if strong_edges:
        strong_adj = min(10.0, len(strong_edges) * 3.0)
        trace.append(CorrelationRuleResult(
            rule_id="C09_STRONG_DEPENDENCY_COUPLING",
            description=f"{len(strong_edges)} strong architectural dependency edges detected",
            adjustment_delta_pct=strong_adj,
            reason=f"Strong dependencies mean target asset cannot function if source is disrupted (+{strong_adj:.1f}%).",
        ))
        accumulated_pct += strong_adj

    # ── Rule C10: Multiple Crown Jewels Spanned Across Sheets ─────────────────
    crown_jewels = set()
    for e in cross_edges:
        if e.get("src_crit") in ("core_db", "crown_jewel", "payment_processing"):
            crown_jewels.add(e.get("src_name"))
        if e.get("tgt_crit") in ("core_db", "crown_jewel", "payment_processing"):
            crown_jewels.add(e.get("tgt_name"))
    if len(crown_jewels) >= 2:
        trace.append(CorrelationRuleResult(
            rule_id="C10_SYSTEMIC_MULTI_CROWN_JEWEL",
            description=f"Combined view spans {len(crown_jewels)} distinct crown-jewel assets",
            adjustment_delta_pct=15.0,
            reason="Concurrent exposure of multiple critical business functions multiplies corporate insolvency risk (+15%).",
        ))
        accumulated_pct += 15.0

    # ── Rule C11: Vulnerable Boundary Node (CVSS >= 8.5 on Cross Edge) ────────
    high_cvss_edges = [e for e in cross_edges if (e.get("src_cvss") or 0.0) >= 8.5]
    if high_cvss_edges:
        trace.append(CorrelationRuleResult(
            rule_id="C11_VULNERABLE_INTERCONNECT_GATEWAY",
            description="Interconnecting boundary node possesses unpatched CVSS ≥ 8.5 vulnerability",
            adjustment_delta_pct=12.0,
            reason="Attacker can exploit the interconnect gateway itself to compromise both segments simultaneously (+12%).",
        ))
        accumulated_pct += 12.0

    # ── Rule C12: Third-Party Supply Chain Bridge ─────────────────────────────
    has_vendor_bridge = any("vendor" in str(e.get("src_name", "")).lower() or "partner" in str(e.get("src_name", "")).lower() for e in cross_edges)
    if has_vendor_bridge:
        trace.append(CorrelationRuleResult(
            rule_id="C12_SUPPLY_CHAIN_CROSS_PIVOT",
            description="External vendor / contractor connection bridges internal segments",
            adjustment_delta_pct=11.0,
            reason="Third-party vendor credentials lack MFA, bypassing segmentation (+11%).",
        ))
        accumulated_pct += 11.0

    # ── Rule C13: Active Directory / Identity Sync Spanning Sheets ────────────
    has_id_bridge = any(e.get("src_type") == "Identity/IAM" or e.get("tgt_type") == "Identity/IAM" for e in cross_edges)
    if has_id_bridge:
        trace.append(CorrelationRuleResult(
            rule_id="C13_SHARED_IDENTITY_DOMAIN_PIVOT",
            description="Shared Active Directory / IAM infrastructure spans combined segments",
            adjustment_delta_pct=14.0,
            reason="Compromise of Kerberos/NTLM in one segment immediately grants Domain Admin rights across all combined sheets (+14%).",
        ))
        accumulated_pct += 14.0

    # ── Rule C14: Missing Network Segmentation Penalty ────────────────────────
    controls_lower = [c.lower() for c in controls_present]
    if not any("segmentation" in c or "vlan" in c for c in controls_lower):
        trace.append(CorrelationRuleResult(
            rule_id="C14_ABSENT_MICROSEGMENTATION",
            description="Organization lacks Network Segmentation & VLAN Isolation",
            adjustment_delta_pct=10.0,
            reason="Flat network topology allows unhindered lateral traversal (+10%).",
        ))
        accumulated_pct += 10.0

    # ── Rule C15: Zero Trust Access Mitigation (Credit) ───────────────────────
    if any("zero trust" in c or "ztna" in c for c in controls_lower):
        trace.append(CorrelationRuleResult(
            rule_id="C15_ZTNA_MICROSEGMENTATION_DAMPENING",
            description="Zero Trust Network Access (ZTNA) active across sheets: dampening applied",
            adjustment_delta_pct=-8.0,
            reason="Continuous identity validation and least-privilege tunnels prevent automatic lateral hop (-8%).",
        ))
        accumulated_pct -= 8.0

    # ── Rule C16: Network Firewall Dampening (Credit) ──────────────────────────
    if any("segmentation" in c or "firewall" in c for c in controls_lower):
        trace.append(CorrelationRuleResult(
            rule_id="C16_PERIMETER_FIREWALL_DAMPENING",
            description="Internal firewall filtering verified: dampening compounding exposure",
            adjustment_delta_pct=-6.0,
            reason="Stateful inspection blocks unapproved port forwarding across segments (-6%).",
        ))
        accumulated_pct -= 6.0

    # ── Rule C17: Sector-Specific BFSI Transaction Interconnect ───────────────
    if org_sector == "BFSI" and any(e.get("tgt_crit") == "payment_processing" for e in cross_edges):
        trace.append(CorrelationRuleResult(
            rule_id="C17_SECTOR_BFSI_INTERCONNECT",
            description="BFSI Sector: cross-sheet transaction flow creates RBI systemic risk",
            adjustment_delta_pct=8.0,
            reason="Interconnected banking pipelines trigger mandatory RBI Cyber Security Framework contagion audits (+8%).",
        ))
        accumulated_pct += 8.0

    # ── Rule C18: Sector-Specific Healthcare ePHI Egress ──────────────────────
    if org_sector == "Healthcare" and any(e.get("src_crit") == "core_db" for e in cross_edges):
        trace.append(CorrelationRuleResult(
            rule_id="C18_SECTOR_HEALTHCARE_EPHI_FLOW",
            description="Healthcare Sector: patient database egress across network boundary",
            adjustment_delta_pct=9.0,
            reason="Cross-segment medical record flow increases DPDP Act liability surface (+9%).",
        ))
        accumulated_pct += 9.0

    # ── Rule C19: Multi-Sheet Triangulation (≥3 Source Sheets) ────────────────
    if len(sheet_names) >= 3:
        multi_adj = 5.0
        trace.append(CorrelationRuleResult(
            rule_id="C19_MULTI_SEGMENT_TRIANGULATION",
            description=f"Combined view aggregates {len(sheet_names)} distinct enterprise segments",
            adjustment_delta_pct=multi_adj,
            reason="Broad cross-organizational visibility reveals systemic dependencies (+5%).",
        ))
        accumulated_pct += multi_adj

    # ── Rule C20: Bounding and Cap ────────────────────────────────────────────
    # Compounding adjustment is bounded between -10% (strict controls) and +45% (cascading failure)
    final_adj_pct = max(-10.0, min(45.0, accumulated_pct))
    if final_adj_pct != accumulated_pct:
        trace.append(CorrelationRuleResult(
            rule_id="C20_COMPOUNDING_BOUND_CAP",
            description="Compounding risk adjustment normalized within calibrated bounds [-10%, +45%]",
            adjustment_delta_pct=0.0,
            reason=f"Raw calculation {accumulated_pct:+.1f}% clamped to safe statistical envelope: {final_adj_pct:+.1f}%.",
        ))

    adjusted_inr = round(naive_sum_inr * (1.0 + (final_adj_pct / 100.0)), 2)

    return CorrelationOutput(
        naive_sum_inr=naive_sum_inr,
        adjusted_inr=adjusted_inr,
        compounding_adjustment_pct=final_adj_pct,
        cross_edge_count=edge_count,
        rule_trace=trace,
        ai_escalation_needed=edge_count > 0,
    )
