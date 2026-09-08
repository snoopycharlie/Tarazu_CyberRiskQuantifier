# Tarazu — CyberRiskQuant

Tarazu is a rules-first cyber-risk quantification platform for Indian organizations. It turns assets, vulnerabilities, controls, and dependency graphs into explainable Expected Annual Loss (EAL), remediation priorities, and compliance views.

## Production deployment

The Docker Compose deployment serves the React application through Nginx. Nginx proxies `/api` to the private backend service and adds the API key on the server side, so browser code never contains the deployment secret.

1. Copy `.env.example` to `.env`.
2. Replace `API_PROXY_KEY` with a long, unique value.
3. Set `API_KEY_TENANTS` as JSON, mapping each key to organization UUIDs. A trusted operator key may use `["*"]`; tenant keys should list only their own organization IDs.
4. Start the stack with `docker compose up --build`.

The backend is intentionally not published to the host; access flows through the frontend proxy on `FRONTEND_PORT` (default: 5173).

## Local development

For a local-only demo, set `AUTH_REQUIRED=false` in `backend/.env` or the shell that launches the API. For key-protected local development, set `VITE_API_KEY` in `frontend/.env.local` to a key configured in `API_KEY_TENANTS`.

Run the services separately:

```text
cd backend && uvicorn app.main:app --reload
cd frontend && npm run dev
```

## Verification

```text
cd backend && python test_backend.py
cd frontend && npm run build
```

The backend verification covers the three demo pillars, compliance mapping, and database seeding. The frontend build produces separate on-demand chunks for the graph, advisor, sheets, compliance, and modal views.
