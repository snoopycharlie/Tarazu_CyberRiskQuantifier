"""
app/schemas.py — Pydantic v2 schemas for request/response validation.
"""
from __future__ import annotations
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict


# ── Organization ──────────────────────────────────────────────────────────────

class OrgCreate(BaseModel):
    name: str
    sector: str = "BFSI"
    size_tier: str = "Mid"
    employee_count: int = Field(default=100, ge=1)
    annual_revenue_inr: float = Field(default=0.0, ge=0)


class OrgOut(OrgCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime


# ── Sheet ─────────────────────────────────────────────────────────────────────

class SheetCreate(BaseModel):
    org_id: str
    name: str
    type: str = "base"
    source_sheet_ids: Optional[list[str]] = None
    is_org_wide_included: bool = True


class SheetOut(SheetCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime


# ── Asset ─────────────────────────────────────────────────────────────────────

class AssetCreate(BaseModel):
    sheet_id: str
    name: str
    asset_type: str = "Server"
    criticality_tag: str = "standard"
    revenue_dependency_pct: float = Field(default=5.0, ge=0.0, le=100.0)
    metadata_json: Optional[dict[str, Any]] = None


class AssetOut(AssetCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime


# ── Vulnerability ─────────────────────────────────────────────────────────────

class VulnCreate(BaseModel):
    asset_id: str
    cve_id: Optional[str] = None
    cvss_score: Optional[float] = Field(default=None, ge=0.0, le=10.0)
    description: str = ""
    days_unpatched: int = Field(default=0, ge=0)
    source: str = "manual"


class VulnOut(VulnCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime


# ── Control ───────────────────────────────────────────────────────────────────

class ControlCreate(BaseModel):
    org_id: str
    name: str
    status: str = "absent"
    cost_inr: float = Field(default=0.0, ge=0)
    framework_clause_refs: Optional[dict[str, str]] = None


class ControlOut(ControlCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str


class ControlUpdate(BaseModel):
    status: Optional[str] = None
    cost_inr: Optional[float] = None


# ── Rule Trace Entry ──────────────────────────────────────────────────────────

class RuleTraceEntry(BaseModel):
    rule_id: str
    description: str
    contribution_inr: float
    rule_tier: str  # "universal" | "sector"
    reason: str


# ── Risk Score ────────────────────────────────────────────────────────────────

class RiskScoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    sheet_id: Optional[str]
    asset_id: Optional[str]
    expected_annual_loss_inr: float
    computed_at: datetime
    rule_trace: Optional[list[dict]]
    ai_narrative: Optional[str]
    ai_adjustment_pct: Optional[float]
    ai_mode: str  # "rules_only" | "ai_assisted"


# ── Graph Edge ────────────────────────────────────────────────────────────────

class EdgeCreate(BaseModel):
    sheet_id: str
    source_asset_id: str
    target_asset_id: str
    dependency_strength: str = "moderate"


class EdgeOut(EdgeCreate):
    model_config = ConfigDict(from_attributes=True)
    id: str
    created_at: datetime


# ── Blast Radius ──────────────────────────────────────────────────────────────

class BlastRadiusResult(BaseModel):
    origin_asset_id: str
    origin_asset_name: str
    reachable_asset_ids: list[str]
    reachable_asset_names: list[str]
    total_downstream_exposure_inr: float
    hop_count: int
    traversal_path: list[dict]  # [{asset_id, asset_name, strength}]


# ── Recommendation ────────────────────────────────────────────────────────────

class RecommendationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    control_id: str
    control_name: str
    risk_reduction_inr: float
    cost_inr: float
    roi_ratio: float
    ai_rationale: Optional[str]


# ── Optimizer ─────────────────────────────────────────────────────────────────

class OptimizeRequest(BaseModel):
    org_id: str
    budget_inr: float
    overridden_statuses: Optional[dict[str, str]] = None  # {control_id: "present"|"absent"}


class ROSIPoint(BaseModel):
    cumulative_investment_inr: float
    cumulative_risk_reduction_inr: float
    control_name: str
    roi_ratio: float


class OptimizeResult(BaseModel):
    selected_controls: list[RecommendationOut]
    total_cost_inr: float
    total_risk_reduction_inr: float
    rosi_curve: list[ROSIPoint]
    ai_rationale: Optional[str]
    ai_mode: str


# ── Compliance ────────────────────────────────────────────────────────────────

class ComplianceGapOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    org_id: str
    framework: str
    clause_ref: str
    clause_title: str
    status: str
    linked_control_id: Optional[str]
    control_name: Optional[str] = None


class ComplianceSummary(BaseModel):
    framework: str
    total_clauses: int
    satisfied: int
    gaps: int
    coverage_pct: float
    gaps_list: list[ComplianceGapOut]
    ai_narrative: Optional[str]
    ai_mode: str


# ── NVD CVE ───────────────────────────────────────────────────────────────────

class CVEMatch(BaseModel):
    cve_id: str
    cvss_score: Optional[float]
    cvss_severity: Optional[str]
    description: str
    published: Optional[str]


# ── Combined Sheet Correlation ─────────────────────────────────────────────────

class CorrelationResult(BaseModel):
    combined_sheet_id: str
    naive_sum_inr: float
    adjusted_inr: float
    adjustment_pct: float
    cross_edge_count: int
    ai_narrative: Optional[str]
    ai_mode: str


# ── Dashboard & Reporting ──────────────────────────────────────────────────────

class RiskCategoryBreakdown(BaseModel):
    technical_eal_inr: float
    technical_pct: float
    identity_eal_inr: float
    identity_pct: float
    supply_chain_eal_inr: float
    supply_chain_pct: float
    operational_eal_inr: float
    operational_pct: float


class IncidentCostBreakdown(BaseModel):
    downtime_inr: float
    regulatory_fines_inr: float
    customer_churn_inr: float
    forensics_ir_inr: float
    reputation_loss_inr: float
    total_exposure_inr: float


class PeerBenchmark(BaseModel):
    sector: str
    sector_avg_eal_inr: float
    sector_avg_risk_score: float
    org_risk_score: float
    org_eal_inr: float
    benchmark_status: str
    percentile: float


class RiskTrendPoint(BaseModel):
    label: str
    timestamp: str
    eal_inr: float
    risk_score: float


class CISOQueryRequest(BaseModel):
    org_id: str
    query: str


class CISOQueryResponse(BaseModel):
    answer: str
    citations: list[str]
    ai_mode: str


class DashboardSummary(BaseModel):
    org_id: str
    org_name: str
    total_eal_inr: float
    total_assets: int
    critical_vulnerabilities: int
    sheets_breakdown: list[dict]
    top_risky_assets: list[dict]
    top_roi_controls: list[dict]
    compliance_overview: list[dict] = []
    compliance_iso27001: Optional[dict] = None
    compliance_rbi_csf: Optional[dict] = None
    category_breakdown: Optional[RiskCategoryBreakdown] = None
    incident_cost_breakdown: Optional[IncidentCostBreakdown] = None
    peer_benchmark: Optional[PeerBenchmark] = None
    risk_trend: list[RiskTrendPoint] = []
    ai_mode: str


# ── What-If ───────────────────────────────────────────────────────────────────

class WhatIfRequest(BaseModel):
    org_id: str
    sheet_id: Optional[str] = None
    toggled_controls: dict[str, str]  # {control_id: "present"|"absent"|"partial"}


class WhatIfResult(BaseModel):
    original_eal_inr: float
    new_eal_inr: float
    delta_inr: float
    delta_pct: float
    rule_trace: list[dict]
    ai_mode: str


# ── Demo Comparison ───────────────────────────────────────────────────────────

class DemoComparison(BaseModel):
    msme_org: OrgOut
    enterprise_org: OrgOut
    msme_eal_inr: float
    enterprise_eal_inr: float
    msme_rule_trace: list[dict]
    enterprise_rule_trace: list[dict]
    scaling_factor: float
    explanation: str
