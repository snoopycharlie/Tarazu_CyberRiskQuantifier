"""
app/api/cve.py — NVD CVE 2.0 API proxy with caching.
"""
from __future__ import annotations
import logging
from typing import Optional
from fastapi import APIRouter, Query, HTTPException, status
from ..schemas import CVEMatch
from ..services.nvd_client import search_cves, get_cve_by_id

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/cve", tags=["CVE"])


@router.get("/search", response_model=list[CVEMatch])
async def search_cve_endpoint(
    query: str = Query(..., min_length=2, description="Software name or CVE ID"),
    limit: int = Query(default=5, ge=1, le=20),
):
    """
    Search NIST NVD CVE 2.0 database by product keyword or CVE ID.
    Returns real CVEs with CVSS v3.1/v3.0 scores, cached for 1 hour.
    """
    try:
        results = await search_cves(query, max_results=limit)
        return results
    except Exception as exc:
        logger.warning("CVE search failed for query '%s': %s", query, exc)
        return []


@router.get("/{cve_id}", response_model=Optional[CVEMatch])
async def get_cve_endpoint(cve_id: str):
    """Retrieve details and CVSS score for a specific CVE identifier."""
    result = await get_cve_by_id(cve_id)
    if not result:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"CVE {cve_id} not found")
    return result
