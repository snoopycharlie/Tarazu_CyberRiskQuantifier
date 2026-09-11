# Tarazu — CyberRiskQuant

> **AI-Powered Continuous Cyber Risk Quantification & Investment Optimization Platform**
> Smart India Hackathon 2026 · SIH26105 · Sponsor: AICTE · Theme: Blockchain & Cybersecurity

[![SIH 2026](https://img.shields.io/badge/SIH-2026-orange?style=flat-square)](https://www.sih.gov.in/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Groq](https://img.shields.io/badge/AI-Groq%20Llama--3.3--70B-purple?style=flat-square)]()
[![Docker](https://img.shields.io/badge/Deploy-Docker%20Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)

---

## What is Tarazu?

**Tarazu** (Hindi: तराज़ू, *scales/balance*) translates vague, qualitative cyber risk labels into **explainable Indian Rupee financial exposure** using a FAIR-calibrated, rules-first quantification engine — so boards, CFOs, and regulators can act on real numbers, not gut feelings.

### Key Differentiators

| Differentiator | Detail |
|---|---|
| India-First | Native support for RBI CSF, SEBI CSCRF, CERT-In directions, DPDP Act 2023 |
| FAIR-Calibrated | EAL = LEF x SLE formula, grounded in IBM India CODB breach-cost data |
| Rules-Before-AI | 30+ deterministic rules resolve most cases; AI calibrates within ±30% bounds |
| Explainable-by-Design | Every rupee figure is traceable to a specific rule + AI narrative — auditor-defensible |
| Scale-Agnostic | Same engine, different outputs for MSME (x0.6) vs. Enterprise (x2.2) |

---

## System Architecture

```mermaid
graph TB
    subgraph "User Layer"
        U["CISO / CFO / Analyst"]
    end

    subgraph "Frontend - React + Vite + TypeScript"
        LP[Login Page]
        NAV[Navbar + Org Switcher]
        DB[Dashboard View]
        P1[Pillar 1 - Scale Demo]
        P2[Pillar 2 - Graph and Blast Radius]
        P3[Pillar 3 - Advisor / ROSI]
        WI[What-If Sandbox]
        SH[Sheets View]
        CO[Compliance View]
        MO[Modules View]
        INT[Asset Intake Modal]
        REP[Audit Report Modal]
    end

    subgraph "Nginx Proxy - Production"
        NX["nginx - /api to backend - Adds API_PROXY_KEY header"]
    end

    subgraph "Backend - FastAPI + SQLAlchemy"
        API_ORG["/api/organizations"]
        API_SH["/api/sheets"]
        API_AS["/api/assets"]
        API_CVE["/api/cve"]
        API_GR["/api/graph"]
        API_OPT["/api/optimization"]
        API_CO["/api/compliance"]
        API_REP["/api/reports"]
        API_MO["/api/modules"]
    end

    subgraph "Service Layer"
        RE["Rules Engine - 30+ rules"]
        AI["Groq AI Service - Llama-3.3-70B"]
        CE["Compliance Engine - 8 Frameworks"]
        COR["Correlation Engine - Graph Topology"]
        OPT["Optimizer - Greedy Knapsack"]
        IE["Intake Engine - NLP + CSV/JSON"]
        NVD["NVD Client - NIST CVE API v2.0"]
        BR["Blast Radius Engine - NetworkX"]
    end

    subgraph "Database Layer"
        SQLITE[("SQLite - Local Dev")]
        PG[("PostgreSQL 16 - Production")]
    end

    subgraph "External APIs"
        GROQ["Groq API - Llama-3.3-70B"]
        NVD_API["NIST NVD API v2.0"]
    end

    U --> LP
    LP --> NAV
    NAV --> DB
    NAV --> P1
    NAV --> P2
    NAV --> P3
    NAV --> WI
    NAV --> SH
    NAV --> CO
    NAV --> MO
    DB --> INT
    DB --> REP

    API_AS --> RE --> AI
    API_AS --> IE
    API_CO --> CE --> AI
    API_SH --> COR --> AI
    API_OPT --> OPT --> AI
    API_GR --> BR
    API_CVE --> NVD

    AI --> GROQ
    NVD --> NVD_API
    RE --> SQLITE
    RE --> PG
```

---

## Rules-Before-AI Engine Design

Every AI component is preceded by a deterministic rules layer that resolves most cases cheaply and auditably. AI is invoked **only for residual complexity**.

```mermaid
flowchart LR
    A([Structured Input]) --> B{"Rules Engine\n30+ deterministic rules"}
    B -->|"Most cases resolved\ncheaply and auditably"| C(["EAL + Rule Trace"])
    B -->|"Unresolved or ambiguous\nor needs judgment"| D["AI Layer\nGroq Llama-3.3-70B"]
    D -->|"Plus/Minus 30% bounded\nadjustment only"| E(["Calibrated EAL\n+ Plain-English Narrative"])
    C --> F(["Final Output\nBoard-Defensible INR Number"])
    E --> F
```

---

## FAIR Risk Quantification Formula

```mermaid
flowchart TD
    A["SLE Base\nRevenue x RevDep% x 0.05 + Employees x 15000\nfloor: 1,00,000 INR"] --> B
    B["Tier Multiplier\nMSME x 0.6 or Mid x 1.0 or Enterprise x 2.2"] --> C
    C["Rules Engine\nAccumulates LEF additions, SLE multipliers, fixed INR additions"] --> D
    D["EAL Computation\nSLE_base x SLE_multiplier x LEF + fixed_additions"] --> E
    E["AI Calibration\nBounded adjustment -30% to +30%"] --> F
    F(["Final EAL in INR\nPer Asset then Sheet Rollup then Org-Wide Total"])
```

---

## User Flow

```mermaid
flowchart TD
    A([User visits platform]) --> B[Login Page]
    B --> C{Authenticated?}
    C -->|Yes| D["Auto-load demo org\nSuraksha Finance Ltd"]
    C -->|No| B
    D --> E["Dashboard\nEAL + KPIs + Top Risks"]

    E --> F1[Open Asset Intake Modal]
    E --> F2[Navigate to Sheets]
    E --> F3[Navigate to Network Graph]
    E --> F4[Navigate to Advisor]
    E --> F5[Navigate to Compliance]
    E --> F6[Navigate to Modules]

    F1 --> G1{Intake method}
    G1 -->|Guided form| H1["Fill asset fields\nCriticality, CVE, days"]
    G1 -->|Conversational| H2["Type free text\nAI Analyst Agent parses"]
    G1 -->|File upload| H3["Upload CSV or JSON\nBatch intake up to 50 assets"]
    H1 & H2 & H3 --> I["Rules Engine + AI Assessor\nCompute EAL in real-time"]
    I --> E

    F2 --> J["Select sheet tab\nCorporate IT, Payment, Cloud"]
    J --> J1[View assets + EAL per asset]
    J1 --> J2["Click rule trace\nSee explainability breakdown"]

    F3 --> K[Cytoscape.js network graph]
    K --> K1[Click vulnerable node]
    K1 --> K2["Blast radius highlight\nDownstream INR ripple"]

    F4 --> L[Enter budget in INR]
    L --> L1[Greedy Knapsack optimizer]
    L1 --> L2["View ROSI chart\nAI Advisor narrative"]
    L2 --> L3["Run What-If\ntoggle control on/off\nwatch score update live"]

    F5 --> M["Select framework\nRBI CSF, ISO27001, etc"]
    M --> M1["See gap audit results\nClause-by-clause"]
    M1 --> M2[AI Compliance Agent narrative]

    F6 --> N[Platform Modules]
    N --> N1["Document Ingestion\nPDF / SOC-2 / Architecture Diagram"]
    N --> N2[DPDP Act Calculator]
    N --> N3[Board Deck Generator]
    N --> N4[Vendor Contract Review]
    N --> N5["RAG CISO Assistant\nChat with your risk data"]

    E --> O["Generate Audit Report\nINR exposure + compliance + recommendations"]
```

---

## Data Model

```mermaid
erDiagram
    Organization {
        string id PK
        string name
        string sector
        string size_tier
        int employee_count
        float annual_revenue_inr
        datetime created_at
    }
    Sheet {
        string id PK
        string org_id FK
        string name
        string type
        json source_sheet_ids
        bool is_org_wide_included
        datetime created_at
    }
    Asset {
        string id PK
        string sheet_id FK
        string name
        string asset_type
        string criticality_tag
        float revenue_dependency_pct
        json metadata_json
        datetime created_at
    }
    Vulnerability {
        string id PK
        string asset_id FK
        string cve_id
        float cvss_score
        string description
        int days_unpatched
        string source
        datetime created_at
    }
    Control {
        string id PK
        string org_id FK
        string name
        string status
        float cost_inr
        json framework_clause_refs
    }
    RiskScore {
        string id PK
        string sheet_id FK
        string asset_id FK
        float expected_annual_loss_inr
        json rule_trace
        string ai_narrative
        float ai_adjustment_pct
        string ai_mode
        datetime computed_at
    }
    GraphEdge {
        string id PK
        string sheet_id FK
        string source_asset_id FK
        string target_asset_id FK
        string dependency_strength
        datetime created_at
    }
    Recommendation {
        string id PK
        string org_id FK
        string control_id FK
        float risk_reduction_inr
        float cost_inr
        float roi_ratio
        string ai_rationale
    }
    ComplianceGap {
        string id PK
        string org_id FK
        string framework
        string clause_ref
        string clause_title
        string status
        string linked_control_id FK
    }

    Organization ||--o{ Sheet : "has"
    Organization ||--o{ Control : "defines"
    Organization ||--o{ Recommendation : "receives"
    Organization ||--o{ ComplianceGap : "has"
    Sheet ||--o{ Asset : "contains"
    Sheet ||--o{ RiskScore : "aggregates to"
    Sheet ||--o{ GraphEdge : "has"
    Asset ||--o{ Vulnerability : "has"
    Asset ||--o{ RiskScore : "scored as"
    Control ||--o{ Recommendation : "linked in"
    Control ||--o| ComplianceGap : "satisfies"
```

---

## Frontend Navigation Map

```mermaid
graph LR
    LP[Login Page] --> APP["App Shell - Navbar + Org Switcher"]

    APP --> TAB1["Dashboard"]
    APP --> TAB2["Pillar 1 - Scale Demo"]
    APP --> TAB3["Pillar 2 - Network Graph"]
    APP --> TAB4["Pillar 3 - Advisor / ROSI"]
    APP --> TAB5["What-If Sandbox"]
    APP --> TAB6["Sheets"]
    APP --> TAB7["Compliance"]
    APP --> TAB8["Modules"]
    APP --> TAB9["Settings"]

    TAB1 --> M1[Asset Intake Modal]
    TAB1 --> M2[Audit Report Modal]
    TAB1 --> M3[Demo Guide Overlay]
    APP --> M4[New Org Modal]

    TAB6 --> S1[Sheet Selector]
    TAB6 --> S2[Asset Table]
    TAB6 --> S3[Rule Trace Explainer]

    TAB3 --> G1[Cytoscape Graph]
    TAB3 --> G2[Blast Radius Highlight]

    TAB4 --> A1[Budget Input]
    TAB4 --> A2[Control ROI Table]
    TAB4 --> A3[ROSI Chart]

    TAB8 --> MOD1["Document Ingestion - PDF OCR / SOC-2 / Diagram"]
    TAB8 --> MOD2[DPDP Calculator]
    TAB8 --> MOD3[Board Deck Generator]
    TAB8 --> MOD4[Vendor Contract Review]
    TAB8 --> MOD5[RAG CISO Assistant]
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Client Browser"
        B[Browser]
    end

    subgraph "Docker Compose Stack"
        subgraph "frontend container"
            NX["Nginx :80"]
            REACT["React SPA static files"]
            NX --> REACT
        end

        subgraph "backend container"
            UV["Uvicorn :8000 internal only"]
            FA[FastAPI App]
            UV --> FA
        end

        subgraph "postgres container"
            PG[("PostgreSQL 16 port 5432 internal")]
        end

        NX -->|"proxy /api with API_PROXY_KEY"| UV
        FA --> PG
    end

    B -->|"FRONTEND_PORT default 5173"| NX

    subgraph "External"
        GROQ[Groq API]
        NVD[NIST NVD API]
    end

    FA --> GROQ
    FA --> NVD
```

### Production deployment

The Docker Compose deployment serves the React application through Nginx. Nginx proxies `/api` to the private backend service and adds the API key on the server side, so browser code never contains the deployment secret.

1. Copy `.env.example` to `.env`.
2. Replace `API_PROXY_KEY` with a long, unique value.
3. Set `API_KEY_TENANTS` as JSON, mapping each key to organization UUIDs. A trusted operator key may use `["*"]`; tenant keys should list only their own organization IDs.
4. Set `GROQ_API_KEY` for AI-assisted mode (omit for rules-only fallback).
5. Start the stack with `docker compose up --build`.

### Local development (no Docker)

For a local-only demo, set `AUTH_REQUIRED=false`.

```text
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev
```

---

## AI Agents Summary

| Agent | Trigger | Rules First | AI Role |
|---|---|---|---|
| **Analyst Agent** | Asset intake (text / file) | ~20-25 keyword and regex rules | NLP entity extraction, asset normalization |
| **Assessor Agent** | Every asset risk computation | 30+ FAIR rules (R01-R30) | Calibrate ±30%, board-ready narrative |
| **Correlation Agent** | Combined sheet creation | ~20 graph topology rules | Explain compounding vs. naive sum |
| **Advisor Agent** | Investment optimization | Greedy Knapsack math (deterministic) | Explain why control mix maximizes ROSI, flag tradeoffs |
| **Compliance Agent** | Compliance gap evaluation | Clause lookup tables (8 frameworks) | Priority-ordered gap narrative for auditors |

---

## Supported Compliance Frameworks

| Framework | India-Specific |
|---|---|
| ISO 27001 Annex A | — |
| NIST Cybersecurity Framework (CSF) | — |
| CIS Controls | — |
| RBI Cyber Security Framework | Yes |
| SEBI CSCRF | Yes |
| HIPAA | — |
| PCI DSS | — |
| GDPR / DPDP Act 2023 | Yes |

---

## Key Rules Sample

| Rule ID | Trigger | Effect |
|---|---|---|
| R01_CVSS_CRITICAL | CVSS >= 9.0, unpatched >30 days | LEF +45% |
| R04_NO_MFA_ADMIN | MFA absent on admin accounts | LEF +35% |
| R06_NO_BACKUP_AIRGAP | No immutable backups | SLE x1.40 ransomware factor |
| R07_PAYMENT_PROCESSING | Asset tagged payment_processing | Fixed 25L to 1.5Cr penalty |
| R08_CORE_DATABASE | Asset tagged core_db | Fixed 35L to 2Cr penalty |
| R10_SECTOR_BFSI_RBI_COMPLIANCE | BFSI + no PAM | Fixed 15L RBI sanction |
| R12_SECTOR_HEALTHCARE_DPDP | Healthcare + patient data asset | Fixed 20L DPDP Act |
| R29_CERT_IN_6HR_REPORTING | High CVSS + no SIEM | Fixed 10L CERT-In penalty |
| R30_CYBER_INSURANCE_RECOVERY | Cyber insurance present | EAL x 0.65 (35% offset) |

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS v4, Framer Motion, Recharts |
| **Network Graph** | Cytoscape.js |
| **Backend** | Python 3.11+, FastAPI 0.115, SQLAlchemy 2.0 async, Pydantic v2 |
| **Database** | SQLite (local dev) / PostgreSQL 16 (production) |
| **AI** | Groq API (Llama-3.3-70B-Versatile), fallback to rules-only |
| **Graph Algorithms** | NetworkX 3.5 |
| **Auth** | API key scoped per tenant via API_KEY_TENANTS map |
| **Containerization** | Docker + Docker Compose |
| **Web Server** | Nginx (frontend), Uvicorn (backend) |
| **External Data** | NIST NVD API v2.0 (real CVE/CVSS data) |

---

## Verification

```text
cd backend && python test_backend.py
cd frontend && npm run build
```

The backend verification covers the three demo pillars, compliance mapping, and database seeding. The frontend build produces separate on-demand chunks for the graph, advisor, sheets, compliance, and modal views.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GROQ_API_KEY` | Optional | Groq API key; omit for rules-only mode |
| `GROQ_MODEL` | Optional | Defaults to llama-3.3-70b-versatile |
| `DATABASE_URL` | Optional | PostgreSQL URL; omit for local SQLite |
| `API_PROXY_KEY` | Production | Key injected by Nginx proxy |
| `API_KEY_TENANTS` | Production | JSON map of key to org_ids list |
| `AUTH_REQUIRED` | Optional | Set false for no-auth local dev |
| `CORS_ORIGINS` | Optional | Comma-separated allowed origins |
| `SEED_ON_STARTUP` | Optional | Defaults true; seeds demo org |

---

## Project Structure

```
SIH_26105/
├── backend/
│   ├── app/
│   │   ├── api/              # FastAPI routers (assets, sheets, compliance, ...)
│   │   ├── services/         # Business logic (rules_engine, ai_service, optimizer, ...)
│   │   ├── models.py         # SQLAlchemy ORM models
│   │   ├── schemas.py        # Pydantic request/response schemas
│   │   ├── config.py         # Env-driven settings
│   │   ├── auth.py           # API key middleware
│   │   ├── database.py       # Async engine + session factory
│   │   └── main.py           # App entry point, router mounting
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/       # React views (dashboard, graph, compliance, ...)
│   │   ├── services/         # Typed API client
│   │   ├── types/            # TypeScript type definitions
│   │   └── App.tsx           # Root with lazy-loading + routing
│   ├── nginx/                # Production Nginx config template
│   ├── Dockerfile
│   └── package.json
├── docs/
│   └── SIH26105_Project_Blueprint.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

*Tarazu · FAIR-Calibrated · Rules-Before-AI · NIST NVD API v2.0 · SIH 2026 — AICTE Sponsored*
