"""
app/main.py — FastAPI application entry point for Tarazu CyberRiskQuant.
"""
from __future__ import annotations
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .auth import require_api_key
from .database import init_db, AsyncSessionLocal
from .services.seed_data import seed_demo_org, seed_healthcare_org
from .api import (
    organizations,
    sheets,
    assets,
    cve,
    graph,
    optimization,
    compliance,
    reports,
    risk,
    modules,
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("tarazu")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: initialize database schema and seed demo organization."""
    logger.info("Starting Tarazu CyberRiskQuant backend...")
    logger.info("Database URL mode: %s", "SQLite (local)" if settings.is_sqlite else "PostgreSQL (Docker)")
    logger.info("Groq AI: %s (model: %s)", "Enabled" if settings.ai_enabled else "Disabled (Rules-Only Fallback)", settings.groq_model)

    # Initialize tables
    await init_db()
    logger.info("Database schema verified.")

    # Seed demo organizations if not already present
    try:
        async with AsyncSessionLocal() as session:
            await seed_demo_org(session)
            await seed_healthcare_org(session)
            await session.commit()
            logger.info("Demo organization verification completed.")
    except Exception as exc:
        logger.error("Error during initial demo seeding: %s", exc)

    yield

    logger.info("Shutting down Tarazu CyberRiskQuant backend...")


app = FastAPI(
    title="Tarazu (CyberRiskQuant) API",
    description="AI-Powered Continuous Cyber Risk Quantification Platform for Indian Organizations (SIH26105)",
    version="1.0.0",
    lifespan=lifespan,
)

# Enable CORS for frontend Vite dev server and production builds
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
protected = [Depends(require_api_key)]
app.include_router(organizations.router, dependencies=protected)
app.include_router(sheets.router, dependencies=protected)
app.include_router(assets.router, dependencies=protected)
app.include_router(cve.router, dependencies=protected)
app.include_router(graph.router, dependencies=protected)
app.include_router(optimization.router, dependencies=protected)
app.include_router(compliance.router, dependencies=protected)
app.include_router(reports.router, dependencies=protected)
app.include_router(risk.router, dependencies=protected)
app.include_router(modules.router, dependencies=protected)


@app.get("/health", tags=["System"])
@app.get("/api/health", tags=["System"])
async def health_check():
    """Health check endpoint confirming API status, DB mode, and Groq AI availability."""
    return {
        "status": "healthy",
        "app": "Tarazu CyberRiskQuant",
        "version": "1.0.0",
        "ai_enabled": settings.ai_enabled,
        "groq_model": settings.groq_model,
        "database": "sqlite" if settings.is_sqlite else "postgresql",
    }
