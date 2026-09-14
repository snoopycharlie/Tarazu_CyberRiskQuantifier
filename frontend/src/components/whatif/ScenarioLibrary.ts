import { ScenarioChange } from '../../types';

export type ControlInputType = 'asset_select' | 'slider' | 'control_toggle';

export interface ScenarioInputConfig {
  id: string;
  label: string;
  type: ControlInputType;
  default_num?: number;
  min_num?: number;
  max_num?: number;
  step?: number;
  unit?: string;
  // What change_type this input maps to
  change_type: string;
  // If target is static (like 'revenue' or 'cvss'), set it here.
  // If dynamic (like asset selection), leave undefined.
  target_id?: string;
}

export interface ScenarioTemplate {
  id: string;
  category: 'Cyber Risk & Policy' | 'Business & Operations';
  name: string;
  description: string;
  icon: string; // lucide icon name
  inputs: ScenarioInputConfig[];
  // Static changes that always happen when this scenario runs
  static_changes?: ScenarioChange[];
}

export const SCENARIO_LIBRARY: ScenarioTemplate[] = [
  // ── Cyber Risk & Policy ──────────────────────────────────────────────────
  {
    id: "crp_critical_outage",
    category: "Cyber Risk & Policy",
    name: "Critical Asset Outage",
    description: "Simulate a critical asset becoming unavailable and calculate cascading network impact.",
    icon: "Network",
    inputs: [
      { id: "asset_target", label: "Select Offline System", type: "asset_select", change_type: "asset_availability" }
    ],
    static_changes: []
  },
  {
    id: "crp_ransomware",
    category: "Cyber Risk & Policy",
    name: "Ransomware Incident",
    description: "Simulate a severe ransomware infection impacting critical data stores and taking systems offline.",
    icon: "ShieldAlert",
    inputs: [
      { id: "asset_target", label: "Entry Point System", type: "asset_select", change_type: "asset_availability" },
      { id: "response_delay", label: "Incident Severity (+ Damage)", type: "slider", min_num: 10, max_num: 300, step: 10, default_num: 100, unit: "%", change_type: "incident_response_shift" }
    ],
  },
  {
    id: "crp_patch_delay",
    category: "Cyber Risk & Policy",
    name: "Security Patch Delay",
    description: "Simulate delaying critical patches globally, increasing CVSS exposure across all assets.",
    icon: "Clock",
    inputs: [
      { id: "days_delayed", label: "Additional Days Unpatched", type: "slider", min_num: 0, max_num: 180, step: 5, default_num: 30, unit: " days", change_type: "global_vuln_shift", target_id: "days_unpatched" },
      { id: "cvss_increase", label: "Average CVSS Increase", type: "slider", min_num: 0, max_num: 4.0, step: 0.1, default_num: 1.5, unit: " pts", change_type: "global_vuln_shift", target_id: "cvss" }
    ]
  },
  {
    id: "crp_patch_accel",
    category: "Cyber Risk & Policy",
    name: "Patch Acceleration",
    description: "Simulate faster deployment of security patches, reducing the window of vulnerability.",
    icon: "FastForward",
    inputs: [
      { id: "days_reduced", label: "Days Saved in Patch Cycle", type: "slider", min_num: -90, max_num: 0, step: 5, default_num: -15, unit: " days", change_type: "global_vuln_shift", target_id: "days_unpatched" }
    ]
  },
  {
    id: "crp_vendor_risk",
    category: "Cyber Risk & Policy",
    name: "Vendor Risk Increase",
    description: "Simulate increased risk from a third-party supply chain provider.",
    icon: "Briefcase",
    inputs: [
      { id: "severity_increase", label: "Vendor Risk Severity Multiplier", type: "slider", min_num: 0, max_num: 200, step: 10, default_num: 50, unit: "%", change_type: "incident_response_shift" }
    ]
  },
  {
    id: "crp_mfa_adoption",
    category: "Cyber Risk & Policy",
    name: "MFA Adoption",
    description: "Simulate the financial impact of rolling out Multi-Factor Authentication universally.",
    icon: "Key",
    inputs: [],
    static_changes: [
      { change_type: "control_toggle", target_id: "ctrl-mfa-01", value_str: "present" }
    ]
  },
  {
    id: "crp_data_breach",
    category: "Cyber Risk & Policy",
    name: "Data Breach",
    description: "Simulate the exposure of sensitive customer information.",
    icon: "Database",
    inputs: [
      { id: "severity_increase", label: "Fines & Reputation Damage Multiplier", type: "slider", min_num: 0, max_num: 500, step: 25, default_num: 150, unit: "%", change_type: "incident_response_shift" }
    ]
  },
  {
    id: "crp_access_tighten",
    category: "Cyber Risk & Policy",
    name: "Access Control Tightening",
    description: "Simulate the implementation of Zero Trust architecture and stricter access controls.",
    icon: "Lock",
    inputs: [],
    static_changes: [
      { change_type: "control_toggle", target_id: "ctrl-pam-01", value_str: "present" },
      { change_type: "control_toggle", target_id: "ctrl-ztna-01", value_str: "present" }
    ]
  },
  {
    id: "crp_backup_fail",
    category: "Cyber Risk & Policy",
    name: "Backup Failure",
    description: "Simulate the failure of backup systems during a recovery operation.",
    icon: "HardDrive",
    inputs: [
      { id: "recovery_penalty", label: "Recovery Time Penalty", type: "slider", min_num: 0, max_num: 300, step: 20, default_num: 100, unit: "%", change_type: "incident_response_shift" }
    ]
  },
  {
    id: "crp_incident_resp",
    category: "Cyber Risk & Policy",
    name: "Incident Response Improvement",
    description: "Simulate reducing incident response time to mitigate financial damage.",
    icon: "Zap",
    inputs: [
      { id: "mitigation", label: "Damage Mitigation (Reduced impact)", type: "slider", min_num: -80, max_num: -10, step: 5, default_num: -30, unit: "%", change_type: "incident_response_shift" }
    ]
  },
  {
    id: "crp_policy_enforce",
    category: "Cyber Risk & Policy",
    name: "Security Policy Custom Controls",
    description: "Toggle individual security controls on or off to assess financial ROI.",
    icon: "ShieldCheck",
    inputs: [
      { id: "custom_control", label: "Toggle Controls Below", type: "control_toggle", change_type: "control_toggle" }
    ]
  },
  
  // ── Business & Operations ────────────────────────────────────────────────
  {
    id: "bo_revenue_change",
    category: "Business & Operations",
    name: "Global Revenue Shift",
    description: "Simulate macroeconomic changes affecting global organization revenue.",
    icon: "TrendingUp",
    inputs: [
      { id: "rev_shift", label: "Revenue Change", type: "slider", min_num: -50, max_num: 100, step: 5, default_num: -15, unit: "%", change_type: "metric_shift", target_id: "revenue" }
    ]
  },
  {
    id: "bo_cost_increase",
    category: "Business & Operations",
    name: "Operating Cost Spike",
    description: "Simulate sudden increases in operating costs (Note: WIP on backend).",
    icon: "TrendingDown",
    inputs: [
      { id: "cost_shift", label: "Cost Increase", type: "slider", min_num: 0, max_num: 100, step: 5, default_num: 20, unit: "%", change_type: "metric_shift", target_id: "cost" }
    ]
  },
  {
    id: "bo_transaction_spike",
    category: "Business & Operations",
    name: "Transaction Volume Spike",
    description: "Simulate a sudden spike in transaction volume and resulting stress.",
    icon: "Activity",
    inputs: [
      { id: "rev_shift", label: "Implied Revenue / Volume Growth", type: "slider", min_num: 0, max_num: 300, step: 10, default_num: 50, unit: "%", change_type: "metric_shift", target_id: "revenue" }
    ]
  },
  {
    id: "bo_cloud_disruption",
    category: "Business & Operations",
    name: "Cloud Service Disruption",
    description: "Simulate a major AWS/Azure region going offline.",
    icon: "CloudOff",
    inputs: [
      { id: "asset_target", label: "Select Primary Cloud Gateway", type: "asset_select", change_type: "asset_availability" },
      { id: "sla_penalty", label: "SLA Penalty Multiplier", type: "slider", min_num: 0, max_num: 100, step: 10, default_num: 20, unit: "%", change_type: "incident_response_shift" }
    ]
  }
];
