/**
 * services/demoData.ts — Realistic fallback demo data for "Suraksha Finance Ltd (BFSI · Mid)".
 * Used to guarantee all views render fully populated, working states even if backend is offline.
 */
import {
  Organization,
  Sheet,
  Asset,
  DashboardSummary,
  GraphData,
  BlastRadiusResult,
  Control,
  OptimizeResult,
  WhatIfResult,
  ComplianceSummary,
  DemoComparison,
} from '../types';

export const DEMO_ORG: Organization = {
  id: 'demo-suraksha-org-001',
  name: 'Suraksha Finance Ltd',
  sector: 'BFSI',
  size_tier: 'Mid',
  employee_count: 1200,
  annual_revenue_inr: 250000000, // ₹25 Cr
  created_at: new Date().toISOString(),
};

export const DEMO_SHEETS: Sheet[] = [
  {
    id: 'sheet-corp-it',
    org_id: DEMO_ORG.id,
    name: 'Corporate IT',
    type: 'base',
    is_org_wide_included: true,
    created_at: new Date().toISOString(),
    asset_count: 8,
    latest_eal_inr: 3450000,
    ai_mode: 'rules_only',
  },
  {
    id: 'sheet-payment-systems',
    org_id: DEMO_ORG.id,
    name: 'Payment Systems',
    type: 'base',
    is_org_wide_included: true,
    created_at: new Date().toISOString(),
    asset_count: 9,
    latest_eal_inr: 12850000,
    ai_mode: 'rules_only',
  },
  {
    id: 'sheet-cloud-infra',
    org_id: DEMO_ORG.id,
    name: 'Cloud Infra',
    type: 'base',
    is_org_wide_included: true,
    created_at: new Date().toISOString(),
    asset_count: 8,
    latest_eal_inr: 5200000,
    ai_mode: 'rules_only',
  },
  {
    id: 'sheet-branch-net',
    org_id: DEMO_ORG.id,
    name: 'Branch Network',
    type: 'base',
    is_org_wide_included: true,
    created_at: new Date().toISOString(),
    asset_count: 7,
    latest_eal_inr: 2950000,
    ai_mode: 'rules_only',
  },
];

export const DEMO_ASSETS: Record<string, Asset[]> = {
  'sheet-corp-it': [
    { id: 'asset-corp-1', sheet_id: 'sheet-corp-it', name: 'HR Manager Laptop', asset_type: 'Workstation', criticality_tag: 'admin_workstation', revenue_dependency_pct: 3.0, metadata_json: { software: 'Windows 11' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-corp-2', sheet_id: 'sheet-corp-it', name: 'IT Admin Workstation', asset_type: 'Workstation', criticality_tag: 'admin_workstation', revenue_dependency_pct: 5.0, metadata_json: { software: 'Ubuntu' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-corp-3', sheet_id: 'sheet-corp-it', name: 'Corp Email Server', asset_type: 'Server', criticality_tag: 'standard', revenue_dependency_pct: 8.0, metadata_json: { software: 'Exchange' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-corp-4', sheet_id: 'sheet-corp-it', name: 'Intranet Portal', asset_type: 'Web App', criticality_tag: 'standard', revenue_dependency_pct: 1.0, metadata_json: { software: 'Apache' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-corp-5', sheet_id: 'sheet-corp-it', name: 'VPN Gateway', asset_type: 'Network Device', criticality_tag: 'standard', revenue_dependency_pct: 2.0, metadata_json: { software: 'Fortinet' }, created_at: new Date().toISOString(), vulnerabilities: [{id: 'v-1', asset_id: 'asset-corp-5', cve_id: 'CVE-2024-1111', cvss_score: 9.8, description: 'VPN RCE', days_unpatched: 10, source: 'cve_match'}], risk_score: { expected_annual_loss_inr: 2500000, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-corp-6', sheet_id: 'sheet-corp-it', name: 'File Storage', asset_type: 'Database', criticality_tag: 'standard', revenue_dependency_pct: 2.0, metadata_json: { software: 'NAS' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-corp-7', sheet_id: 'sheet-corp-it', name: 'Active Directory', asset_type: 'Server', criticality_tag: 'admin_workstation', revenue_dependency_pct: 5.0, metadata_json: { software: 'Windows Server' }, created_at: new Date().toISOString(), vulnerabilities: [{id: 'v-2', asset_id: 'asset-corp-7', cve_id: 'CVE-2024-2222', cvss_score: 7.2, description: 'Privilege Escalation', days_unpatched: 5, source: 'cve_match'}], risk_score: { expected_annual_loss_inr: 950000, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-corp-8', sheet_id: 'sheet-corp-it', name: 'Employee Workstations (120)', asset_type: 'Endpoint', criticality_tag: 'standard', revenue_dependency_pct: 5.0, metadata_json: { software: 'Windows 10' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
  ],
  'sheet-payment-systems': [
    { id: 'asset-pay-1', sheet_id: 'sheet-payment-systems', name: 'Payment Gateway API', asset_type: 'API', criticality_tag: 'core_db', revenue_dependency_pct: 40.0, metadata_json: { software: 'NodeJS' }, created_at: new Date().toISOString(), vulnerabilities: [{id: 'v-3', asset_id: 'asset-pay-1', cve_id: 'CVE-2024-3333', cvss_score: 9.9, description: 'API Auth Bypass', days_unpatched: 45, source: 'cve_match'}], risk_score: { expected_annual_loss_inr: 8500000, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-2', sheet_id: 'sheet-payment-systems', name: 'Ledger DB', asset_type: 'Database', criticality_tag: 'core_db', revenue_dependency_pct: 30.0, metadata_json: { software: 'PostgreSQL' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-3', sheet_id: 'sheet-payment-systems', name: 'Message Queue', asset_type: 'Queue', criticality_tag: 'standard', revenue_dependency_pct: 10.0, metadata_json: { software: 'RabbitMQ' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-4', sheet_id: 'sheet-payment-systems', name: 'Transaction Auth DB', asset_type: 'Database', criticality_tag: 'standard', revenue_dependency_pct: 10.0, metadata_json: { software: 'Redis' }, created_at: new Date().toISOString(), vulnerabilities: [{id: 'v-4', asset_id: 'asset-pay-4', cve_id: 'CVE-2024-4444', cvss_score: 6.5, description: 'Memory Corruption', days_unpatched: 2, source: 'cve_match'}], risk_score: { expected_annual_loss_inr: 1250000, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-5', sheet_id: 'sheet-payment-systems', name: 'Settlement Service', asset_type: 'Service', criticality_tag: 'standard', revenue_dependency_pct: 10.0, metadata_json: { software: 'Spring Boot' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-6', sheet_id: 'sheet-payment-systems', name: 'Anti-Fraud Engine', asset_type: 'Service', criticality_tag: 'standard', revenue_dependency_pct: 5.0, metadata_json: { software: 'Python' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-7', sheet_id: 'sheet-payment-systems', name: 'Audit DB', asset_type: 'Database', criticality_tag: 'standard', revenue_dependency_pct: 0.0, metadata_json: { software: 'MySQL' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-8', sheet_id: 'sheet-payment-systems', name: 'Reporting Server', asset_type: 'Server', criticality_tag: 'standard', revenue_dependency_pct: 0.0, metadata_json: { software: 'Jasper' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-9', sheet_id: 'sheet-payment-systems', name: 'Partner API Gateway', asset_type: 'API', criticality_tag: 'standard', revenue_dependency_pct: 15.0, metadata_json: { software: 'Kong' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-10', sheet_id: 'sheet-payment-systems', name: 'Load Balancer', asset_type: 'Network Device', criticality_tag: 'standard', revenue_dependency_pct: 100.0, metadata_json: { software: 'NGINX' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-11', sheet_id: 'sheet-payment-systems', name: 'Core Firewall', asset_type: 'Network Device', criticality_tag: 'standard', revenue_dependency_pct: 100.0, metadata_json: { software: 'Palo Alto' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-12', sheet_id: 'sheet-payment-systems', name: 'Backup Server', asset_type: 'Server', criticality_tag: 'standard', revenue_dependency_pct: 0.0, metadata_json: { software: 'Veeam' }, created_at: new Date().toISOString(), vulnerabilities: [{id: 'v-5', asset_id: 'asset-pay-12', cve_id: 'CVE-2024-5555', cvss_score: 5.5, description: 'Backup bypass', days_unpatched: 1, source: 'cve_match'}], risk_score: { expected_annual_loss_inr: 500000, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-13', sheet_id: 'sheet-payment-systems', name: 'Monitoring Agent', asset_type: 'Service', criticality_tag: 'standard', revenue_dependency_pct: 0.0, metadata_json: { software: 'Datadog' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-14', sheet_id: 'sheet-payment-systems', name: 'Log Aggregator', asset_type: 'Database', criticality_tag: 'standard', revenue_dependency_pct: 0.0, metadata_json: { software: 'Elasticsearch' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-pay-15', sheet_id: 'sheet-payment-systems', name: 'CI/CD Worker', asset_type: 'Server', criticality_tag: 'standard', revenue_dependency_pct: 0.0, metadata_json: { software: 'GitLab Runner' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
  ],
  'sheet-cloud-infra': [
    { id: 'asset-cloud-1', sheet_id: 'sheet-cloud-infra', name: 'EKS Cluster', asset_type: 'Cloud Service', criticality_tag: 'standard', revenue_dependency_pct: 20.0, metadata_json: { cloud: 'AWS' }, created_at: new Date().toISOString(), vulnerabilities: [{id: 'v-6', asset_id: 'asset-cloud-1', cve_id: 'CVE-2023-5528', cvss_score: 7.2, description: 'Privilege Esc', days_unpatched: 60, source: 'cve_match'}], risk_score: { expected_annual_loss_inr: 1250000, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-cloud-2', sheet_id: 'sheet-cloud-infra', name: 'S3 Buckets', asset_type: 'Cloud Service', criticality_tag: 'standard', revenue_dependency_pct: 5.0, metadata_json: { cloud: 'AWS' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-cloud-3', sheet_id: 'sheet-cloud-infra', name: 'CloudFront CDN', asset_type: 'Cloud Service', criticality_tag: 'standard', revenue_dependency_pct: 10.0, metadata_json: { cloud: 'AWS' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-cloud-4', sheet_id: 'sheet-cloud-infra', name: 'IAM Roles', asset_type: 'Cloud Service', criticality_tag: 'standard', revenue_dependency_pct: 10.0, metadata_json: { cloud: 'AWS' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
  ],
  'sheet-branch-net': [
    { id: 'asset-branch-1', sheet_id: 'sheet-branch-net', name: 'Branch Routers', asset_type: 'Network Device', criticality_tag: 'standard', revenue_dependency_pct: 5.0, metadata_json: { software: 'Cisco' }, created_at: new Date().toISOString(), vulnerabilities: [], risk_score: { expected_annual_loss_inr: 0, rule_trace: [], ai_mode: 'rules_only' } },
    { id: 'asset-branch-2', sheet_id: 'sheet-branch-net', name: 'Teller PCs (450)', asset_type: 'Endpoint', criticality_tag: 'standard', revenue_dependency_pct: 15.0, metadata_json: { software: 'Windows 10' }, created_at: new Date().toISOString(), vulnerabilities: [{id: 'v-7', asset_id: 'asset-branch-2', cve_id: 'CVE-2024-6666', cvss_score: 8.8, description: 'Ransomware vector', days_unpatched: 20, source: 'cve_match'}], risk_score: { expected_annual_loss_inr: 2500000, rule_trace: [], ai_mode: 'rules_only' } },
  ],
};

export const DEMO_DASHBOARD: DashboardSummary = {
  org_id: DEMO_ORG.id,
  org_name: DEMO_ORG.name,
  total_eal_inr: 24450000, // ₹2.44 Cr
  total_assets: 32,
  critical_vulnerabilities: 7,
  sheets_breakdown: [
    { id: 'sheet-corp-it', name: 'Corporate IT', type: 'base', asset_count: 8, eal_inr: 3450000 },
    { id: 'sheet-payment-systems', name: 'Payment Systems', type: 'base', asset_count: 9, eal_inr: 12850000 },
    { id: 'sheet-cloud-infra', name: 'Cloud Infra', type: 'base', asset_count: 8, eal_inr: 5200000 },
    { id: 'sheet-branch-net', name: 'Branch Network', type: 'base', asset_count: 7, eal_inr: 2950000 },
  ],
  top_risky_assets: [
    {
      asset_id: 'asset-pay-1',
      asset_name: 'Core Banking Application Server',
      asset_type: 'Server',
      criticality_tag: 'payment_processing',
      eal_inr: 4850000,
      vuln_count: 1,
      top_cve: 'CVE-2021-44228',
    },
    {
      asset_id: 'asset-pay-2',
      asset_name: 'Payment Gateway (NPCI Integration)',
      asset_type: 'Web App',
      criticality_tag: 'payment_processing',
      eal_inr: 3650000,
      vuln_count: 1,
      top_cve: 'CVE-2022-22965',
    },
    {
      asset_id: 'asset-pay-3',
      asset_name: 'Customer Loan Management DB',
      asset_type: 'Database',
      criticality_tag: 'core_db',
      eal_inr: 1950000,
      vuln_count: 1,
      top_cve: 'CVE-2024-20953',
    },
    {
      asset_id: 'asset-cloud-2',
      asset_name: 'CI/CD Pipeline (Jenkins)',
      asset_type: 'Server',
      criticality_tag: 'admin_workstation',
      eal_inr: 1850000,
      vuln_count: 1,
      top_cve: 'CVE-2024-23897',
    },
    {
      asset_id: 'asset-cloud-1',
      asset_name: 'Kubernetes Cluster (EKS)',
      asset_type: 'Cloud Service',
      criticality_tag: 'standard',
      eal_inr: 1250000,
      vuln_count: 1,
      top_cve: 'CVE-2023-5528',
    },
  ],
  top_roi_controls: [
    {
      control_id: 'ctrl-edr',
      control_name: 'EDR (Endpoint Detection & Response)',
      cost_inr: 2500000,
      risk_reduction_inr: 11500000,
      roi_ratio: 4.6,
      status: 'absent',
    },
    {
      control_id: 'ctrl-backups',
      control_name: 'Immutable/Airgapped Backups',
      cost_inr: 1800000,
      risk_reduction_inr: 7200000,
      roi_ratio: 4.0,
      status: 'absent',
    },
    {
      control_id: 'ctrl-waf',
      control_name: 'Web Application Firewall (WAF)',
      cost_inr: 1200000,
      risk_reduction_inr: 4500000,
      roi_ratio: 3.8,
      status: 'absent',
    },
    {
      control_id: 'ctrl-pam',
      control_name: 'Privileged Access Management (PAM)',
      cost_inr: 3500000,
      risk_reduction_inr: 9800000,
      roi_ratio: 2.8,
      status: 'absent',
    },
    {
      control_id: 'ctrl-dlp',
      control_name: 'Data Loss Prevention (DLP)',
      cost_inr: 2200000,
      risk_reduction_inr: 5100000,
      roi_ratio: 2.3,
      status: 'absent',
    },
  ],
  compliance_iso27001: { satisfied: 9, total: 15, coverage_pct: 60.0 },
  compliance_rbi_csf: { satisfied: 6, total: 10, coverage_pct: 60.0 },
  ai_mode: 'rules_only',
};

export const DEMO_CONTROLS: Control[] = [
  { id: 'c-1', org_id: DEMO_ORG.id, name: 'Security Policy & Governance Framework', status: 'present', cost_inr: 500000, risk_reduction_inr: 0, roi_ratio: 0 },
  { id: 'c-2', org_id: DEMO_ORG.id, name: 'TLS/Data Encryption (in-transit & at-rest)', status: 'present', cost_inr: 800000, risk_reduction_inr: 0, roi_ratio: 0 },
  { id: 'c-3', org_id: DEMO_ORG.id, name: 'Audit Logging & Log Retention', status: 'present', cost_inr: 300000, risk_reduction_inr: 0, roi_ratio: 0 },
  { id: 'c-4', org_id: DEMO_ORG.id, name: 'Physical Access Controls (Data Center)', status: 'present', cost_inr: 1200000, risk_reduction_inr: 0, roi_ratio: 0 },
  { id: 'c-5', org_id: DEMO_ORG.id, name: 'Annual Security Awareness Training', status: 'present', cost_inr: 200000, risk_reduction_inr: 0, roi_ratio: 0 },
  { id: 'c-6', org_id: DEMO_ORG.id, name: 'Firewall & Perimeter Defense', status: 'present', cost_inr: 1500000, risk_reduction_inr: 0, roi_ratio: 0 },
  { id: 'c-7', org_id: DEMO_ORG.id, name: 'MFA on Admin Accounts', status: 'partial', cost_inr: 750000, risk_reduction_inr: 3200000, roi_ratio: 4.3 },
  { id: 'c-8', org_id: DEMO_ORG.id, name: 'Patch Management Program', status: 'partial', cost_inr: 600000, risk_reduction_inr: 2800000, roi_ratio: 4.7 },
  { id: 'c-9', org_id: DEMO_ORG.id, name: 'Vulnerability Scanning (Monthly)', status: 'partial', cost_inr: 400000, risk_reduction_inr: 1500000, roi_ratio: 3.8 },
  { id: 'c-10', org_id: DEMO_ORG.id, name: 'Network Segmentation & VLAN Isolation', status: 'partial', cost_inr: 2000000, risk_reduction_inr: 6500000, roi_ratio: 3.3 },
  { id: 'c-11', org_id: DEMO_ORG.id, name: 'SIEM & Security Monitoring (Basic)', status: 'partial', cost_inr: 3000000, risk_reduction_inr: 7800000, roi_ratio: 2.6 },
  { id: 'c-12', org_id: DEMO_ORG.id, name: 'EDR (Endpoint Detection & Response)', status: 'absent', cost_inr: 2500000, risk_reduction_inr: 11500000, roi_ratio: 4.6 },
  { id: 'c-13', org_id: DEMO_ORG.id, name: 'Immutable/Airgapped Backups', status: 'absent', cost_inr: 1800000, risk_reduction_inr: 7200000, roi_ratio: 4.0 },
  { id: 'c-14', org_id: DEMO_ORG.id, name: 'Privileged Access Management (PAM)', status: 'absent', cost_inr: 3500000, risk_reduction_inr: 9800000, roi_ratio: 2.8 },
  { id: 'c-15', org_id: DEMO_ORG.id, name: 'Data Loss Prevention (DLP)', status: 'absent', cost_inr: 2200000, risk_reduction_inr: 5100000, roi_ratio: 2.3 },
  { id: 'c-16', org_id: DEMO_ORG.id, name: 'Web Application Firewall (WAF)', status: 'absent', cost_inr: 1200000, risk_reduction_inr: 4500000, roi_ratio: 3.8 },
  { id: 'c-17', org_id: DEMO_ORG.id, name: 'Incident Response Plan (IRP)', status: 'absent', cost_inr: 800000, risk_reduction_inr: 2400000, roi_ratio: 3.0 },
  { id: 'c-18', org_id: DEMO_ORG.id, name: 'Zero Trust Network Access (ZTNA)', status: 'absent', cost_inr: 4000000, risk_reduction_inr: 6800000, roi_ratio: 1.7 },
];

export const DEMO_COMPARISON: DemoComparison = {
  msme_org: {
    id: 'org-msme',
    name: 'Kavach FinTech MSME',
    sector: 'BFSI',
    size_tier: 'MSME',
    employee_count: 80,
    annual_revenue_inr: 150000000, // ₹15 Cr
    created_at: new Date().toISOString(),
  },
  enterprise_org: {
    id: 'org-enterprise',
    name: 'Bharat Prime Bank',
    sector: 'BFSI',
    size_tier: 'Enterprise',
    employee_count: 8500,
    annual_revenue_inr: 50000000000, // ₹5000 Cr
    created_at: new Date().toISOString(),
  },
  msme_eal_inr: 840000,
  enterprise_eal_inr: 28650000,
  scaling_factor: 34.1,
  explanation:
    'An identical CVSS 9.4 Citrix Bleed vulnerability generates ₹8.4 Lakh EAL for an MSME, but ₹2.86 Crore for an enterprise due to transaction volume scaling, customer breach notification liability under DPDP Act 2023, and RBI regulatory penalty exposure.',
  msme_rule_trace: [
    { rule_id: 'R01', description: 'Base turnover calibration (₹15 Cr revenue)', contribution_inr: 450000, rule_tier: 'scale', reason: 'MSME revenue exposure' },
    { rule_id: 'R02', description: 'Unauthenticated session hijacking impact', contribution_inr: 280000, rule_tier: 'cvss', reason: 'CVSS 9.4 parameter' },
    { rule_id: 'R03', description: 'Statutory audit gap', contribution_inr: 110000, rule_tier: 'compliance', reason: '75 days unpatched' },
  ],
  enterprise_rule_trace: [
    { rule_id: 'R01', description: 'Base turnover calibration (₹5,000 Cr revenue)', contribution_inr: 16500000, rule_tier: 'scale', reason: 'Enterprise revenue exposure' },
    { rule_id: 'R02', description: 'Unauthenticated session hijacking on core gateway', contribution_inr: 7800000, rule_tier: 'cvss', reason: 'High concurrency session pool' },
    { rule_id: 'R04', description: 'RBI supervisory fine + DPDP Act statutory liability', contribution_inr: 4350000, rule_tier: 'regulatory', reason: 'Max statutory fine bracket' },
  ],
};

export const DEMO_OPTIMIZE_RESULT: OptimizeResult = {
  selected_controls: [
    { id: 'opt-1', org_id: DEMO_ORG.id, control_id: 'c-12', control_name: 'EDR (Endpoint Detection & Response)', risk_reduction_inr: 11500000, cost_inr: 2500000, roi_ratio: 4.6 },
    { id: 'opt-2', org_id: DEMO_ORG.id, control_id: 'c-13', control_name: 'Immutable/Airgapped Backups', risk_reduction_inr: 7200000, cost_inr: 1800000, roi_ratio: 4.0 },
    { id: 'opt-3', org_id: DEMO_ORG.id, control_id: 'c-8', control_name: 'Patch Management Program Upgrade', risk_reduction_inr: 2800000, cost_inr: 600000, roi_ratio: 4.7 },
  ],
  total_cost_inr: 4900000,
  total_risk_reduction_inr: 21500000,
  rosi_curve: [
    { cumulative_investment_inr: 0, cumulative_risk_reduction_inr: 0, control_name: 'Baseline', roi_ratio: 0 },
    { cumulative_investment_inr: 600000, cumulative_risk_reduction_inr: 2800000, control_name: 'Patch Management Program', roi_ratio: 4.7 },
    { cumulative_investment_inr: 3100000, cumulative_risk_reduction_inr: 14300000, control_name: 'EDR Deployment', roi_ratio: 4.6 },
    { cumulative_investment_inr: 4900000, cumulative_risk_reduction_inr: 21500000, control_name: 'Airgapped Backups', roi_ratio: 4.0 },
    { cumulative_investment_inr: 6100000, cumulative_risk_reduction_inr: 26000000, control_name: 'WAF', roi_ratio: 3.8 },
  ],
  ai_rationale:
    'Prioritizing EDR and Immutable Backups addresses the primary ransomware blast vectors in the Corporate IT and Payment Systems segments, returning ₹4.40 in risk reduction per rupee invested.',
  ai_mode: 'rules_only',
};

export const DEMO_WHATIF_RESULT: WhatIfResult = {
  original_eal_inr: 24450000,
  new_eal_inr: 12950000,
  delta_inr: 11500000,
  delta_pct: 47.0,
  rule_trace: [
    { rule_id: 'W01', description: 'EDR deployment suppresses lateral movement across 17 monitored nodes', contribution_inr: 11500000, rule_tier: 'what_if', reason: 'Maturity upgrade absent -> present' },
  ],
  ai_mode: 'rules_only',
};

export const DEMO_COMPLIANCE_RBI: ComplianceSummary = {
  framework: 'RBI_CSF',
  total_clauses: 10,
  satisfied: 6,
  gaps: 4,
  coverage_pct: 60.0,
  ai_narrative:
    'Suraksha Finance Ltd satisfies baseline governance and TLS encryption standards. The principal supervisory gaps relate to absent Endpoint Detection (RBI-CSF-7.1) and missing Immutable Backups (RBI-CSF-8.1).',
  ai_mode: 'rules_only',
  gaps_list: [
    { id: 'rbi-1', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-1.1', clause_title: 'Cyber Security Policy & Board-Level Governance', status: 'satisfied', control_name: 'Security Policy & Governance Framework' },
    { id: 'rbi-2', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-2.1', clause_title: 'Privileged Access Management (PAM & Dual Control)', status: 'gap', control_name: 'Privileged Access Management (PAM)' },
    { id: 'rbi-3', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-3.1', clause_title: 'Mandatory MFA for Critical Banking Infrastructure', status: 'satisfied', control_name: 'MFA on Admin Accounts' },
    { id: 'rbi-4', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-3.2', clause_title: 'Network Segmentation (Core Banking vs Perimeter)', status: 'satisfied', control_name: 'Network Segmentation & VLAN Isolation' },
    { id: 'rbi-5', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-4.1', clause_title: 'Strict Patch & Known Exploit Remediation SLA', status: 'satisfied', control_name: 'Patch Management Program' },
    { id: 'rbi-6', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-5.1', clause_title: 'End-to-End Financial Data Encryption (TLS 1.3)', status: 'satisfied', control_name: 'TLS/Data Encryption (in-transit & at-rest)' },
    { id: 'rbi-7', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-5.2', clause_title: 'Data Loss Prevention across Customer Transaction Channels', status: 'gap', control_name: 'Data Loss Prevention (DLP)' },
    { id: 'rbi-8', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-6.1', clause_title: 'Cyber Crisis Management Plan & 6-Hour CERT-In Reporting', status: 'gap', control_name: 'Incident Response Plan (IRP)' },
    { id: 'rbi-9', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-7.1', clause_title: 'Security Operations Center (SOC) & SIEM 24/7 Telemetry', status: 'satisfied', control_name: 'SIEM & Security Monitoring (Basic)' },
    { id: 'rbi-10', org_id: DEMO_ORG.id, framework: 'RBI_CSF', clause_ref: 'RBI-CSF-8.1', clause_title: 'Air-Gapped Golden Copies & Business Continuity Backups', status: 'gap', control_name: 'Immutable/Airgapped Backups' },
  ],
};

export const DEMO_COMPLIANCE_ISO: ComplianceSummary = {
  framework: 'ISO27001',
  total_clauses: 15,
  satisfied: 9,
  gaps: 6,
  coverage_pct: 60.0,
  ai_narrative:
    'ISO/IEC 27001:2022 Annex A evaluation indicates strong perimeter defenses, but unaddressed gaps in technical vulnerability management and backup immutability.',
  ai_mode: 'rules_only',
  gaps_list: [
    { id: 'iso-1', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.5.1.1', clause_title: 'Policies for Information Security', status: 'satisfied', control_name: 'Security Policy & Governance Framework' },
    { id: 'iso-2', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.6.1.2', clause_title: 'Segregation of Duties & Access Control', status: 'gap', control_name: null },
    { id: 'iso-3', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.8.1.1', clause_title: 'Inventory and Ownership of Assets', status: 'gap', control_name: null },
    { id: 'iso-4', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.9.4.2', clause_title: 'Secure Log-on Procedures (MFA Enforcement)', status: 'satisfied', control_name: 'MFA on Admin Accounts' },
    { id: 'iso-5', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.9.4.4', clause_title: 'Use of Privileged Utility Programs', status: 'gap', control_name: null },
    { id: 'iso-6', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.10.1.1', clause_title: 'Policy on Use of Cryptographic Controls', status: 'satisfied', control_name: 'TLS/Data Encryption (in-transit & at-rest)' },
    { id: 'iso-7', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.12.2.1', clause_title: 'Controls Against Malware (EDR Detection)', status: 'gap', control_name: null },
    { id: 'iso-8', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.12.3.1', clause_title: 'Information Backup & Immutable Retention', status: 'gap', control_name: null },
    { id: 'iso-9', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.12.6.1', clause_title: 'Management of Technical Vulnerabilities (Patching)', status: 'satisfied', control_name: 'Patch Management Program' },
    { id: 'iso-10', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.13.1.1', clause_title: 'Network Security Controls & Segmentation', status: 'satisfied', control_name: 'Network Segmentation & VLAN Isolation' },
    { id: 'iso-11', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.13.2.1', clause_title: 'Information Transfer Policies (DLP Protection)', status: 'gap', control_name: null },
    { id: 'iso-12', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.14.2.5', clause_title: 'Secure System Development & WAF', status: 'satisfied', control_name: 'Firewall & Perimeter Defense' },
    { id: 'iso-13', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.16.1.1', clause_title: 'Responsibilities and Procedures for Incident Response', status: 'satisfied', control_name: 'Annual Security Awareness Training' },
    { id: 'iso-14', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.16.1.4', clause_title: 'Assessment & Monitoring of Security Events (SIEM)', status: 'satisfied', control_name: 'SIEM & Security Monitoring (Basic)' },
    { id: 'iso-15', org_id: DEMO_ORG.id, framework: 'ISO27001', clause_ref: 'A.18.1.3', clause_title: 'Protection of Records & Immutable Audit Logs', status: 'satisfied', control_name: 'Audit Logging & Log Retention' },
  ],
};

export const DEMO_GRAPH_DATA: Record<string, GraphData> = {
  default: {
    sheet_id: 'sheet-corp-it',
    sheet_name: 'Corporate IT',
    sheet_type: 'base',
    node_count: 8,
    edge_count: 5,
    elements: [
      { group: 'nodes', data: { id: 'asset-corp-1', label: 'HR Manager Laptop', asset_type: 'Workstation', criticality_tag: 'admin_workstation', eal_inr: 280000, risk_level: 'medium', cves: ['CVE-2024-21412'], revenue_dependency_pct: 3 } },
      { group: 'nodes', data: { id: 'asset-corp-2', label: 'IT Admin Workstation', asset_type: 'Workstation', criticality_tag: 'admin_workstation', eal_inr: 420000, risk_level: 'medium', cves: ['CVE-2023-4911'], revenue_dependency_pct: 5 } },
      { group: 'nodes', data: { id: 'asset-corp-3', label: 'Corporate Email Server', asset_type: 'Server', criticality_tag: 'standard', eal_inr: 950000, risk_level: 'high', cves: ['CVE-2024-21410'], revenue_dependency_pct: 8 } },
      { group: 'nodes', data: { id: 'asset-corp-4', label: 'Corporate VPN Gateway', asset_type: 'Network Device', criticality_tag: 'standard', eal_inr: 1100000, risk_level: 'critical', cves: ['CVE-2024-21762'], revenue_dependency_pct: 10 } },
      { group: 'nodes', data: { id: 'asset-corp-5', label: 'Active Directory Domain Controller', asset_type: 'Server', criticality_tag: 'admin_workstation', eal_inr: 520000, risk_level: 'medium', cves: ['CVE-2024-30078'], revenue_dependency_pct: 15 } },
      { group: 'nodes', data: { id: 'asset-corp-6', label: 'Intranet Web Portal', asset_type: 'Web App', criticality_tag: 'standard', eal_inr: 120000, risk_level: 'low', cves: ['CVE-2024-21733'], revenue_dependency_pct: 4 } },
      { group: 'nodes', data: { id: 'asset-corp-7', label: 'File Server (NAS)', asset_type: 'Server', criticality_tag: 'backup_system', eal_inr: 80000, risk_level: 'low', cves: ['CVE-2023-2729'], revenue_dependency_pct: 6 } },
      { group: 'nodes', data: { id: 'asset-corp-8', label: 'CCTV Security Server', asset_type: 'Server', criticality_tag: 'standard', eal_inr: 0, risk_level: 'low', cves: [], revenue_dependency_pct: 1 } },
      { group: 'edges', data: { id: 'e1', source: 'asset-corp-1', target: 'asset-corp-4', strength: 'moderate' } },
      { group: 'edges', data: { id: 'e2', source: 'asset-corp-2', target: 'asset-corp-4', strength: 'strong' } },
      { group: 'edges', data: { id: 'e3', source: 'asset-corp-2', target: 'asset-corp-5', strength: 'strong' } },
      { group: 'edges', data: { id: 'e4', source: 'asset-corp-4', target: 'asset-corp-5', strength: 'strong' } },
      { group: 'edges', data: { id: 'e5', source: 'asset-corp-5', target: 'asset-corp-3', strength: 'moderate' } },
    ],
  },
};

export const DEMO_BLAST_RADIUS: BlastRadiusResult = {
  origin_asset_id: 'asset-corp-1',
  origin_asset_name: 'HR Manager Laptop',
  reachable_asset_ids: ['asset-corp-4', 'asset-corp-5', 'asset-corp-3'],
  reachable_asset_names: ['Corporate VPN Gateway', 'Active Directory Domain Controller', 'Corporate Email Server'],
  total_downstream_exposure_inr: 2570000,
  hop_count: 3,
  traversal_path: [
    { asset_id: 'asset-corp-4', asset_name: 'Corporate VPN Gateway', strength: 'moderate' },
    { asset_id: 'asset-corp-5', asset_name: 'Active Directory Domain Controller', strength: 'strong' },
    { asset_id: 'asset-corp-3', asset_name: 'Corporate Email Server', strength: 'moderate' },
  ],
};
