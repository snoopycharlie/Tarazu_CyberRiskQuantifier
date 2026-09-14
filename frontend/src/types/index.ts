/**
 * Types matching Tarazu CyberRiskQuant backend schemas.
 */

export interface MoneyDisplay {
  value: number;
  formatted: string;
}

export interface Organization {
  id: string;
  name: string;
  sector: string;
  size_tier: 'MSME' | 'Mid' | 'Enterprise' | string;
  employee_count: number;
  annual_revenue_inr: number;
  created_at: string;
}

export interface Sheet {
  id: string;
  org_id: string;
  name: string;
  type: 'base' | 'combined';
  source_sheet_ids?: string[];
  is_org_wide_included: boolean;
  created_at: string;
  asset_count?: number;
  latest_eal_inr?: number;
  ai_mode?: string;
}

export interface Vulnerability {
  id: string;
  asset_id: string;
  cve_id?: string | null;
  cvss_score?: number | null;
  description: string;
  days_unpatched: number;
  source: string;
  created_at?: string;
}

export interface RuleTraceItem {
  rule_id: string;
  description: string;
  contribution_inr: number;
  contribution_display?: MoneyDisplay | null;
  rule_tier: string;
  reason: string;
}

export interface RiskScore {
  expected_annual_loss_inr: number;
  rule_trace: RuleTraceItem[];
  ai_narrative?: string | null;
  ai_adjustment_pct?: number | null;
  ai_mode: string;
  computed_at?: string;
}

export interface Asset {
  id: string;
  sheet_id: string;
  name: string;
  asset_type: string;
  criticality_tag: string;
  revenue_dependency_pct: number;
  metadata_json?: Record<string, any>;
  created_at: string;
  vulnerabilities: Vulnerability[];
  risk_score?: RiskScore | null;
}

export interface GraphElement {
  group: 'nodes' | 'edges';
  data: {
    id: string;
    label?: string;
    source?: string;
    target?: string;
    strength?: string;
    asset_type?: string;
    criticality_tag?: string;
    eal_inr?: number;
    risk_level?: 'critical' | 'high' | 'medium' | 'low';
    sheet_id?: string;
    sheet_name?: string;
    cves?: string[];
    vuln_count?: number;
    revenue_dependency_pct?: number;
  };
}

export interface GraphData {
  sheet_id: string;
  sheet_name: string;
  sheet_type: string;
  node_count: number;
  edge_count: number;
  elements: GraphElement[];
}

export interface BlastRadiusResult {
  origin_asset_id: string;
  origin_asset_name: string;
  reachable_asset_ids: string[];
  reachable_asset_names: string[];
  total_downstream_exposure_inr: number;
  total_downstream_exposure_display?: MoneyDisplay | null;
  hop_count: number;
  traversal_path: Array<{
    asset_id: string;
    asset_name: string;
    strength: string;
  }>;
}

export interface Control {
  id: string;
  org_id: string;
  name: string;
  status: 'present' | 'absent' | 'partial';
  cost_inr: number;
  cost_display?: MoneyDisplay | null;
  risk_reduction_inr: number;
  risk_reduction_display?: MoneyDisplay | null;
  roi_ratio: number;
  framework_clause_refs?: Record<string, string>;
}

export interface ROSIPoint {
  cumulative_investment_inr: number;
  cumulative_risk_reduction_inr: number;
  control_name: string;
  roi_ratio: number;
}

export interface OptimizeResult {
  selected_controls: Array<{
    id: string;
    org_id: string;
    control_id: string;
    control_name: string;
    risk_reduction_inr: number;
    cost_inr: number;
    roi_ratio: number;
    ai_rationale?: string | null;
  }>;
  total_cost_inr: number;
  total_risk_reduction_inr: number;
  rosi_curve: ROSIPoint[];
  ai_rationale?: string | null;
  ai_mode: string;
}

export interface ScenarioChange {
  change_type: string;
  target_id?: string;
  value_str?: string;
  value_num?: number;
}

export interface WhatIfRequest {
  org_id: string;
  scenario_id?: string;
  changes: ScenarioChange[];
  // Legacy fields
  sheet_id?: string;
  toggled_controls?: Record<string, string>;
  scenario_type?: string;
  target_id?: string;
  target_state?: string;
  numeric_shift?: number;
}

export interface WhatIfResult {
  currency?: string;
  original_eal_inr: number;
  original_eal_display?: MoneyDisplay;
  new_eal_inr: number;
  new_eal_display?: MoneyDisplay;
  delta_inr: number;
  delta_display?: MoneyDisplay;
  delta_pct: number;
  rule_trace: any[];
  ai_mode: string;
  period?: string;
  period_eal_inr?: number;
  period_eal_display?: MoneyDisplay;
  period_delta_inr?: number;
  period_delta_display?: MoneyDisplay;
  
  affected_assets_count?: number;
  downstream_impact_inr?: number;
  downstream_impact_display?: MoneyDisplay;
  blast_radius_result?: BlastRadiusResult;
  
  affected_assets_total?: number;
  affected_assets_critical?: number;
  revenue_change_inr?: number;
  revenue_change_display?: MoneyDisplay;
  cost_change_inr?: number;
  cost_change_display?: MoneyDisplay;
  risk_distribution_before?: Record<string, number>;
  risk_distribution_after?: Record<string, number>;
}

export interface ComplianceGapItem {
  id: string;
  org_id: string;
  framework: string;
  clause_ref: string;
  clause_title: string;
  status: 'satisfied' | 'gap';
  linked_control_id?: string | null;
  control_name?: string | null;
}

export interface ComplianceSummary {
  framework: string;
  total_clauses: number;
  satisfied: number;
  gaps: number;
  coverage_pct: number;
  gaps_list: ComplianceGapItem[];
  ai_narrative?: string | null;
  ai_mode: string;
}

export interface DemoComparison {
  msme_org: Organization;
  enterprise_org: Organization;
  msme_eal_inr: number;
  enterprise_eal_inr: number;
  msme_rule_trace: RuleTraceItem[];
  enterprise_rule_trace: RuleTraceItem[];
  scaling_factor: number;
  explanation: string;
}

export interface CorrelationResult {
  combined_sheet_id: string;
  naive_sum_inr: number;
  adjusted_inr: number;
  adjustment_pct: number;
  cross_edge_count: number;
  ai_narrative?: string | null;
  ai_mode: string;
}

export interface DashboardSummary {
  org_id: string;
  org_name: string;
  total_eal_inr: number;
  total_eal_display?: MoneyDisplay | null;
  total_assets: number;
  critical_vulnerabilities: number;
  sheets_breakdown: Array<{
    id: string;
    name: string;
    type: string;
    asset_count: number;
    eal_inr: number;
    eal_display?: MoneyDisplay | null;
  }>;
  top_risky_assets: Array<{
    asset_id: string;
    asset_name: string;
    asset_type: string;
    criticality_tag: string;
    eal_inr: number;
    eal_display?: MoneyDisplay | null;
    vuln_count: number;
    top_cve?: string | null;
    top_cve_nvd_url?: string | null;
  }>;
  top_roi_controls: Array<{
    control_id: string;
    control_name: string;
    cost_inr: number;
    cost_display?: MoneyDisplay | null;
    risk_reduction_inr: number;
    risk_reduction_display?: MoneyDisplay | null;
    roi_ratio: number;
    status: string;
  }>;
  compliance_iso27001: {
    satisfied: number;
    total: number;
    coverage_pct: number;
  };
  compliance_rbi_csf: {
    satisfied: number;
    total: number;
    coverage_pct: number;
  };
  ai_mode: string;
}

export interface CVEMatch {
  cve_id: string;
  cvss_score?: number | null;
  cvss_severity?: string | null;
  description: string;
  published?: string | null;
  nvd_url?: string | null;
}
