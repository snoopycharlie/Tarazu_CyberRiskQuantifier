# System Architecture

The Tarazu Cyber Risk Quantification platform is built on a modern, decoupled architecture designed for rapid simulation and rich visual feedback.

## High-Level Flow

```mermaid
flowchart LR
    UI[Frontend (React)] <--> API[Backend API (FastAPI)]
    API <--> Data[In-Memory Store]
    API <--> RiskEngine[Risk & Math Engine]
    API <--> AI[Mock AI/Parsing Layer]
```

## Frontend (React + Vite)
- **Framework:** React 18, Vite, TypeScript
- **Styling:** TailwindCSS and vanilla CSS.
- **State Management:** Handled largely through local component state (`useState`, `useEffect`) and context where applicable, allowing tight coupling to the UI lifecycle for rapid prototypes.
- **Visualization:**
  - `recharts` for Advisor Analytics and standard charting.
  - `react-force-graph-2d` for the Blast Radius/Impact Map topology.
  - `framer-motion` for smooth UI transitions and micro-animations.

## Backend (FastAPI + Python)
- **Framework:** FastAPI
- **Core Modules:**
  - `main.py`: Entrypoint and CORS config.
  - `api/`: Route definitions (organizations, sheets, assets, telemetry, simulator).
  - `services/`: Business logic.
    - `seed_data.py`: Handles the creation of the in-memory mock databases for Suraksha, Acme, and FreshBites.
    - `risk_engine.py`: The heart of the platform. Computes asset risk and propagates dependencies.

## Data Flow & Persistence
There is currently no PostgreSQL or external database. All data is generated in-memory on application startup (`lifespan` in FastAPI) and persists for the duration of the server process.

## Module Communication

1. **Telemetry Request:** Frontend asks for `DashboardSummary`. Backend aggregates total Expected Annual Loss (EAL) and Risk scores, returning formatted data.
2. **Simulation Request:** Frontend sends a list of `ScenarioChange` objects. Backend clones the in-memory state, applies the changes, runs the Risk Engine, and returns a diff.
3. **Document Ingestion Request:** Frontend sends file/text. Backend (mocked LLM layer) parses the data, returns missing controls, and awaits a commit request to merge into the live memory state.
