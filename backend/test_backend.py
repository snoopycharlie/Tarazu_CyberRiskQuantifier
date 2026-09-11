"""
test_backend.py — Automated verification test suite for Tarazu CyberRiskQuant.
Tests all 3 demo pillars and engine calculations.
"""
from __future__ import annotations
import asyncio
import sys
import pytest

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from app.services.rules_engine import (
    OrgContext, AssetContext, VulnContext, ControlsContext,
    compute_asset_risk
)
from app.services.blast_radius import compute_blast_radius
from app.services.optimizer import compute_rosi, estimate_control_risk_reduction
from app.services.compliance_engine import evaluate_compliance
from app.database import init_db, AsyncSessionLocal
from app.services.seed_data import seed_demo_org, is_already_seeded
from app.models import Organization, Sheet, Asset, RiskScore
from sqlalchemy import select


def test_rules_engine():
    print("--> Testing Rules Engine...")
    org = OrgContext(sector="BFSI", size_tier="Mid", employee_count=1200, annual_revenue_inr=250_000_000.0)
    asset = AssetContext(name="Oracle DB", asset_type="Database", criticality_tag="core_db", revenue_dependency_pct=30.0)
    vulns = [VulnContext(cvss_score=9.8, days_unpatched=90, cve_id="CVE-2023-38606", description="Core DB RCE")]
    controls = ControlsContext(mfa_admin="absent", edr="absent", privileged_access_mgmt="absent")

    out = compute_asset_risk(org, asset, vulns, controls)
    assert out.expected_annual_loss_inr > 0, "EAL should be greater than 0"
    rule_ids = [r.rule_id for r in out.rule_trace]
    assert "R01_CVSS_CRITICAL" in rule_ids, "R01_CVSS_CRITICAL should trigger"
    assert "R04_NO_MFA_ADMIN" in rule_ids, "R04_NO_MFA_ADMIN should trigger"
    assert "R08_CORE_DATABASE" in rule_ids, "R08_CORE_DATABASE should trigger"
    print(f"    Rules Engine Passed! EAL: ₹{out.expected_annual_loss_inr:,.0f}, Rules triggered: {len(out.rule_trace)}")


def test_pillar_1_msme_vs_enterprise():
    print("--> Testing Demo Pillar #1 (MSME vs Enterprise Scaling)...")
    msme = OrgContext(sector="BFSI", size_tier="MSME", employee_count=50, annual_revenue_inr=150_000_000.0)
    enterprise = OrgContext(sector="BFSI", size_tier="Enterprise", employee_count=8500, annual_revenue_inr=50_000_000_000.0)

    asset = AssetContext(name="Core Banking DB", asset_type="Database", criticality_tag="core_db", revenue_dependency_pct=30.0)
    vulns = [VulnContext(cvss_score=9.4, days_unpatched=75, cve_id="CVE-2023-4966")]
    controls = ControlsContext(mfa_admin="present", edr="absent", privileged_access_mgmt="absent")

    msme_out = compute_asset_risk(msme, asset, vulns, controls)
    ent_out = compute_asset_risk(enterprise, asset, vulns, controls)

    assert ent_out.expected_annual_loss_inr > msme_out.expected_annual_loss_inr * 5, (
        f"Enterprise EAL ({ent_out.expected_annual_loss_inr}) should be dramatically higher than MSME ({msme_out.expected_annual_loss_inr})"
    )
    ratio = ent_out.expected_annual_loss_inr / msme_out.expected_annual_loss_inr
    print(f"    Pillar #1 Passed! MSME: ₹{msme_out.expected_annual_loss_inr:,.0f} vs Enterprise: ₹{ent_out.expected_annual_loss_inr:,.0f} ({ratio:.1f}x scaling)")


def test_pillar_2_blast_radius():
    print("--> Testing Demo Pillar #2 (Blast Radius Traversal)...")
    edges = [
        {"source_asset_id": "hr-laptop", "target_asset_id": "corp-vpn", "dependency_strength": "strong"},
        {"source_asset_id": "corp-vpn", "target_asset_id": "payment-gw", "dependency_strength": "strong"},
        {"source_asset_id": "payment-gw", "target_asset_id": "core-db", "dependency_strength": "strong"},
    ]
    eal_map = {
        "hr-laptop": 50_000.0,
        "corp-vpn": 500_000.0,
        "payment-gw": 25_000_000.0,
        "core-db": 35_000_000.0,
    }
    name_map = {
        "hr-laptop": "HR Workstation",
        "corp-vpn": "Corporate VPN Gateway",
        "payment-gw": "Core Payment Gateway",
        "core-db": "Core Banking Database",
    }

    blast = compute_blast_radius("hr-laptop", edges, eal_map, name_map)
    assert "payment-gw" in blast["reachable_asset_ids"], "Payment Gateway should be reachable from HR Laptop"
    assert "core-db" in blast["reachable_asset_ids"], "Core DB should be reachable from HR Laptop"
    assert blast["total_downstream_exposure_inr"] >= 60_500_000.0, "Downstream exposure should accumulate downstream nodes"
    print(f"    Pillar #2 Passed! Downstream reachable: {blast['reachable_asset_names']}, Total Exposure: ₹{blast['total_downstream_exposure_inr']:,.0f}")


def test_pillar_3_optimizer_and_whatif():
    print("--> Testing Demo Pillar #3 (Optimizer & Knapsack ROSI)...")
    controls = [
        {"id": "c1", "name": "MFA on Admin Accounts", "status": "absent", "cost_inr": 250_000.0, "risk_reduction_inr": 17_500_000.0},
        {"id": "c2", "name": "EDR Antivirus", "status": "absent", "cost_inr": 800_000.0, "risk_reduction_inr": 14_000_000.0},
        {"id": "c3", "name": "Immutable Backups", "status": "absent", "cost_inr": 500_000.0, "risk_reduction_inr": 11_000_000.0},
    ]
    rosi = compute_rosi(controls, budget_inr=1_000_000.0)
    assert len(rosi["selected_controls"]) > 0, "Optimizer should select at least one control"
    assert rosi["total_cost_inr"] <= 1_000_000.0, "Total cost should not exceed budget"
    assert rosi["selected_controls"][0]["control_name"] == "MFA on Admin Accounts", "Highest ROI control should be first"
    print(f"    Pillar #3 Passed! Selected: {[c['control_name'] for c in rosi['selected_controls']]}, Reduction: ₹{rosi['total_risk_reduction_inr']:,.0f}")


def test_compliance():
    print("--> Testing Compliance Engine...")
    controls = [
        {"id": "c1", "name": "Multi-Factor Authentication", "status": "present"},
        {"id": "c2", "name": "Network Segmentation", "status": "present"},
        {"id": "c3", "name": "Privileged Access Management", "status": "absent"},
    ]
    rbi = evaluate_compliance("RBI_CSF", controls)
    assert len(rbi) == 10, "RBI CSF should evaluate 10 clauses"
    satisfied = sum(1 for r in rbi if r["status"] == "satisfied")
    gaps = sum(1 for r in rbi if r["status"] == "gap")
    assert satisfied >= 2, "At least 2 clauses should be satisfied"
    print(f"    Compliance Passed! RBI CSF: {satisfied} satisfied, {gaps} gaps")


@pytest.mark.asyncio
async def test_db_seeding():
    print("--> Testing DB Initialization and Seeding...")
    await init_db()
    async with AsyncSessionLocal() as session:
        org = await seed_demo_org(session)
        await session.commit()
        assert org.name == "Suraksha Finance Ltd", "Seeded org name mismatch"

        # Verify sheets and assets
        sheets_res = await session.execute(select(Sheet).where(Sheet.org_id == org.id, Sheet.type == "base"))
        sheets = sheets_res.scalars().all()
        assert len(sheets) == 4, f"Expected 4 base sheets, found {len(sheets)}"

        assets_res = await session.execute(select(Asset).join(Sheet).where(Sheet.org_id == org.id))
        assets = assets_res.scalars().all()
        assert len(assets) >= 20, f"Expected at least 20 assets for Suraksha Finance, found {len(assets)}"

        scores_res = await session.execute(select(RiskScore).join(Sheet, RiskScore.sheet_id == Sheet.id).where(Sheet.org_id == org.id))
        scores = scores_res.scalars().all()
        assert len(scores) > 0, "Risk scores should be computed for assets/sheets"

        total_eal = sum(s.expected_annual_loss_inr for s in scores if s.sheet_id and not s.asset_id)
        print(f"    DB Seeding Passed! Org: {org.name}, Base Sheets: {len(sheets)}, Org Assets: {len(assets)}, Total EAL: ₹{total_eal:,.0f}")


async def main():
    print("==================================================")
    print("   RUNNING TARAZU BACKEND TEST SUITE")
    print("==================================================")
    test_rules_engine()
    test_pillar_1_msme_vs_enterprise()
    test_pillar_2_blast_radius()
    test_pillar_3_optimizer_and_whatif()
    test_compliance()
    await test_db_seeding()
    print("==================================================")
    print("   ALL TESTS PASSED! BACKEND IS 100% FUNCTIONAL")
    print("==================================================")


if __name__ == "__main__":
    asyncio.run(main())
