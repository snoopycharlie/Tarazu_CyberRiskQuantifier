# Tarazu CyberRiskQuant — Comprehensive Context Handoff

> This document is a complete, living handoff for any developer, contributor, or AI agent picking up this codebase. It is intentionally exhaustive. Nothing important about the project should require reading source files to discover.

---

## 1. Project Identity

| Field | Value |
|---|---|
| **Project Name** | Tarazu (तराज़ू, Hindi for scales/balance) |
| **Full Name** | CyberRiskQuant — AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform |
| **Hackathon** | Smart India Hackathon 2026, Problem Statement SIH26105 |
| **Sponsor** | All India Council for Technical Education (AICTE) |
| **Theme** | Blockchain and Cybersecurity |
| **Prize** | INR 1,00,000 |
| **Deadline** | 20 September 2026 |
| **Demo Org** | "Suraksha Finance Ltd" (fictional Indian NBFC, seeded on startup) |

---

## 2. The Problem Being Solved

Organizations describe cyber risk in vague qualitative labels ("Low/Medium/High") instead of financial terms, and risk assessments are periodic and manual rather than continuous. This leaves boards, CFOs, and regulators without real, actionable, up-to-date visibility into what cyber risk actually costs them and where to spend limited security budgets.

### Why existing tools fall short

- Foreign GRC tools map to generic ISO/NIST, not India-specific regulations (RBI CSF, SEBI CSCRF, CERT-In directions, DPDP Act 2023).
- Big-4 GRC consulting is unaffordable for MSMEs.
- AI-only or black-box tools produce indefensible numbers that auditors reject.
- Point-in-time assessments go stale; there is no continuous view.

### Tarazu's answer

Rules-first quantification engine (30+ deterministic rules) that resolves most cases cheaply and auditably, with AI used only for bounded calibration (±30%) and plain-English narrative. Every output is traceable to specific rules + AI reasoning — defensible to auditors, boards, and regulators.

---

## 3. Core Design Principles

### 3.1 Rules-Before-AI (mandatory, non-negotiable)

```
Structured Input
    → Rules Engine (deterministic, 20-30 rules per module)
        → [most cases resolved]
        → [residual: unresolved / ambiguous / needs judgment]
            → AI Reasoning Layer (Groq Llama-3.3-70B)
                → calibrated output + explanation
```

- The rules engine runs FIRST for every quantification. The AI layer is never run without the rules engine having produced a prior.
- AI adjustments are hard-bounded at ±30%. The AI cannot invent a number; it can only shift the rules-engine output.
- If GROQ_API_KEY is absent or Groq fails, the system silently falls back to rules-only — it NEVER crashes.
- Every response includes `ai_mode`: either `"rules_only"` or `"ai_assisted"`.

### 3.2 FAIR-Inspired Formula

```
EAL = (SLE_base * SLE_multiplier * LEF_accumulator) + fixed_additions
```

Where:
- `SLE_base = (annual_revenue_inr * revenue_dependency_pct/100 * 0.05) + (employee_count * 15_000)` — floor: INR 1 lakh
- Tier multiplier: MSME × 0.6, Mid × 1.0, Enterprise × 2.2
- `LEF_accumulator` starts at 0.10 (10% baseline annual likelihood), capped at 0.95
- `SLE_multiplier` starts at 1.0
- `fixed_additions` = flat INR amounts from sector/regulatory rules
- Insurance offset: if cyber insurance present, multiply final EAL × 0.65

### 3.3 Explainability-by-Design

Every triggered rule outputs: `{rule_id, description, contribution_inr, rule_tier, reason}`. The full `rule_trace` is stored in `RiskScore.rule_trace` (JSON) and returned in every API response. This lets the UI show exactly why a number is what it is, down to the individual rule.

### 3.4 India-First Regulatory Coverage

The platform embeds Indian-specific regulatory costs directly into the rules engine:
- RBI Circular RBI/2015-16/418 (PAM requirement for BFSI)
- DPDP Act 2023 Section 8 and 33 (data protection, up to INR 250 Cr penalty)
- CERT-In Directions 2022 (6-hour incident reporting mandate)
- SEBI CSCRF (for securities firms)
- NCIIPC Section 70 IT Act (energy/utilities critical infrastructure)

---

## 4. Complete Feature Inventory

### 4.1 Input Intake and Normalization (Analyst Agent)

Three intake channels, all producing the same normalized schema:

**Channel 1: Guided Quick-Form**
- Dropdowns for asset_type, criticality_tag
- Fields for CVE ID, CVSS score, days unpatched, revenue dependency percentage
- Always works — no AI dependency
- Endpoint: `POST /api/assets`

**Channel 2: Conversational NLP**
- User types free text describing their infrastructure ("We have an Oracle CBS running on-prem, a Fortinet VPN gateway, and AWS EKS...")
- AI Analyst Agent (Groq Llama-3.3-70B) extracts structured assets
- Fallback: deterministic keyword matching using `intake_engine.py` rules (I01-I10)
- Endpoint: `POST /api/assets/intake/conversational`

**Channel 3: File Upload (CSV/JSON Batch)**
- Accepts CSV or JSON exports from Nessus, Qualys, Nmap, or CMDB spreadsheets
- `intake_engine.parse_csv_or_json_content()` handles parsing
- Up to 50 assets per batch
- Endpoint: `POST /api/assets/intake/upload`

**Output schema (all channels produce the same)**:
```json
{
  "name": "Oracle CBS Production DB",
  "asset_type": "Database",
  "criticality_tag": "core_db",
  "revenue_dependency_pct": 35.0,
  "cve_id": "CVE-2021-44228",
  "cvss_score": 9.3,
  "days_unpatched": 45
}
```

### 4.2 Organization Profiling

Organizations have:
- `sector`: BFSI, Healthcare, Manufacturing, IT-SaaS, Other (also Retail/E-Commerce, Energy/Utilities in rules)
- `size_tier`: MSME, Mid, Enterprise
- `employee_count`: integer
- `annual_revenue_inr`: float

The sector and size_tier drive the tier multiplier and activate sector-specific rule packs. Same vulnerability produces very different INR exposure at different tiers — this is Demo Pillar 1.

### 4.3 Multi-Sheet Infrastructure Model

Each organization has multiple Sheets representing logical infrastructure segments:
- Corporate IT, Payment Systems, Core Banking, Branch Network, Cloud Infra, OT/Manufacturing Floor
- Each sheet has its own asset list, risk score, compliance rollup, and graph
- A master Dashboard aggregates only base sheets for the org-wide EAL total

**Sheet types**:
- `base`: Normal sheet with its own assets. Assets can only be added to base sheets.
- `combined`: Derived sheet created from two or more source sheets. Has no direct assets — resolves to leaf (base) assets via `derived_sheets.resolve_leaf_sheet_ids()`. Visually tagged as "derived". Excluded from org-wide total to avoid double-counting.

**Combined sheet mechanics**:
- Created via `POST /api/sheets/combine`
- Automatically recomputes when any source sheet changes (via `derived_sheets.recompute_dependent_sheets()`)
- Supports recursive combination (combined sheet as source for another combined sheet)
- Each combined sheet runs the Correlation Agent to determine if the combined risk is more than the naive sum

### 4.4 Risk Quantification Engine (Rules Engine + AI Assessor)

Located in `backend/app/services/rules_engine.py`.

**30 rules implemented (R01-R30)**:

Universal rules (apply to all organizations):
- R01_CVSS_CRITICAL: CVSS >= 9.0, unpatched > 30 days → LEF +45%
- R02_CVSS_HIGH: CVSS 7.0-8.9, unpatched > 60 days → LEF +25%
- R03_OLD_VULN: Unpatched > 180 days → SLE multiplier x1.30
- R04_NO_MFA_ADMIN: MFA absent/partial → LEF +35% (partial credit applied)
- R05_NO_EDR: EDR absent/partial → SLE multiplier +25%
- R06_NO_BACKUP_AIRGAP: No immutable backups → SLE multiplier +40%
- R07_PAYMENT_PROCESSING: payment_processing tag → fixed INR 25L (MSME) / 50L (Mid) / 1.5Cr (Enterprise)
- R08_CORE_DATABASE: core_db tag → fixed INR 35L / 70L / 2Cr by tier
- R09_CUSTOMER_FACING: customer_portal + CVSS >= 6.0 → SLE multiplier x1.25
- R15_ADMIN_WORKSTATION_LATERAL: admin workstation type → LEF +20%
- R16_WEAK_ENCRYPTION: No TLS/encryption → fixed INR 8L
- R17_PATCH_SLA_BREACH: CVSS >= 8.0 on crown jewel, > 90 days → SLE multiplier x1.20
- R18: Partial credit baseline (referenced in R04, R05, R06 logic)
- R19_DEPENDENCY_CASCADE: Asset has >= 3 downstream nodes (metadata) → SLE +15%
- R20_SUPPLY_CHAIN_VENDOR: vendor_integrated metadata flag → LEF +10%
- R21_WAF_PROTECTION_ABSENT: customer_portal + no WAF → LEF +20%
- R22_ZERO_TRUST_ABSENT: Cloud/workstation with remote_access + no ZTNA → LEF +15%
- R23_SIEM_SOC_TELEMETRY_ABSENT: No SIEM → SLE multiplier x1.25
- R24_INCIDENT_RESPONSE_ABSENT: No IRP → SLE multiplier x1.20
- R25_VAPT_ANNUAL_TESTING_ABSENT: No pen testing → SLE multiplier x1.15
- R26_CONTAINER_CSPM_MISCONFIG: Cloud resource + no CSPM → LEF +18%
- R29_CERT_IN_6HR_REPORTING_MANDATE: CVSS >= 8.5 + no SIEM → fixed INR 10L
- R30_CYBER_INSURANCE_RECOVERY_OFFSET: Insurance present → EAL x0.65

Sector rules:
- R10_SECTOR_BFSI_RBI_COMPLIANCE: BFSI + no PAM → fixed INR 15L
- R11_SECTOR_BFSI_FRAUD_RISK: BFSI + payment/core_db → SLE multiplier x1.40
- R12_SECTOR_HEALTHCARE_DPDP: Healthcare + patient data → fixed INR 20L
- R13_SECTOR_MANUFACTURING_OT: Manufacturing + OT/SCADA → SLE multiplier x1.50
- R14_SECTOR_IT_SAAS_TENANT: IT-SaaS + multi-tenant/portal → SLE multiplier x1.35
- R27_SECTOR_RETAIL_ECOMMERCE_SLA: Retail + checkout portal → fixed INR 12L
- R28_SECTOR_ENERGY_CRITICAL_INFRA: Energy + critical asset → fixed INR 25L

**Partial credit (R18 principle)**: Controls can be `present`, `partial`, or `absent`. Partial status gives 50% credit, reducing the rule's contribution proportionally.

**Controls recognized by the rules engine** (16 controls via keyword matching):
MFA, EDR, Immutable Backups, TLS/Encryption, Patch Management, DLP, Vulnerability Scanning, Incident Response Plan, Network Segmentation, Privileged Access Management (PAM), WAF, SIEM, Zero Trust (ZTNA), CSPM, Penetration Testing, Cyber Insurance.

### 4.5 Network Graph and Blast Radius (Pillar 2)

**Graph model**:
- Nodes = Assets (size/color = criticality or EAL)
- Edges = GraphEdge records (dependency_strength: weak, moderate, strong)
- Rendered with Cytoscape.js in `Pillar2GraphView`

**Blast radius**:
- `blast_radius.py` uses NetworkX to compute reachable nodes from a compromised asset
- Returns: path to each reachable node, propagated INR impact
- Frontend highlights the affected subgraph in red with the total downstream EAL shown
- This is Demo Pillar 2: click a vulnerable node, see visual ripple + INR number

**Endpoints**:
- `GET /api/graph/{sheet_id}` — full graph (nodes + edges)
- `GET /api/graph/{sheet_id}/blast-radius/{asset_id}` — blast radius from a node

### 4.6 Correlation Agent (Combined Sheet Risk)

When a combined sheet is created or updated, the Correlation Engine runs:

**Rules (C01-C20, in `correlation_engine.py`)**:
- 0 cross-segment edges → pure sum, skip AI entirely
- Low edge count → simple weighted addition formula
- High edge count / strong dependencies → invoke AI with compounding context

**AI role**:
- Gets: sheet names, naive sum, cross-edge count, edge descriptions, deterministic baseline %
- Returns: adjusted % (-10% to +40% range) and 2-sentence narrative explaining why combined risk > or < naive sum
- Example: "HR laptop → VPN → Core Banking" creates compounding; if isolated, simple sum

**Output**: combined EAL + "Naive sum vs AI-adjusted combined risk" comparison (shown in UI)

### 4.7 Advisor / Investment Optimization (Pillar 3)

**Optimizer (`optimizer.py`)**:
- Implements greedy knapsack algorithm (not pure knapsack — cost-effectiveness ranked)
- Inputs: list of controls with cost and estimated risk_reduction_inr, budget
- Output: selected control set that maximizes total risk reduction within budget

**Risk reduction estimates** are calculated via `estimate_control_risk_reduction()`, which maps control names to percentage of total org EAL they reduce (e.g., MFA = 25% of EAL, EDR = 20%, Immutable Backups = 35%).

**ROSI Curve**:
- `GET /api/optimization/rosi-curve` returns data points for investment levels from INR 0 to max control cost
- Frontend renders as a line chart (Recharts) showing "Investment vs. Risk Reduction"

**What-If Sandbox**:
- `POST /api/optimization/what-if` accepts a list of control status overrides
- Re-runs the full rules engine with the modified controls context across all assets
- Returns new EAL — live update as user toggles controls on/off
- This is Demo Pillar 3

**AI Advisor**:
- After optimization runs, calls `assess_recommendations()` in `ai_service.py`
- Explains why the selected combination is effective and flags one non-obvious tradeoff

### 4.8 Compliance Engine (8 Frameworks)

**Frameworks** (in `compliance_engine.py`):
1. ISO 27001 Annex A
2. NIST Cybersecurity Framework (CSF)
3. CIS Controls
4. RBI Cyber Security Framework (India)
5. SEBI CSCRF (India)
6. HIPAA
7. PCI DSS
8. GDPR / DPDP Act 2023 (India)

**Mechanism**: Each framework has a lookup table of clauses. For each clause, the engine checks if a relevant control is present/partial/absent in the org's control list. Result: `satisfied` or `gap`.

**Output per framework**:
```json
{
  "framework": "RBI_CSF",
  "total_clauses": 15,
  "satisfied": 9,
  "gaps": 6,
  "coverage_pct": 60.0,
  "gaps_list": [...],
  "ai_narrative": "...",
  "ai_mode": "ai_assisted"
}
```

**Endpoints**:
- `GET /api/compliance/{org_id}?framework=RBI_CSF` — single framework
- `GET /api/compliance/{org_id}/all` — all 8 frameworks simultaneously

### 4.9 Dashboard and Reporting

**Dashboard** (`GET /api/reports/{org_id}/dashboard`):
- `total_eal_inr`: sum of all base sheet EALs
- `total_assets`: asset count across all base sheets
- `critical_vulnerabilities`: count of CVSS >= 9.0 vulns
- `top_risky_assets`: top 5 assets by EAL
- `top_roi_controls`: top 5 absent controls by ROI ratio
- `compliance_rbi_csf`: {coverage_pct, gaps_count}
- `compliance_iso27001`: {coverage_pct, gaps_count}
- `ai_mode`: current mode indicator

**Audit Report** (`GET /api/reports/{org_id}/audit-report`):
- Per-sheet breakdown with EAL, assets, top risks
- Compliance rollup across all frameworks
- Prioritized recommendations
- Incident cost breakdown (downtime, regulatory fine, customer churn, breach response, reputational impact)

### 4.10 Advanced Platform Modules (Modules Tab)

Located in `backend/app/api/modules.py`. Accessed via `PlatformModulesView` in the frontend.

**Module 1: Automated Document Ingestion Pipeline**
Three sub-modes:
- `policy_ocr`: Extracts controls and assets from PDF security policy text
- `soc2_extract`: Parses SOC-2 Type II audit reports for control findings
- `diagram_scan`: Reads AWS/cloud architecture diagrams for asset topology

Three preset documents (for demo without file upload):
- `rbi_nbfc_cyber_policy`: Suraksha NBFC Master ISMP
- `soc2_type2_audit`: CloudCore Technologies SOC-2 report
- `aws_cloud_architecture`: AWS Multi-Tier Banking Architecture diagram

Endpoint: `POST /api/modules/document-parse`

**Module 2: DPDP Act 2023 Statutory Liability Calculator**
- Input: records affected, data sensitivity, safeguards in place
- Applies DPDP Act Section 33 penalty schedule (up to INR 250 Cr)
- Sensitivity multipliers: standard 1.0x, financial 1.75x, biometric_kyc 2.2x, children 2.5x
- Mitigating discounts for encryption, MFA, audit logging, timely notification (up to 70% reduction)
- Endpoint: `POST /api/modules/dpdp-calculator`

**Module 3: Interactive Board Deck Generator**
- Generates a 5-slide board presentation from live org telemetry
- Slides: Executive Risk Posture, Loss Exceedance, Blast Radius, ROSI Portfolio, Regulatory Governance
- Endpoint: `POST /api/modules/board-deck`

**Module 4: Vendor Contract Review Agent**
- Evaluates vendor contracts against RBI Outsourcing Guidelines and DPDP Act Section 8
- Checks: breach notification SLA (6-hour CERT-In mandate), right to audit, liability cap, DPDP processor terms
- Returns: security score (0-100), status, findings with recommended amendments
- Endpoint: `POST /api/modules/vendor-review`

**Module 5: RAG CISO Advisory Assistant**
- Conversational chat grounded in the org's live risk telemetry
- System prompt contains: org name, sector, EAL, asset count, critical CVEs, top risky assets, compliance percentages
- Responds with Indian regulatory citations (DPDP, RBI, CERT-In)
- Rules-only fallback returns structured telemetry summary
- Endpoint: `POST /api/modules/rag-query`

---

## 5. Data Model Details

### 5.1 Enums

```python
SectorEnum: BFSI, Healthcare, Manufacturing, IT-SaaS, Other
SizeTierEnum: MSME, Mid, Enterprise
SheetTypeEnum: base, combined
ControlStatusEnum: present, absent, partial
VulnSourceEnum: manual, scan, cve_match
DependencyStrengthEnum: weak, moderate, strong
FrameworkEnum: ISO27001, RBI_CSF (used in DB; engine uses broader set)
ComplianceStatusEnum: satisfied, gap
```

### 5.2 Asset Types (recognized by AI intake and rules)

Server, Database, Workstation, Cloud Resource, Network Appliance, OT/SCADA, Payment Switch, Identity/IAM, Web App, Network Device, Cloud Service

### 5.3 Criticality Tags (used in rules engine)

- `core_db`: Core database — highest impact rules (R08, R12)
- `payment_processing`: Payment infrastructure — PCI/fraud rules (R07, R11)
- `customer_portal`: External-facing — CVSS exposure multiplier (R09, R21)
- `admin_workstation`: Admin systems — lateral movement risk (R15)
- `crown_jewel`: Highest-value asset — SLA breach rule (R17)
- `standard`: Default — no criticality uplift

### 5.4 Asset Metadata Fields (used by rules engine)

These are stored in `metadata_json` and checked by rules:
- `vendor_integrated`: boolean → triggers R20_SUPPLY_CHAIN_VENDOR
- `third_party`: boolean → alternative to vendor_integrated
- `ot_connected`: boolean → triggers R13_SECTOR_MANUFACTURING_OT
- `multi_tenant`: boolean → triggers R14_SECTOR_IT_SAAS_TENANT
- `remote_access`: boolean → triggers R22_ZERO_TRUST_ABSENT
- `downstream_dependency_count`: int >= 3 → triggers R19_DEPENDENCY_CASCADE

---

## 6. Authentication and Security

**Production auth flow**:
1. Admin deploys with `API_KEY_TENANTS` set to a JSON map: `{"secret-key-1": ["org-uuid-1"], "operator-key": ["*"]}`
2. `API_PROXY_KEY` is a different key — this is what the Nginx proxy injects on every request
3. Browser never sees either key
4. Backend's `auth.py` validates `X-API-Key` header against `API_KEY_TENANTS`
5. `assert_org_access(auth, org_id)` called on every route to verify the key has access to that org

**Local development**: Set `AUTH_REQUIRED=false` to bypass all key checking.

**Frontend auth** (`utils/auth.ts`): Session stored in localStorage. Demo login page accepts hardcoded demo credentials (not production auth — UI layer only). Real auth happens at the API key level.

---

## 7. Services Reference

| File | Role |
|---|---|
| `rules_engine.py` | Core FAIR quantification, 30 rules, OrgContext/AssetContext/VulnContext/ControlsContext |
| `ai_service.py` | Groq client, 5 agent functions: assess_risk, assess_correlation, assess_recommendations, assess_compliance_gaps, parse_conversational_intake, rag_ciso_assistant |
| `compliance_engine.py` | 8 framework clause lookup tables, evaluate_compliance() |
| `correlation_engine.py` | Graph-topology-based correlation rules for combined sheets |
| `optimizer.py` | Greedy knapsack, estimate_control_risk_reduction(), compute_rosi() |
| `blast_radius.py` | NetworkX BFS from compromised node, propagated EAL |
| `intake_engine.py` | Deterministic intake rules (I01-I10), CSV/JSON parser |
| `nvd_client.py` | NIST NVD API v2.0 client, search_cves(), get_cve_by_id() |
| `derived_sheets.py` | resolve_leaf_sheet_ids(), recompute_dependent_sheets() |
| `seed_data.py` | Creates "Suraksha Finance Ltd" demo org with 4 sheets, 20+ assets, 30+ vulnerabilities, 16 controls |

---

## 8. API Routers Reference

| Router | Prefix | Key Endpoints |
|---|---|---|
| organizations | /api/organizations | CRUD + org-scoped dashboard |
| sheets | /api/sheets | list, create, combine, correlate |
| assets | /api/assets | guided intake, conversational intake, file upload, add-vuln |
| cve | /api/cve | NVD search + lookup |
| graph | /api/graph | full graph, blast radius |
| optimization | /api/optimization | controls list, update, optimize, what-if, rosi-curve |
| compliance | /api/compliance | single framework, all 8 frameworks |
| reports | /api/reports | dashboard, audit report, export |
| risk | /api/risk | direct risk re-score endpoint |
| modules | /api/modules | document-parse, dpdp-calculator, board-deck, vendor-review, rag-query |

All routers are protected by `require_api_key` dependency.

---

## 9. Frontend Views Reference

All views are lazy-loaded via `React.lazy()` and rendered inside `AnimatePresence` (Framer Motion) for smooth transitions.

| Tab ID | Component | Description |
|---|---|---|
| `dashboard` | `DashboardView` | EAL KPI cards, top risky assets, top ROI controls, compliance bars, sheet list |
| `pillar1` | `Pillar1ComparisonView` | Side-by-side risk comparison for MSME vs Mid vs Enterprise with same vulnerability |
| `pillar2` | `Pillar2GraphView` | Cytoscape.js network graph with blast radius visualization |
| `pillar3` | `Pillar3AdvisorView` | Budget input, greedy knapsack results, ROSI curve chart, AI advisor narrative |
| `whatif` | `WhatIfView` | Control toggle sandbox with live EAL re-computation |
| `sheets` | `SheetsView` | Sheet selector, asset table, per-asset EAL, rule trace explainer |
| `compliance` | `ComplianceView` | Framework selector, gap audit table, AI compliance narrative |
| `modules` | `PlatformModulesView` | All 5 advanced modules |
| `settings` | `SettingsView` | Theme toggle, default page, user info, logout |

**Modals** (rendered via Suspense, triggered from Navbar or Dashboard):
- `AssetIntakeModal`: Three-tab intake (guided / conversational / file upload)
- `AuditReportModal`: Full audit report view + export
- `NewOrgModal`: Create a new organization
- `DemoGuide`: Step-by-step overlay walkthrough of the three demo pillars

**Navbar**:
- Organization switcher dropdown (shows all orgs for the current API key scope)
- "Add Org" button
- "Add Asset" button (opens IntakeModal)
- "Report" button (opens ReportModal)
- Tab navigation (Dashboard, Pillar 1, Pillar 2, Pillar 3, What-If, Sheets, Compliance, Modules, Settings)
- Shows total EAL in INR and AI mode indicator
- Demo Guide button
- Logout

---

## 10. Demo Organization Details (Seeded on Startup)

**Organization**: Suraksha Finance Ltd
- Sector: BFSI
- Size Tier: Mid
- Employees: 850
- Annual Revenue: INR 120 Crore (1,200,000,000)

**Sheets** (4 base sheets):
1. Corporate IT — laptops, workstations, email, VPN
2. Payment Systems — UPI switch, NPCI gateway, payment processor, PCI DSS scope
3. Core Banking — Finacle CBS, loan origination, Oracle DB clusters
4. Cloud Infrastructure — AWS VPC, EKS, Aurora DB, HashiCorp Vault

**Seed Controls** (16 controls across BFSI sector):
MFA on Admin Accounts (present), TLS/Data Encryption (present), Network Segmentation (present), EDR (partial), Patch Management Program (partial), Web Application Firewall (partial), Vulnerability Scanning (partial), SIEM and 24/7 SOC (partial), Immutable/Airgapped Backups (absent), Privileged Access Management (absent), Zero Trust / ZTNA (absent), DLP (absent), Cloud Security Posture Management (absent), Annual Red Team and VAPT (absent), Incident Response Plan (partial), Cyber Insurance (absent).

**Why this org**: BFSI sector with mid-tier scale activates RBI CSF rules, BFSI fraud multipliers, and payment processing penalties — maximum demonstration of rules richness. Partial/absent critical controls (backups, PAM, ZTNA) ensure the rules engine fires visibly.

---

## 11. AI Cache and Rate Limiting

In-memory cache in `ai_service.py`:
- `_ai_cache`: dict keyed by SHA256 hash of payload (truncated to 24 chars)
- TTL: 600 seconds (10 minutes)
- Cache key includes: base_eal (rounded to nearest thousand), triggered rule IDs, sector, size_tier
- This prevents burning Groq rate limits on duplicate requests during demos

Retry logic:
- 2 retries with exponential backoff (1s, 2s) on transient errors
- After all retries fail, returns deterministic rules-only fallback (no crash)

---

## 12. Deployment Details

### Docker Compose Stack

```yaml
postgres:
  image: postgres:16-alpine
  internal port: 5432 (exposed to host for dev convenience)

backend:
  expose: 8000 (NOT published to host — only accessible to frontend via Docker network)
  env: DATABASE_URL, GROQ_API_KEY, GROQ_MODEL, NVD_API_BASE, SEED_ON_STARTUP, CORS_ORIGINS, AUTH_REQUIRED, API_KEY_TENANTS

frontend:
  ports: FRONTEND_PORT:80 (default 5173:80)
  env: API_PROXY_KEY (injected into every proxied request as X-API-Key header)
  depends_on: backend
```

**Nginx proxy** (`frontend/nginx/default.conf.template`):
- Serves React SPA for all non-API paths
- Proxies `/api` to `http://backend:8000/api`
- Adds `X-API-Key: ${API_PROXY_KEY}` header on proxy — browser never sees the key

### Database modes

- **Local dev**: SQLite file at `backend/tarazu.db` (auto-created, no setup)
- **Production**: PostgreSQL 16 via `DATABASE_URL=postgresql+asyncpg://...`
- SQLAlchemy 2.0 async engine with aiosqlite/asyncpg drivers
- All IDs are UUID strings (cross-DB compatible)

---

## 13. Configuration and Environment

| Variable | Where used | Notes |
|---|---|---|
| `GROQ_API_KEY` | `config.py` → `ai_service.py` | Empty = rules-only mode; never crashes |
| `GROQ_MODEL` | `config.py` → `ai_service.py` | Default: `llama-3.3-70b-versatile` |
| `DATABASE_URL` | `config.py` → `database.py` | Empty = SQLite fallback |
| `AUTH_REQUIRED` | `config.py` → `auth.py` | False = no key validation (local dev) |
| `API_KEY_TENANTS` | `config.py` → `auth.py` | JSON `{"key": ["org-id"]}`, `["*"]` = all orgs |
| `API_PROXY_KEY` | Nginx env → headers | Key Nginx injects; backend validates as API key |
| `CORS_ORIGINS` | `config.py` | Comma-separated, no wildcards allowed |
| `SEED_ON_STARTUP` | `main.py` | Seeds demo org on every startup if not present |
| `NVD_API_BASE` | `config.py` → `nvd_client.py` | NIST NVD API v2.0 base URL |
| `NVD_API_TIMEOUT` | `config.py` | Default 15 seconds |

---

## 14. Known Architecture Decisions and Tradeoffs

### Decision 1: SQLite for local dev, PostgreSQL for production
Rationale: Allows zero-setup local development without Docker. SQLAlchemy's `JSON` type handles `TEXT` in SQLite and `JSONB` in PostgreSQL automatically.

### Decision 2: AI bounded at ±30%
Rationale: Prevents AI from fabricating numbers. The rules engine provides a calibrated anchor; AI adjusts for context, not freely invents. Makes the system auditor-defensible.

### Decision 3: Combined sheets excluded from org-wide total
Rationale: Prevents double-counting. A combined sheet of "Corporate IT + Payment" + individual "Corporate IT" would count Corporate IT twice. Only base sheets sum to the canonical org EAL.

### Decision 4: Controls at org level, not sheet level
Rationale: Controls (MFA, EDR, etc.) are organization-wide investments, not per-segment. The same controls context applies to all assets regardless of which sheet they're in.

### Decision 5: RiskScore stored for both asset and sheet
Rationale: The RiskScore table stores both asset-level scores (asset_id set, sheet_id set) and sheet-level rollup scores (asset_id is NULL, sheet_id set). This allows the sheet score to be retrieved without re-summing all assets on every request.

### Decision 6: Lazy-loaded frontend chunks
Rationale: The graph view (Cytoscape.js), advisor chart (Recharts), and modules are loaded on-demand only when the user navigates to that tab. Initial page load is fast.

---

## 15. Testing

**Backend** (`test_backend.py` and `test_endpoints.py`):
- Demo pillar verification: Pillar 1 (org scale comparison), Pillar 2 (graph blast radius), Pillar 3 (budget optimization)
- Compliance mapping verification
- Database seeding verification
- `pytest` + `pytest-asyncio` for async test support

**Frontend**:
- `npm run build` is the build verification — confirms TypeScript compilation, chunk splitting, and no import errors

---

## 16. External Data Sources

| Source | How used |
|---|---|
| NIST NVD API v2.0 | Real CVE/CVSS data lookup; `GET /api/cve/search` and `GET /api/cve/{cve_id}` |
| IBM Cost of a Data Breach Report (India 2024) | Basis for per-employee cost constant (INR 15,000) and BFSI fraud multiplier (40% above global average) |
| DPDP Act 2023 Schedule | Penalty ceilings in DPDP Calculator module |
| RBI Circulars | Regulatory cost figures in R10 and BFSI sector rules |

---

## 17. Frontend Design System

The UI follows the "Steep" editorial design system (documented in `frontend/DESIGN.md`):
- **Fonts**: Signifier serif (display/headings) + Sohne sans (body/UI)
- **Color palette**: Near-monochrome — Ink Black (#17191c), Paper White (#ffffff), Mist Gray (#f2f2f3), Fog White (#fafafb), with Blush Peach (#fbe1d1) as the only chromatic accent
- **Card radius**: 24px (content cards), 9999px (buttons), 16px (inputs)
- **Shadows**: Barely-there, max 10% opacity — only floating artifacts have elevation
- **Animations**: Framer Motion for tab transitions (opacity + y-translate, 200ms), micro-animations on interactive elements
- **Tailwind v4** with `@theme` custom properties

---

## 18. Glossary

| Term | Meaning |
|---|---|
| EAL | Expected Annual Loss — the primary risk metric output in INR |
| LEF | Loss Event Frequency — annual probability of a loss event occurring |
| SLE | Single Loss Expectancy — magnitude of loss per event in INR |
| FAIR | Factor Analysis of Information Risk — the risk quantification methodology |
| ROSI | Return on Security Investment — risk reduction per INR invested |
| Rule Trace | The full list of triggered rules with their INR contributions — the explainability artifact |
| Base Sheet | A sheet with its own assets; contributes to org-wide EAL |
| Combined Sheet | A derived sheet from 2+ source sheets; excluded from org-wide EAL |
| Blast Radius | The set of downstream assets reachable from a compromised asset via graph edges |
| Correlation Agent | The AI agent that determines if combined sheet risk is more than naive sum |
| Advisor Agent | The AI agent that explains the knapsack optimizer's chosen control set |
| Analyst Agent | The AI agent that parses free-text infrastructure descriptions into structured assets |
| Assessor Agent | The AI agent that calibrates the rules engine's EAL output by ±30% |
| Compliance Agent | The AI agent that writes prioritized gap narratives for auditors |
| Groq | The LLM API provider (llama-3.3-70b-versatile model) |
| RBI CSF | Reserve Bank of India Cyber Security Framework |
| SEBI CSCRF | Securities and Exchange Board of India Cyber Security and Cyber Resilience Framework |
| DPDP Act | Digital Personal Data Protection Act 2023 (India) |
| CERT-In | Indian Computer Emergency Response Team |
| NCIIPC | National Critical Information Infrastructure Protection Centre |

---

*Generated: September 2026 · Tarazu CyberRiskQuant · SIH26105*
