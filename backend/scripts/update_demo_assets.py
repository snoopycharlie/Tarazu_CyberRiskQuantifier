import re

# This script overrides the DEMO_ASSETS and DEMO_GRAPH_PAYMENTS in demoData.ts to make them larger and have a healthy distribution

demo_assets_str = """export const DEMO_ASSETS: Record<string, Asset[]> = {
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
"""

demo_graph_payments_str = """export const DEMO_GRAPH_PAYMENTS: GraphData = {
  elements: [
    { data: { id: 'asset-pay-11', label: 'Core Firewall', asset_type: 'Network Device', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-10', label: 'Load Balancer', asset_type: 'Network Device', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-9', label: 'Partner API Gateway', asset_type: 'API', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-1', label: 'Payment Gateway API', asset_type: 'API', risk_level: 'critical' }, group: 'nodes' },
    { data: { id: 'asset-pay-6', label: 'Anti-Fraud Engine', asset_type: 'Service', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-5', label: 'Settlement Service', asset_type: 'Service', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-3', label: 'Message Queue', asset_type: 'Queue', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-4', label: 'Transaction Auth DB', asset_type: 'Database', risk_level: 'high' }, group: 'nodes' },
    { data: { id: 'asset-pay-2', label: 'Ledger DB', asset_type: 'Database', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-7', label: 'Audit DB', asset_type: 'Database', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-8', label: 'Reporting Server', asset_type: 'Server', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-12', label: 'Backup Server', asset_type: 'Server', risk_level: 'medium' }, group: 'nodes' },
    { data: { id: 'asset-pay-13', label: 'Monitoring Agent', asset_type: 'Service', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-14', label: 'Log Aggregator', asset_type: 'Database', risk_level: 'low' }, group: 'nodes' },
    { data: { id: 'asset-pay-15', label: 'CI/CD Worker', asset_type: 'Server', risk_level: 'low' }, group: 'nodes' },

    { data: { id: 'edge-1', source: 'asset-pay-11', target: 'asset-pay-10' }, group: 'edges' },
    { data: { id: 'edge-2', source: 'asset-pay-10', target: 'asset-pay-9' }, group: 'edges' },
    { data: { id: 'edge-3', source: 'asset-pay-10', target: 'asset-pay-1' }, group: 'edges' },
    { data: { id: 'edge-4', source: 'asset-pay-9', target: 'asset-pay-1' }, group: 'edges' },
    { data: { id: 'edge-5', source: 'asset-pay-1', target: 'asset-pay-6' }, group: 'edges' },
    { data: { id: 'edge-6', source: 'asset-pay-1', target: 'asset-pay-5' }, group: 'edges' },
    { data: { id: 'edge-7', source: 'asset-pay-1', target: 'asset-pay-3' }, group: 'edges' },
    { data: { id: 'edge-8', source: 'asset-pay-6', target: 'asset-pay-4' }, group: 'edges' },
    { data: { id: 'edge-9', source: 'asset-pay-5', target: 'asset-pay-2' }, group: 'edges' },
    { data: { id: 'edge-10', source: 'asset-pay-3', target: 'asset-pay-2' }, group: 'edges' },
    { data: { id: 'edge-11', source: 'asset-pay-2', target: 'asset-pay-7' }, group: 'edges' },
    { data: { id: 'edge-12', source: 'asset-pay-7', target: 'asset-pay-8' }, group: 'edges' },
    { data: { id: 'edge-13', source: 'asset-pay-2', target: 'asset-pay-12' }, group: 'edges' },
    { data: { id: 'edge-14', source: 'asset-pay-13', target: 'asset-pay-14' }, group: 'edges' },
    { data: { id: 'edge-15', source: 'asset-pay-15', target: 'asset-pay-1' }, group: 'edges' },
  ],
};
"""

with open(r"c:\Users\Lenovo\Desktop\Main\Projects\SIH_26105\frontend\src\services\demoData.ts", "r", encoding="utf-8") as f:
    content = f.read()

# Replace DEMO_ASSETS
content = re.sub(
    r"export const DEMO_ASSETS: Record<string, Asset\[\]> = \{.*?\};\n(?!.*export const DEMO_ASSETS)", 
    demo_assets_str, 
    content, 
    flags=re.DOTALL
)

# Replace DEMO_GRAPH_PAYMENTS
content = re.sub(
    r"export const DEMO_GRAPH_PAYMENTS: GraphData = \{.*?\}\};\n", 
    demo_graph_payments_str, 
    content, 
    flags=re.DOTALL
)

with open(r"c:\Users\Lenovo\Desktop\Main\Projects\SIH_26105\frontend\src\services\demoData.ts", "w", encoding="utf-8") as f:
    f.write(content)
