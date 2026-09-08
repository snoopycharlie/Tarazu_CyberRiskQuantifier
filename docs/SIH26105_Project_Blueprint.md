# SIH26105 — AI-Powered Continuous Cyber Risk Quantification and Investment Optimization Platform
## Project Blueprint

**Sponsor:** All India Council for Technical Education (AICTE)
**Theme:** Blockchain & Cybersecurity
**Prize:** ₹1,00,000
**Deadline:** 20 September 2026

---

## 1. Problem Summary

Organizations describe cyber risk in vague qualitative labels ("Low/Medium/High") instead of financial terms, and risk assessments are periodic/manual rather than continuous — leaving boards, CFOs, and regulators without real, actionable, up-to-date visibility into what cyber risk actually costs them and where to spend limited security budgets.

## 2. Positioning / Differentiators

- **India-first framing**: native support for RBI Cyber Security Framework (banks/NBFCs), SEBI CSCRF, CERT-In directions — not just generic ISO/NIST mapping like foreign GRC tools.
- **Scale-agnostic**: works for both MSMEs (who can't afford Big-4 GRC consultants) and large regulated enterprises (BFSI, healthcare) — same engine, scaled by an organization profile.
- **Explainable-by-design**: every number is traceable to specific rules + AI reasoning, never a black-box output — defensible to auditors, boards, regulators.

---

## 3. System Architecture Overview

### 3.1 Guiding principle: Rules → AI escalation (applies to every AI module)

Every AI component is preceded by a deterministic rules layer (~20–30 rules) that resolves the majority of cases cheaply and transparently. AI is invoked only for the residual complexity — calibration, conflict resolution, contextual judgment, and natural-language explanation. This reduces AI load/cost, increases speed, and keeps the system auditable.

```
Structured Input → Rules Engine (deterministic, ~20-30 rules/module) → [most cases resolved]
                                      ↓ (unresolved / ambiguous / needs judgment)
                                 AI Reasoning Layer → calibrated output + explanation
```

### 3.2 High-level modules

1. Input Intake & Normalization Layer
2. Organization Profiling
3. Multi-Sheet Infrastructure Model (+ Combined/Derived Sheets)
4. Network Graph & Blast Radius Visualization
5. Risk Quantification Engine (Rules + AI)
6. Correlation/Combination Engine (Rules + AI)
7. Advisor / Investment Optimization Engine (Rules + AI)
8. Compliance & Framework Mapping (Rules + AI)
9. Dashboards, Statistics & Reporting

---

## 4. Module Details

### 4.1 Input Intake & Normalization Layer

**Goal:** Make providing input effortless; AI converts messy input into structured telemetry.

**Input channels supported:**
- **Manual — conversational**: free-text description of infrastructure, parsed into structured asset entries by AI.
- **Manual — guided quick-form**: dropdowns/fields as a deterministic fallback path (sector, size, infra type) — ensures demo never breaks even if AI extraction misses something.
- **Document upload**: existing asset spreadsheets, network diagrams, past audit PDFs, vendor invoices — AI extracts structured data from whatever is uploaded.
- **Lightweight automated scanning** (permission-light, no invasive access needed):
  - Local network discovery (ARP scan/open ports) via a locally-run script, with consent — demoable on presenter's own network.
  - Public exposure scan from just a domain name: SSL cert info, DNS records, subdomains, tech stack fingerprinting.
  - CVE auto-matching: detected software/versions matched against NVD's CVE database to auto-populate vulnerabilities.

**Rules (~20-25):** pattern-matching for obvious asset types/criticality from keywords, regex extraction (IPs, domains, versions), known-format direct parsing (skip AI for recognized scanner exports).

**AI handles:** ambiguous/free-text cases, entity extraction from prose/documents, reconciling & deduplicating assets discovered from multiple sources, inferring reasonable defaults for missing fields (flagged as "inferred, please confirm").

**Output:** unified structured schema — same schema regardless of which input path was used, feeding directly into the org profile and infrastructure sheets.

### 4.2 Organization Profiling

Captures scale context so risk isn't arbitrary:
- Org size (employees / revenue band / MSME–Mid–Enterprise tier)
- Infrastructure footprint (servers, endpoints, cloud vs on-prem, critical apps)
- Sector (banking, healthcare, manufacturing, IT/SaaS, etc.)

This profile acts as a **multiplier/scaler** on the risk formulas — same vulnerability produces different ₹ exposure depending on infrastructure size and revenue dependency.

### 4.3 Multi-Sheet Infrastructure Model

- Excel-style multi-sheet structure — each sheet = a logical infrastructure segment (e.g., Corporate IT, Payment Systems, Branch Network, Cloud Infra, OT/Manufacturing Floor).
- Each sheet has its own asset list, applicable rule-pack emphasis, risk score, and mini network graph.
- A master/summary sheet aggregates all **base** sheets into org-wide Expected Annual Loss, and shows which segment contributes most risk.

**Combined / Derived Sheets:**
- User can select two or more existing sheets (base or derived) to produce a new, name-able **combined sheet**.
- Combined sheet is persisted (not recomputed each view) and updates automatically as source sheets change.
- Behaves like any other sheet: own risk score, own merged graph, own compliance rollup, own report export.
- Can itself be used as a source for further combination (recursive, no special-casing needed).
- Visually tagged as "derived" on the master view.
- **Excluded from the org-wide master total** to avoid double-counting — one canonical org-wide number (sum of base sheets only); combined sheets are unlimited ad-hoc analytical views.

### 4.4 Network Graph & Blast Radius Visualization

- Nodes = assets; edges = dependencies/connections between them.
- Node color/size = risk level or business criticality.
- Clicking a vulnerable node visually shows the blast radius — which downstream nodes/critical assets are reachable, and how the ₹ loss ripples outward.
- Combined sheets show a merged graph across source segments.
- This graph is also the **data source for the Correlation Engine** (4.6) — cross-sheet edges are what determine whether combination is a simple sum or a compounding adjustment.

### 4.5 Risk Quantification Engine (Rules + AI)

**Rules layer (~30 rules), examples:**
- Vulnerability-based: CVSS ≥ 9 + no patch in 90 days → likelihood multiplier ↑
- Control-based: No MFA on admin accounts → + likelihood of unauthorized access
- Asset-criticality-based: asset tagged "payment processing" → impact multiplier tied to % revenue dependency
- Domain-specific packs: BFSI (RBI CSF/SEBI CSCRF clauses), Healthcare (patient data/DPDPA-relevant), Manufacturing (OT/ICS-specific), IT/SaaS (cloud config, API security)
- Compliance-linked: missing control → tagged against specific framework clause

Each rule outputs a **number + reason string** (explainability foundation).

**Rule tiers:**
- Universal rules (~20-25) — apply to any org.
- Sector rule packs (~10-15 each) — activated based on org profile's declared sector.

**AI layer ("Assessor Agent"):**
- Weighs overlapping/conflicting triggered rules instead of naive summation.
- Contextual adjustment (e.g., dampens raw CVSS-driven scores for orgs unlikely to be targeted by sophisticated actors).
- Produces plain-English narrative justification of the final number.
- Rules engine output is a **bounded anchor/prior** — AI adjusts within bounds, does not freely invent numbers.

**Output:** Expected Annual Loss / Value at Risk per asset, per sheet, and org-wide (from base sheets).

### 4.6 Correlation / Combination Engine (Rules + AI) — "Correlation Agent"

Triggered when a combined sheet is created.

**Rules layer (~20):**
- If cross-segment edge count = 0 → pure sum, skip AI entirely.
- If edge count ≤ threshold → simple weighted-addition formula.
- Basic dependency-strength scoring from tagged connections.

**AI layer:**
- Only triggers when meaningful cross-segment connections exist.
- Checks real dependency paths from graph data (e.g., HR laptops → Cloud Infra admin panel).
- Explains compounding effect vs. simple addition in plain English.
- Produces "naive sum vs. AI-adjusted combined risk" comparison — visually demonstrates AI's added value over arithmetic.

**Output:** combined ₹ exposure, interconnection narrative (if applicable), for the named combined sheet.

### 4.7 Advisor / Investment Optimization Engine (Rules + AI)

**Rules layer (~20-25):** cost-effectiveness ranking (risk-reduction ÷ cost per control) is a solvable optimization problem (knapsack/greedy/LP) — largely deterministic math, not really an AI task.

**AI layer:**
- Given a budget (e.g. ₹1 crore), recommends which controls to fund for maximum risk reduction.
- Narrates *why* a particular combination was chosen, flags non-obvious tradeoffs.
- Answers natural-language "what-if" queries ("What if we roll out MFA everywhere?") with live-updating risk score + graph.
- Generates ROSI (Return on Security Investment) curves — "Investment vs. Risk Reduction" visualization.

### 4.8 Compliance & Framework Mapping (Rules + AI)

**Rules layer (~25-30):** control-present/absent → clause-satisfied/not-satisfied, via framework clause lookup tables (ISO 27001 Annex A, NIST CSF, CIS Controls, RBI CSF, SEBI CSCRF , HIPAA , PCI DSS — tagged per rule, reused from the quantification rule definitions).

**AI layer:**
- Narrative gap-summary: what the combined gaps mean together, prioritization for audit readiness.
- Same structured data drives both risk scoring and compliance audit view — no separate system needed.

**Output:** audit-style report — e.g. "23/40 required controls present," gaps mapped to specific clause numbers, per sheet or per combined view.

### 4.9 Dashboards, Statistics & Reporting

- Executive view: risk score, ₹ exposure, trend, top contributors.
- Technical drill-down: control/asset-level findings, remediation backlog.
- Natural-language Q&A interface over the org's own risk data (RAG-style).
- Statistics: risk trend over time, risk breakdown by category (technical/human/third-party/physical), top 5 riskiest assets, top 5 cost-effective fixes, compliance coverage % per framework, peer/sector benchmark comparison (illustrative).
- Incident cost breakdown: downtime cost, regulatory fine, customer churn, breach response cost, reputational impact — grounds the headline ₹ number.
- Report export: available for any sheet, base or combined — includes ₹ exposure, contributing factors, interconnection narrative (if applicable), compliance rollup, prioritized recommendations.

---

## 5. AI "Agents" Summary (naming device for pitch)

| Agent | Role | Rules-first? |
|---|---|---|
| Analyst Agent | Input normalization / intake | ✅ ~20-25 rules |
| Assessor Agent | Risk quantification / scoring | ✅ ~30 rules |
| Correlation Agent | Combined-sheet interconnection reasoning | ✅ ~20 rules |
| Advisor Agent | Investment optimization / recommendations | ✅ ~20-25 rules |
| Compliance Agent | Framework/audit gap narrative | ✅ ~25-30 rules |

---

## 6. Data Sources (for realistic demo without real enterprise access)

- NVD (National Vulnerability Database) — real CVE/CVSS data via free API.
- IBM Cost of a Data Breach Report — India-specific breach cost figures, for grounding incident cost breakdowns.
- Simulated org profile(s) as demo narrative (e.g., a fictional Indian NBFC or hospital chain).
- Public exposure scan output (DNS/SSL/tech stack) — real, legally obtainable data given just a domain name.

---

## 7. Suggested Tech Stack

- **Backend:** Python (FastAPI), pandas/numpy/scikit-learn for scoring, LLM API for AI reasoning layers
- **Frontend:** React/Next.js dashboard, Recharts/D3 for investment curves and trend charts, graph visualization library (e.g. Cytoscape.js / D3-force) for the network graph
- **Database:** PostgreSQL (structured risk/asset data), optionally MongoDB for raw+normalized event/document storage
- **Containerization:** Docker for deployability

---

## 8. Demo Centerpiece Recommendation

Given hackathon time constraints, the three pillars to make bulletproof for the live demo:
1. **Org profile scaling** — same vulnerability, different ₹ impact shown for two different org sizes.
2. **Network graph blast radius** — click a vulnerable node, see the visual ripple + ₹ number.
3. **Live "what-if" toggle** — flip a control on/off, watch risk score and graph update in real time.

Compliance mapping, peer benchmarking, and the insurance-readiness angle are strong for the pitch narrative but can remain lighter-weight in the live build.

---

*Business model, monetization, and go-to-market aspects to be discussed separately.*
