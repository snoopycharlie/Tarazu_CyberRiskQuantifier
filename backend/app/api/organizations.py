"""
app/api/organizations.py — Organization profile CRUD & Demo Pillar #1 comparison endpoint.
"""
from __future__ import annotations
import logging
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..database import get_db
from ..auth import AuthContext, assert_org_access, require_api_key
from ..models import Organization, Sheet
from ..schemas import OrgCreate, OrgOut, DemoComparison
from ..services.rules_engine import (
    OrgContext, AssetContext, VulnContext, ControlsContext,
    compute_asset_risk
)
from ..services.seed_data import seed_demo_org, seed_baseline_controls_for_org

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])


@router.get("", response_model=list[OrgOut])
async def list_organizations(
    db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """List all registered organizations."""
    stmt = select(Organization).order_by(Organization.created_at.desc())
    if not auth.can_access_all_orgs:
        stmt = stmt.where(Organization.id.in_(auth.allowed_org_ids))
    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("", response_model=OrgOut, status_code=status.HTTP_201_CREATED)
async def create_organization(
    payload: OrgCreate, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Create a new organization profile."""
    if not auth.can_access_all_orgs:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an administrator key can create organizations")
    org = Organization(
        name=payload.name,
        sector=payload.sector,
        size_tier=payload.size_tier,
        employee_count=payload.employee_count,
        annual_revenue_inr=payload.annual_revenue_inr,
    )
    db.add(org)
    await db.commit()
    await db.refresh(org)

    # Automatically create a default sheet for the new organization
    default_sheet = Sheet(
        org_id=org.id,
        name="Primary Infrastructure",
        type="base",
        is_org_wide_included=True,
    )
    db.add(default_sheet)

    # Automatically seed baseline controls (absent) so optimizer and compliance work immediately
    await seed_baseline_controls_for_org(db, org.id, default_status="absent")
    await db.commit()

    return org


@router.post("/seed", response_model=OrgOut)
async def seed_organization(
    db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Ensure Suraksha Finance Ltd demo organization is seeded."""
    if not auth.can_access_all_orgs:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only an administrator key can seed demo data")
    org = await seed_demo_org(db)
    return org


@router.get("/demo-comparison", response_model=DemoComparison)
async def get_demo_comparison():
    """
    Demo Pillar #1 — MSME vs Enterprise identical vulnerability comparison.
    Shows mathematically how the exact same critical CVE on a core database yields
    vastly different explainable ₹ Expected Annual Loss (EAL) due to organizational scaling factors.
    """
    # 1. MSME Profile (Cooperative Bank / FinTech MSME)
    msme_context = OrgContext(
        sector="BFSI",
        size_tier="MSME",
        employee_count=50,
        annual_revenue_inr=150_000_000.0,  # ₹15 Crore
    )

    # 2. Enterprise Profile (National Tier-1 Bank / Large NBFC)
    enterprise_context = OrgContext(
        sector="BFSI",
        size_tier="Enterprise",
        employee_count=8500,
        annual_revenue_inr=50_000_000_000.0,  # ₹5,000 Crore
    )

    # Shared Asset & Vulnerability
    asset_ctx = AssetContext(
        name="Core Banking Database (Oracle 19c)",
        asset_type="Database",
        criticality_tag="core_db",
        revenue_dependency_pct=30.0,
    )

    vuln_ctx = [
        VulnContext(
            cve_id="CVE-2023-4966",
            cvss_score=9.4,
            days_unpatched=75,
            description="Buffer overflow allowing unauthenticated remote session hijacking and sensitive data exfiltration.",
        )
    ]

    # Shared baseline controls context (missing PAM & EDR)
    controls_ctx = ControlsContext(
        mfa_admin="present",
        edr="absent",
        immutable_backups="partial",
        tls_encryption="present",
        patch_management="absent",
        privileged_access_mgmt="absent",
    )

    # Compute risk deterministically for both
    msme_output = compute_asset_risk(msme_context, asset_ctx, vuln_ctx, controls_ctx)
    enterprise_output = compute_asset_risk(enterprise_context, asset_ctx, vuln_ctx, controls_ctx)

    scaling_factor = round(
        enterprise_output.expected_annual_loss_inr / max(msme_output.expected_annual_loss_inr, 1.0),
        1
    )

    explanation = (
        f"The identical CVE-2023-4966 (CVSS 9.4, 75 days unpatched) generates ₹{msme_output.expected_annual_loss_inr:,.0f} EAL "
        f"for an MSME versus ₹{enterprise_output.expected_annual_loss_inr:,.0f} EAL for an Enterprise ({scaling_factor}x differential). "
        "This divergence is driven by Single Loss Expectancy (SLE) scaling: revenue dependency (₹15 Cr vs ₹5,000 Cr), "
        "employee scale, customer breach notification exposure, and regulatory sanction liabilities under RBI/DPDP regulations."
    )

    from datetime import datetime, timezone
    now = datetime.now(timezone.utc)

    return DemoComparison(
        msme_org=OrgOut(
            id="demo-msme",
            name="Gramin FinTech Services (MSME)",
            sector="BFSI",
            size_tier="MSME",
            employee_count=50,
            annual_revenue_inr=150_000_000.0,
            created_at=now,
        ),
        enterprise_org=OrgOut(
            id="demo-enterprise",
            name="Bharat Apex Bank Ltd (Enterprise)",
            sector="BFSI",
            size_tier="Enterprise",
            employee_count=8500,
            annual_revenue_inr=50_000_000_000.0,
            created_at=now,
        ),
        msme_eal_inr=msme_output.expected_annual_loss_inr,
        enterprise_eal_inr=enterprise_output.expected_annual_loss_inr,
        msme_rule_trace=msme_output.as_dict_trace(),
        enterprise_rule_trace=enterprise_output.as_dict_trace(),
        scaling_factor=scaling_factor,
        explanation=explanation,
    )


@router.get("/{org_id}", response_model=OrgOut)
async def get_organization(
    org_id: str, db: AsyncSession = Depends(get_db), auth: AuthContext = Depends(require_api_key)
):
    """Get organization by ID."""
    assert_org_access(auth, org_id)
    org = await db.get(Organization, org_id)
    if not org:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found")
    return org
