"""
services/nvd_client.py — NVD CVE 2.0 API client for Tarazu.

Fetches real CVE/CVSS data from NIST NVD.
No API key needed for low volume. Rate limited at 5 req/30s without key.
Includes in-memory cache + retry-with-backoff.
"""
from __future__ import annotations
import asyncio
import hashlib
import logging
import time
from typing import Optional
import httpx

from ..config import settings

logger = logging.getLogger(__name__)

# ── In-Memory Cache ───────────────────────────────────────────────────────────
_cache: dict[str, dict] = {}  # key → {"data": ..., "ts": float}
CACHE_TTL = 3600  # 1 hour


def _cache_key(query: str) -> str:
    return hashlib.md5(query.lower().strip().encode()).hexdigest()


def _get_cached(key: str) -> Optional[list[dict]]:
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_TTL:
        return entry["data"]
    return None


def _set_cache(key: str, data: list[dict]) -> None:
    _cache[key] = {"data": data, "ts": time.time()}


# ── CVSS Extraction Helpers ───────────────────────────────────────────────────

def _extract_cvss(cve_item: dict) -> tuple[Optional[float], Optional[str]]:
    """Extract best available CVSS score from NVD response item."""
    metrics = cve_item.get("metrics", {})

    # Prefer CVSS v3.1, then v3.0, then v2.0
    for key in ("cvssMetricV31", "cvssMetricV30"):
        entries = metrics.get(key, [])
        if entries:
            data = entries[0].get("cvssData", {})
            score = data.get("baseScore")
            severity = data.get("baseSeverity")
            if score is not None:
                return float(score), severity

    for entry in metrics.get("cvssMetricV2", []):
        data = entry.get("cvssData", {})
        score = data.get("baseScore")
        if score is not None:
            return float(score), entry.get("baseSeverity")

    return None, None


def _parse_cve(cve_item: dict) -> dict:
    """Parse a single CVE item from NVD API response."""
    cve_id = cve_item.get("id", "")
    descriptions = cve_item.get("descriptions", [])
    desc = next((d["value"] for d in descriptions if d.get("lang") == "en"), "")
    cvss_score, cvss_severity = _extract_cvss(cve_item)
    published = cve_item.get("published", "")[:10]

    return {
        "cve_id": cve_id,
        "cvss_score": cvss_score,
        "cvss_severity": cvss_severity,
        "description": desc[:500] if desc else "",
        "published": published,
        "nvd_url": f"https://nvd.nist.gov/vuln/detail/{cve_id}" if cve_id else None,
    }


# ── Main Client ───────────────────────────────────────────────────────────────

async def search_cves(
    keyword: str,
    max_results: int = 5,
    retries: int = 3,
) -> list[dict]:
    """
    Search NVD CVE database by keyword (software name + version).
    Returns up to max_results CVE entries with CVSS scores.
    Falls back to empty list on error — never crashes the app.
    """
    cache_key = _cache_key(f"{keyword}:{max_results}")
    cached = _get_cached(cache_key)
    if cached is not None:
        logger.debug("NVD cache hit for %s", keyword)
        return cached

    url = settings.nvd_api_base
    params = {
        "keywordSearch": keyword,
        "resultsPerPage": min(max_results, 20),
    }

    for attempt in range(retries):
        try:
            async with httpx.AsyncClient(timeout=settings.nvd_api_timeout) as client:
                resp = await client.get(url, params=params)
                resp.raise_for_status()
                data = resp.json()

            vulns = data.get("vulnerabilities", [])
            results = [_parse_cve(v["cve"]) for v in vulns if "cve" in v]
            _set_cache(cache_key, results)
            logger.info("NVD: fetched %d CVEs for '%s'", len(results), keyword)
            return results

        except httpx.HTTPStatusError as exc:
            if exc.response.status_code == 403:
                logger.warning("NVD rate-limited (403). Waiting 30s before retry %d/%d", attempt + 1, retries)
                await asyncio.sleep(30)
            else:
                logger.warning("NVD HTTP error %d for '%s': %s", exc.response.status_code, keyword, exc)
                break
        except (httpx.RequestError, Exception) as exc:
            wait = 2 ** attempt
            logger.warning("NVD request error for '%s' (attempt %d/%d): %s. Waiting %ds", keyword, attempt + 1, retries, exc, wait)
            if attempt < retries - 1:
                await asyncio.sleep(wait)

    logger.warning("NVD: all retries exhausted for '%s'. Returning empty.", keyword)
    return []


async def get_cve_by_id(cve_id: str) -> Optional[dict]:
    """Fetch a single CVE by its ID (e.g. CVE-2021-44228)."""
    cache_key = _cache_key(f"id:{cve_id}")
    cached = _get_cached(cache_key)
    if cached is not None:
        return cached[0] if cached else None

    url = f"{settings.nvd_api_base}?cveId={cve_id}"
    try:
        async with httpx.AsyncClient(timeout=settings.nvd_api_timeout) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            data = resp.json()

        vulns = data.get("vulnerabilities", [])
        if vulns:
            result = _parse_cve(vulns[0]["cve"])
            _set_cache(cache_key, [result])
            return result
    except Exception as exc:
        logger.warning("NVD get_cve_by_id failed for %s: %s", cve_id, exc)

    return None
