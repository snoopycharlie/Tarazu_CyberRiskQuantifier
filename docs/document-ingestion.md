# Intelligent Document Processing

Located under the "Platform Modules" tab, the Document Processing engine allows users to rapidly ingest unstructured data (PDFs, Network Scans, Audit Reports) into the structured quantitative model.

## Ingestion Lifecycle

```mermaid
flowchart LR
    Upload[Upload PDF / Scan] --> Extract[LLM Extraction]
    Extract --> Detect[Detect Topologies & Controls]
    Detect --> Confidence[Calculate Confidence Score]
    Confidence --> Preview[User Preview]
    Preview --> Commit[Commit to Live State]
```

## How It Works

1. **Upload / Select Preset:** A user uploads a real-world document (e.g., a SOC-2 Type II audit or an Information Security Policy PDF) or pastes raw Nmap network scan data. (For demo purposes, the app ships with preset synthetic data in `/synthetic-data/`).
2. **LLM Extraction:** The backend processes the document. It uses natural language processing to identify missing controls (e.g., "Clause 4.1 requires MFA") or network topology nodes.
3. **Data Transformation:** It converts the raw text into Tarazu's structured `Asset` and `Control` JSON schemas.
4. **User Preview:** Before altering the live Risk calculations, the user is presented with a preview of exactly what assets will be provisioned, and what controls will be marked as "absent" or "present".
5. **Commit:** The user clicks "Commit to Organization". The data is written to the live `seed_data.py` memory context, instantly updating the global Expected Annual Loss (EAL) and Blast Radius.

## Supported Formats
Currently, the system is designed to simulate processing for:
- PDF (Security Policies, SOC-2 Audits)
- TXT (Nmap scans, raw network exports)
- CSV (Asset inventories, Risk registers)

## Synthetic Test Data
Developers and agents can find realistic sample documents inside the `/synthetic-data/` folder at the root of the project to test this pipeline.
