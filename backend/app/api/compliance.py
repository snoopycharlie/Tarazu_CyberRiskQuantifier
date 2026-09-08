"""
app/api/compliance.py — ISO 27001 Annex A & RBI CSF Compliance Audit Engine (Stage E).
"""
from __future__ import annotations
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..auth import AuthContext, assert_org_access, require_api_key
from ..models import Organization, Control
from ..schemas import ComplianceSummary, ComplianceGapOut
from ..services.compliance_engine import evaluate_compliance, FRAMEWORK_CLAUSES
from ..services.ai_service import assess_compliance_gaps

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/compliance", tags=["Compliance & Framework Mapping"])


async def _build_framework_summary(
    framework: str,
    org: Organization,
    controls: list[Control]
) -> ComplianceSummary:
    """Helper to evaluate compliance and generate auditor AI narrative."""
    controls_data = [{"id": c.id, "name": c.name, "status": c.status} for c in controls]
    results = evaluate_compliance(framework, controls_data)

    total_clauses = len(results)
    satisfied_list = [r for r in results if r["status"] == "satisfied"]
    gaps_list = [r for r in results if r["status"] == "gap"]

    satisfied_count = len(satisfied_list)
    gaps_count = len(gaps_list)
    coverage_pct = round((satisfied_count / max(total_clauses, 1)) * 100.0, 1)

    # Run AI Compliance Agent
    ai_result = await assess_compliance_gaps(
        framework=framework,
        gaps=gaps_list,
        satisfied_count=satisfied_count,
        total_count=total_clauses,
        org_context={
            "name": org.name,
            "sector": org.sector,
            "size_tier": org.size_tier,
        }
    )

    gap_models = [
        ComplianceGapOut(
            id=f"{framework}-{r['clause_ref']}",
            org_id=org.id,
            framework=framework,
            clause_ref=r["clause_ref"],
            clause_title=r["clause_title"],
            status=r["status"],
            linked_control_id=r.get("linked_control_id"),
            control_name=r.get("control_name"),
        )
        for r in results
    ]

    return ComplianceSummary(
        framework=framework,
        total_clauses=total_clauses,
        satisfied=satisfied_count,
        gaps=gaps_count,
        coverage_pct=coverage_pct,
        gaps_list=gap_models,
        ai_narrative=ai_result.get("ai_narrative"),
        ai_mode=ai_result.get("ai_mode", "rules_only"),
    )


@router.get("/{org_id}/all", response_model=dict[str, ComplianceSummary])
async def get_all_frameworks_compliance(
    org_id: str, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Get audit results for all 8 major cyber security compliance frameworks simultaneously."""
    assert_org_access(auth, org_id)
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    controls_res = await db.execute(select(Control).where(Control.org_id == org_id))
    controls = controls_res.scalars().all()

    frameworks = ["ISO27001", "NIST_CSF", "CIS_CONTROLS", "RBI_CSF", "SEBI_CSCRF", "HIPAA", "PCI_DSS", "GDPR_DPDPA"]
    summaries = {}
    for fw in frameworks:
        summaries[fw] = await _build_framework_summary(fw, org, controls)

    return summaries


@router.get("/{org_id}", response_model=ComplianceSummary)
async def get_framework_compliance(
    org_id: str,
    framework: str = Query(default="RBI_CSF", regex="^(ISO27001|NIST_CSF|CIS_CONTROLS|RBI_CSF|SEBI_CSCRF|HIPAA|PCI_DSS|GDPR_DPDPA)$"),
    db: AsyncSession = Depends(get_db),
    auth: AuthContext = Depends(require_api_key),
):
    """Get compliance gap audit and AI narrative for a specific framework."""
    assert_org_access(auth, org_id)
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")

    controls_res = await db.execute(select(Control).where(Control.org_id == org_id))
    controls = controls_res.scalars().all()

    return await _build_framework_summary(framework, org, controls)
