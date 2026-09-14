# Development Guide

This guide contains everything you need to get Tarazu running locally and how to start contributing to the codebase.

## Prerequisites
- Node.js (v18+)
- Python 3.9+
- `npm` or `yarn`

## Local Setup

### 1. Start the Backend
The backend runs on FastAPI and uses Uvicorn.
```bash
cd backend
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
The API will be available at `http://127.0.0.1:8000`. You can view the swagger docs at `http://127.0.0.1:8000/docs`.

### 2. Start the Frontend
The frontend uses Vite.
```bash
cd frontend
npm install
npm run dev
```
The UI will be available at `http://localhost:5173`.

## Adding a New Organization

To add a new mock organization to the application:
1. Navigate to `backend/app/services/seed_data.py`.
2. Look at the existing functions (`seed_suraksha_finance`, `seed_small_business_org`).
3. Create a new function `seed_my_new_org()`.
4. Call your function inside the `lifespan` block in `backend/app/main.py`.

## Adding Synthetic Data

If you want to test the Document Ingestion pipeline:
1. Create your mock file (PDF, TXT, CSV) inside `/synthetic-data/`.
2. If you want to automatically generate it, update `backend/scripts/generate_synthetic_docs.py` and run `python scripts/generate_synthetic_docs.py`.

## Adding New Analytics

1. Open `frontend/src/components/pillar3/AdvisorAnalytics.tsx`.
2. The component uses `recharts`.
3. Add a new `<ResponsiveContainer>` block.
4. If your chart requires new derived data, aggregate it via `useMemo` at the top of the component using the `summary` prop before feeding it to the chart.

## Code Conventions
- Keep all UI terminology business-friendly (avoid "OCR", use "Document Reading").
- Ensure all monetary values are formatted using `formatMoney(value, currency)` from `frontend/src/utils/format.ts`.
- Do not double-count metrics in the simulation engine. Rely exclusively on the backend `api.whatIfSimulation` delta.
