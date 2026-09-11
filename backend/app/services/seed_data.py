"""
services/seed_data.py — Demo seed data for "Suraksha Finance Ltd" (fictional Indian NBFC).

Organization: Suraksha Finance Ltd
Sector: BFSI
Size: Mid (1,200 employees, ₹250 Cr revenue)
Sheets: Corporate IT, Core Banking, Cloud Infrastructure, Branch Network
Assets: 32 total across 4 sheets
CVEs: Real CVE IDs with pre-seeded CVSS scores
Controls: 24 org-level controls (mix of present/absent/partial)
Edges: Pre-defined dependency chain (HR Laptop → VPN → Payment Gateway)
"""
from __future__ import annotations
import logging
from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from ..models import (
    Organization, Sheet, Asset, Vulnerability, Control,
    RiskScore, GraphEdge, ComplianceGap, Recommendation
)
from ..services.compliance_engine import evaluate_compliance
from ..services.rules_engine import (
    OrgContext, AssetContext, VulnContext, ControlsContext,
    compute_asset_risk
)

logger = logging.getLogger(__name__)


async def is_already_seeded(db: AsyncSession) -> bool:
    result = await db.execute(
        select(func.count()).where(Organization.name == "Suraksha Finance Ltd")
    )
    count = result.scalar()
    return (count or 0) > 0


# ── Controls Catalog (24 org-wide controls) ──────────────────────────────────
BASELINE_CONTROLS_CATALOG = [
    # Baseline present controls
    {"name": "Security Policy & Governance Framework", "status": "present", "cost_inr": 500_000, "refs": {"ISO27001": "A.5.1.1", "RBI_CSF": "RBI-CSF-1.1"}},
    {"name": "TLS/Data Encryption (in-transit & at-rest)", "status": "present", "cost_inr": 800_000, "refs": {"ISO27001": "A.10.1.1", "RBI_CSF": "RBI-CSF-5.1"}},
    {"name": "Audit Logging & Log Retention", "status": "present", "cost_inr": 300_000, "refs": {"ISO27001": "A.18.1.3"}},
    {"name": "Physical Access Controls (Data Center)", "status": "present", "cost_inr": 1_200_000, "refs": {}},
    {"name": "Annual Security Awareness Training", "status": "present", "cost_inr": 200_000, "refs": {}},
    {"name": "Firewall & Perimeter Defense", "status": "present", "cost_inr": 1_500_000, "refs": {"ISO27001": "A.13.1.1"}},
    # Baseline partial controls
    {"name": "MFA on Admin Accounts", "status": "partial", "cost_inr": 750_000, "refs": {"ISO27001": "A.9.4.2", "RBI_CSF": "RBI-CSF-3.1"}},
    {"name": "Patch Management Program", "status": "partial", "cost_inr": 600_000, "refs": {"ISO27001": "A.12.6.1", "RBI_CSF": "RBI-CSF-4.1"}},
    {"name": "Vulnerability Scanning (Monthly)", "status": "partial", "cost_inr": 400_000, "refs": {"ISO27001": "A.12.6.1", "RBI_CSF": "RBI-CSF-4.1"}},
    {"name": "Network Segmentation & VLAN Isolation", "status": "partial", "cost_inr": 2_000_000, "refs": {"ISO27001": "A.13.1.1", "RBI_CSF": "RBI-CSF-3.2"}},
    {"name": "SIEM & Security Monitoring (Basic)", "status": "partial", "cost_inr": 3_000_000, "refs": {"ISO27001": "A.16.1.4", "RBI_CSF": "RBI-CSF-7.1"}},
    # Baseline absent controls
    {"name": "EDR (Endpoint Detection & Response)", "status": "absent", "cost_inr": 2_500_000, "refs": {"ISO27001": "A.12.2.1"}},
    {"name": "Immutable/Airgapped Backups", "status": "absent", "cost_inr": 1_800_000, "refs": {"ISO27001": "A.12.3.1", "RBI_CSF": "RBI-CSF-8.1"}},
    {"name": "Privileged Access Management (PAM)", "status": "absent", "cost_inr": 3_500_000, "refs": {"ISO27001": "A.9.4.4", "RBI_CSF": "RBI-CSF-2.1"}},
    {"name": "Data Loss Prevention (DLP)", "status": "absent", "cost_inr": 2_200_000, "refs": {"ISO27001": "A.13.2.1", "RBI_CSF": "RBI-CSF-5.2"}},
    {"name": "Web Application Firewall (WAF)", "status": "absent", "cost_inr": 1_200_000, "refs": {"ISO27001": "A.14.2.5"}},
    {"name": "Incident Response Plan (IRP)", "status": "absent", "cost_inr": 800_000, "refs": {"ISO27001": "A.16.1.1", "RBI_CSF": "RBI-CSF-6.1"}},
    {"name": "Zero Trust Network Access (ZTNA)", "status": "absent", "cost_inr": 4_000_000, "refs": {}},
    {"name": "Container/Cloud Security Posture Management", "status": "absent", "cost_inr": 1_500_000, "refs": {}},
    {"name": "Cyber Insurance Policy", "status": "absent", "cost_inr": 3_000_000, "refs": {}},
    {"name": "Secure Code Review & SAST", "status": "absent", "cost_inr": 900_000, "refs": {}},
    {"name": "Third-Party/Vendor Risk Assessment", "status": "absent", "cost_inr": 700_000, "refs": {}},
    {"name": "Red Team / Penetration Testing (Annual)", "status": "absent", "cost_inr": 2_000_000, "refs": {}},
    {"name": "Asset Inventory & CMDB", "status": "absent", "cost_inr": 1_000_000, "refs": {"ISO27001": "A.8.1.1"}},
]


async def seed_baseline_controls_for_org(
    db: AsyncSession, org_id: str, default_status: str | None = None
) -> list[Control]:
    """Seed baseline security controls for an organization so ROSI and compliance work immediately."""
    controls: list[Control] = []
    for cd in BASELINE_CONTROLS_CATALOG:
        ctrl = Control(
            org_id=org_id,
            name=cd["name"],
            status=default_status if default_status is not None else cd["status"],
            cost_inr=cd["cost_inr"],
            framework_clause_refs=cd.get("refs"),
        )
        db.add(ctrl)
        controls.append(ctrl)
    await db.flush()
    return controls


async def seed_demo_org(db: AsyncSession) -> Organization:
    """Seed Suraksha Finance Ltd with all associated data."""
    if await is_already_seeded(db):
        logger.info("Demo org already seeded — skipping")
        result = await db.execute(select(Organization).where(Organization.name == "Suraksha Finance Ltd"))
        return result.scalar_one()

    logger.info("Seeding demo organization: Suraksha Finance Ltd...")

    # ── Organization ──────────────────────────────────────────────────────────
    org = Organization(
        name="Suraksha Finance Ltd",
        sector="BFSI",
        size_tier="Mid",
        employee_count=1200,
        annual_revenue_inr=250_000_000,  # ₹25 Cr
    )
    db.add(org)
    await db.flush()

    # ── Controls ─────────────────────────────────────────────────────────────
    controls = await seed_baseline_controls_for_org(db, org.id)
    # Build control lookup by name for edge creation
    ctrl_by_name = {c.name: c for c in controls}

    # ── Sheets ────────────────────────────────────────────────────────────────
    sheets_data = [
        {"name": "Corporate IT", "is_org_wide_included": True},
        {"name": "Payment Systems", "is_org_wide_included": True},
        {"name": "Cloud Infra", "is_org_wide_included": True},
        {"name": "Branch Network", "is_org_wide_included": True},
    ]
    sheets: list[Sheet] = []
    for sd in sheets_data:
        sheet = Sheet(
            org_id=org.id,
            name=sd["name"],
            type="base",
            is_org_wide_included=sd["is_org_wide_included"],
        )
        db.add(sheet)
        sheets.append(sheet)
    await db.flush()

    corp_it, payment_systems, cloud_infra, branch = sheets

    # ── Assets (32 total) with vulnerabilities ────────────────────────────────

    # Sheet 1: Corporate IT (8 assets)
    corp_assets_data = [
        {
            "name": "HR Manager Laptop",
            "asset_type": "Workstation",
            "criticality_tag": "admin_workstation",
            "rev_dep": 3.0,
            "meta": {"software": "Windows 11 22H2", "version": "22H2", "location": "on_prem"},
            "vulns": [
                {"cve_id": "CVE-2024-21412", "cvss": 8.1, "desc": "Windows SmartScreen bypass vulnerability allowing arbitrary code execution.", "days": 85, "src": "cve_match"},
            ],
        },
        {
            "name": "IT Admin Workstation",
            "asset_type": "Workstation",
            "criticality_tag": "admin_workstation",
            "rev_dep": 5.0,
            "meta": {"software": "Ubuntu", "version": "22.04", "location": "on_prem"},
            "vulns": [
                {"cve_id": "CVE-2023-4911", "cvss": 7.8, "desc": "GNU C Library (glibc) buffer overflow in Dynamic Linker (Looney Tunables).", "days": 120, "src": "cve_match"},
            ],
        },
        {
            "name": "Corporate Email Server",
            "asset_type": "Server",
            "criticality_tag": "standard",
            "rev_dep": 8.0,
            "meta": {"software": "Microsoft Exchange", "version": "2019 CU14", "vendor_integrated": True},
            "vulns": [
                {"cve_id": "CVE-2024-21410", "cvss": 9.8, "desc": "Microsoft Exchange Server Elevation of Privilege — NTLM relay attack enables remote code execution.", "days": 55, "src": "cve_match"},
                {"cve_id": "CVE-2023-23397", "cvss": 9.8, "desc": "Microsoft Outlook NTLM credential theft via calendar invite.", "days": 210, "src": "cve_match"},
            ],
        },
        {
            "name": "Corporate VPN Gateway",
            "asset_type": "Network Device",
            "criticality_tag": "standard",
            "rev_dep": 10.0,
            "meta": {"software": "FortiGate SSL-VPN", "version": "7.2.4", "location": "on_prem"},
            "vulns": [
                {"cve_id": "CVE-2024-21762", "cvss": 9.6, "desc": "FortiOS SSL VPN out-of-bounds write — unauthenticated RCE actively exploited in wild.", "days": 40, "src": "cve_match"},
            ],
        },
        {
            "name": "Active Directory Domain Controller",
            "asset_type": "Server",
            "criticality_tag": "admin_workstation",
            "rev_dep": 15.0,
            "meta": {"software": "Windows Server", "version": "2019", "location": "on_prem"},
            "vulns": [
                {"cve_id": "CVE-2024-30078", "cvss": 8.8, "desc": "Windows Wi-Fi Driver Remote Code Execution Vulnerability.", "days": 70, "src": "cve_match"},
            ],
        },
        {
            "name": "Intranet Web Portal",
            "asset_type": "Web App",
            "criticality_tag": "standard",
            "rev_dep": 4.0,
            "meta": {"software": "Apache Tomcat", "version": "10.1.8"},
            "vulns": [
                {"cve_id": "CVE-2024-21733", "cvss": 5.3, "desc": "Apache Tomcat partial HTTP response exposure.", "days": 30, "src": "cve_match"},
            ],
        },
        {
            "name": "File Server (NAS)",
            "asset_type": "Server",
            "criticality_tag": "backup_system",
            "rev_dep": 6.0,
            "meta": {"software": "Synology DSM", "version": "7.1"},
            "vulns": [
                {"cve_id": "CVE-2023-2729", "cvss": 5.9, "desc": "Synology DiskStation Manager insufficient randomness vulnerability.", "days": 150, "src": "cve_match"},
            ],
        },
        {
            "name": "CCTV & Physical Security Server",
            "asset_type": "Server",
            "criticality_tag": "standard",
            "rev_dep": 1.0,
            "meta": {"software": "Hikvision DVR", "version": "2.3.4"},
            "vulns": [],
        },
    ]

    # Sheet 2: Core Banking Systems (9 assets)
    core_banking_data = [
        {
            "name": "Core Banking Application Server",
            "asset_type": "Server",
            "criticality_tag": "payment_processing",
            "rev_dep": 45.0,
            "meta": {"software": "Finacle", "version": "11.x", "location": "on_prem", "downstream_dependency_count": 5},
            "vulns": [
                {"cve_id": "CVE-2021-44228", "cvss": 10.0, "desc": "Log4Shell — Apache Log4j2 JNDI remote code execution. Actively exploited globally.", "days": 180, "src": "cve_match"},
            ],
        },
        {
            "name": "Payment Gateway (NPCI Integration)",
            "asset_type": "Web App",
            "criticality_tag": "payment_processing",
            "rev_dep": 35.0,
            "meta": {"software": "Custom Java App", "version": "8.2", "vendor_integrated": True, "downstream_dependency_count": 3},
            "vulns": [
                {"cve_id": "CVE-2022-22965", "cvss": 9.8, "desc": "Spring4Shell — Spring Framework RCE via data binding with JDK 9+.", "days": 240, "src": "cve_match"},
            ],
        },
        {
            "name": "Customer Loan Management DB",
            "asset_type": "Database",
            "criticality_tag": "core_db",
            "rev_dep": 30.0,
            "meta": {"software": "Oracle DB", "version": "19c", "location": "on_prem"},
            "vulns": [
                {"cve_id": "CVE-2024-20953", "cvss": 8.8, "desc": "Oracle Agile PLM Remote Code Execution via deserialization.", "days": 60, "src": "cve_match"},
            ],
        },
        {
            "name": "Credit Risk Analytics Platform",
            "asset_type": "Server",
            "criticality_tag": "core_db",
            "rev_dep": 15.0,
            "meta": {"software": "Python 3.9 / FastAPI", "version": "0.95.0"},
            "vulns": [],
        },
        {
            "name": "Customer Self-Service Portal",
            "asset_type": "Web App",
            "criticality_tag": "customer_portal",
            "rev_dep": 20.0,
            "meta": {"software": "React + Node.js", "version": "18.2"},
            "vulns": [
                {"cve_id": "CVE-2023-46809", "cvss": 7.4, "desc": "Node.js timing attack vulnerability in TLS session resumption.", "days": 90, "src": "cve_match"},
            ],
        },
        {
            "name": "SWIFT/UPI Transaction Switch",
            "asset_type": "Server",
            "criticality_tag": "payment_processing",
            "rev_dep": 40.0,
            "meta": {"software": "IBM MQ", "version": "9.3.2", "vendor_integrated": True},
            "vulns": [
                {"cve_id": "CVE-2023-28514", "cvss": 5.5, "desc": "IBM MQ local privilege escalation via shared memory.", "days": 45, "src": "cve_match"},
            ],
        },
        {
            "name": "Audit & Compliance Reporting DB",
            "asset_type": "Database",
            "criticality_tag": "core_db",
            "rev_dep": 10.0,
            "meta": {"software": "PostgreSQL", "version": "14.5"},
            "vulns": [],
        },
        {
            "name": "ATM Network Controller",
            "asset_type": "Server",
            "criticality_tag": "payment_processing",
            "rev_dep": 25.0,
            "meta": {"software": "Windows Embedded", "version": "7 POSReady", "location": "on_prem"},
            "vulns": [
                {"cve_id": "CVE-2019-0708", "cvss": 9.8, "desc": "BlueKeep — Windows RDP pre-auth RCE. Wormable. Still unpatched on legacy ATM infra.", "days": 365, "src": "cve_match"},
            ],
        },
        {
            "name": "KYC Document Storage System",
            "asset_type": "Database",
            "criticality_tag": "core_db",
            "rev_dep": 12.0,
            "meta": {"software": "MinIO", "version": "2023.09"},
            "vulns": [
                {"cve_id": "CVE-2023-28432", "cvss": 7.5, "desc": "MinIO information disclosure via /minio/health/cluster endpoint leaking credentials.", "days": 75, "src": "cve_match"},
            ],
        },
    ]

    # Sheet 3: Cloud Infrastructure (8 assets)
    cloud_infra_data = [
        {
            "name": "AWS Production VPC",
            "asset_type": "Cloud Service",
            "criticality_tag": "standard",
            "rev_dep": 18.0,
            "meta": {"cloud": "AWS", "region": "ap-south-1", "multi_tenant": False},
            "vulns": [],
        },
        {
            "name": "Kubernetes Cluster (EKS)",
            "asset_type": "Cloud Service",
            "criticality_tag": "standard",
            "rev_dep": 20.0,
            "meta": {"software": "Kubernetes", "version": "1.28.0", "cloud": "AWS"},
            "vulns": [
                {"cve_id": "CVE-2023-5528", "cvss": 7.2, "desc": "Kubernetes Windows node privilege escalation via volume mounts.", "days": 60, "src": "cve_match"},
            ],
        },
        {
            "name": "Cloud API Gateway (Kong)",
            "asset_type": "Web App",
            "criticality_tag": "customer_portal",
            "rev_dep": 15.0,
            "meta": {"software": "Kong Gateway", "version": "3.3.0", "cloud": "AWS"},
            "vulns": [],
        },
        {
            "name": "Data Lake (S3 + Athena)",
            "asset_type": "Cloud Service",
            "criticality_tag": "core_db",
            "rev_dep": 12.0,
            "meta": {"cloud": "AWS", "data_sensitivity": "PII+Financial"},
            "vulns": [],
        },
        {
            "name": "Redis Cache Cluster",
            "asset_type": "Database",
            "criticality_tag": "standard",
            "rev_dep": 8.0,
            "meta": {"software": "Redis", "version": "7.0.12"},
            "vulns": [
                {"cve_id": "CVE-2023-41056", "cvss": 8.1, "desc": "Redis heap overflow in SINTERCARD command leading to remote code execution.", "days": 55, "src": "cve_match"},
            ],
        },
        {
            "name": "CI/CD Pipeline (Jenkins)",
            "asset_type": "Server",
            "criticality_tag": "admin_workstation",
            "rev_dep": 5.0,
            "meta": {"software": "Jenkins", "version": "2.414.2"},
            "vulns": [
                {"cve_id": "CVE-2024-23897", "cvss": 9.8, "desc": "Jenkins arbitrary file read vulnerability leading to RCE — actively exploited.", "days": 45, "src": "cve_match"},
            ],
        },
        {
            "name": "WAF / CDN (Cloudflare)",
            "asset_type": "Cloud Service",
            "criticality_tag": "standard",
            "rev_dep": 5.0,
            "meta": {"cloud": "Cloudflare", "managed": True},
            "vulns": [],
        },
        {
            "name": "Secrets Manager (HashiCorp Vault)",
            "asset_type": "Server",
            "criticality_tag": "admin_workstation",
            "rev_dep": 10.0,
            "meta": {"software": "HashiCorp Vault", "version": "1.13.3"},
            "vulns": [
                {"cve_id": "CVE-2023-3774", "cvss": 6.5, "desc": "HashiCorp Vault MFA login bypass using older auth method.", "days": 100, "src": "cve_match"},
            ],
        },
    ]

    # Sheet 4: Branch Network (7 assets)
    branch_data = [
        {
            "name": "Branch Manager Workstation (Mumbai)",
            "asset_type": "Workstation",
            "criticality_tag": "standard",
            "rev_dep": 2.0,
            "meta": {"software": "Windows 10", "version": "21H2", "location": "branch"},
            "vulns": [
                {"cve_id": "CVE-2024-26169", "cvss": 7.8, "desc": "Windows Error Reporting Service elevation of privilege.", "days": 30, "src": "cve_match"},
            ],
        },
        {
            "name": "Branch Teller Terminals (x12)",
            "asset_type": "Workstation",
            "criticality_tag": "payment_processing",
            "rev_dep": 8.0,
            "meta": {"software": "Windows 10 LTSC", "version": "2019", "location": "branch"},
            "vulns": [],
        },
        {
            "name": "Branch Local Server (File + Print)",
            "asset_type": "Server",
            "criticality_tag": "standard",
            "rev_dep": 3.0,
            "meta": {"software": "Windows Server", "version": "2012 R2", "location": "branch"},
            "vulns": [
                {"cve_id": "CVE-2023-35311", "cvss": 8.8, "desc": "Microsoft Outlook Security Feature Bypass for security warnings.", "days": 130, "src": "cve_match"},
                {"cve_id": "CVE-2017-0144", "cvss": 9.3, "desc": "EternalBlue — SMB RCE. WannaCry predecessor. Unpatched on end-of-life Server 2012.", "days": 730, "src": "cve_match"},
            ],
        },
        {
            "name": "Branch Network Switch (Cisco)",
            "asset_type": "Network Device",
            "criticality_tag": "standard",
            "rev_dep": 5.0,
            "meta": {"software": "Cisco IOS", "version": "15.2(7)E6"},
            "vulns": [
                {"cve_id": "CVE-2023-20198", "cvss": 10.0, "desc": "Cisco IOS XE Web UI privilege escalation — CVSS 10.0, actively exploited to implant backdoors.", "days": 95, "src": "cve_match"},
            ],
        },
        {
            "name": "Branch ATM (Diebold)",
            "asset_type": "Workstation",
            "criticality_tag": "payment_processing",
            "rev_dep": 10.0,
            "meta": {"software": "Windows XP Embedded", "version": "SP3", "location": "branch"},
            "vulns": [
                {"cve_id": "CVE-2019-0708", "cvss": 9.8, "desc": "BlueKeep — Windows RDP pre-auth RCE on EOL ATM OS.", "days": 400, "src": "cve_match"},
            ],
        },
        {
            "name": "CIBIL/Credit Bureau Integration Gateway",
            "asset_type": "Server",
            "criticality_tag": "core_db",
            "rev_dep": 8.0,
            "meta": {"software": "Apache Camel", "version": "3.14.0", "vendor_integrated": True},
            "vulns": [
                {"cve_id": "CVE-2023-34442", "cvss": 5.4, "desc": "Apache Camel server-side template injection.", "days": 65, "src": "cve_match"},
            ],
        },
        {
            "name": "UPS & Environmental Monitoring",
            "asset_type": "Network Device",
            "criticality_tag": "standard",
            "rev_dep": 1.0,
            "meta": {"software": "APC NMC", "version": "6.9.8"},
            "vulns": [],
        },
    ]

    # Create all assets and vulnerabilities
    all_sheet_assets: dict[str, list[Asset]] = {}

    for sheet, assets_data in [
        (corp_it, corp_assets_data),
        (payment_systems, core_banking_data),
        (cloud_infra, cloud_infra_data),
        (branch, branch_data),
    ]:
        sheet_assets: list[Asset] = []
        for ad in assets_data:
            asset = Asset(
                sheet_id=sheet.id,
                name=ad["name"],
                asset_type=ad["asset_type"],
                criticality_tag=ad["criticality_tag"],
                revenue_dependency_pct=ad["rev_dep"],
                metadata_json=ad.get("meta"),
            )
            db.add(asset)
            await db.flush()

            for vd in ad.get("vulns", []):
                vuln = Vulnerability(
                    asset_id=asset.id,
                    cve_id=vd.get("cve_id"),
                    cvss_score=vd.get("cvss"),
                    description=vd.get("desc", ""),
                    days_unpatched=vd.get("days", 0),
                    source=vd.get("src", "manual"),
                )
                db.add(vuln)

            sheet_assets.append(asset)
        all_sheet_assets[sheet.id] = sheet_assets
        await db.flush()

    # ── Graph Edges (Dependency Chains) ───────────────────────────────────────
    # Build asset name → ID lookup
    asset_name_to_id: dict[str, str] = {}
    for assets in all_sheet_assets.values():
        for asset in assets:
            asset_name_to_id[asset.name] = asset.id

    # Corporate IT → Core Banking connections (Demo Pillar #2 chain)
    # HR Laptop → VPN Gateway → Payment Gateway (cross-sheet)
    corp_edges = [
        # Within Corporate IT
        ("HR Manager Laptop", "Corporate VPN Gateway", "moderate"),
        ("IT Admin Workstation", "Corporate VPN Gateway", "strong"),
        ("IT Admin Workstation", "Active Directory Domain Controller", "strong"),
        ("Corporate VPN Gateway", "Active Directory Domain Controller", "strong"),
        ("Active Directory Domain Controller", "Corporate Email Server", "moderate"),
    ]

    core_banking_edges = [
        # Within Core Banking
        ("Core Banking Application Server", "Payment Gateway (NPCI Integration)", "strong"),
        ("Core Banking Application Server", "Customer Loan Management DB", "strong"),
        ("Payment Gateway (NPCI Integration)", "SWIFT/UPI Transaction Switch", "strong"),
        ("Customer Self-Service Portal", "Core Banking Application Server", "moderate"),
        ("Credit Risk Analytics Platform", "Customer Loan Management DB", "moderate"),
    ]

    cloud_edges = [
        # Within Cloud Infra
        ("CI/CD Pipeline (Jenkins)", "Kubernetes Cluster (EKS)", "strong"),
        ("Kubernetes Cluster (EKS)", "Cloud API Gateway (Kong)", "strong"),
        ("Cloud API Gateway (Kong)", "Redis Cache Cluster", "moderate"),
        ("Secrets Manager (HashiCorp Vault)", "Kubernetes Cluster (EKS)", "strong"),
    ]

    branch_edges = [
        # Within Branch
        ("Branch Manager Workstation (Mumbai)", "Branch Local Server (File + Print)", "weak"),
        ("Branch Teller Terminals (x12)", "Branch ATM (Diebold)", "moderate"),
        ("Branch Network Switch (Cisco)", "Branch Teller Terminals (x12)", "strong"),
    ]

    # Cross-sheet edges (Corporate IT → Core Banking — key for blast radius demo)
    cross_edges = [
        (corp_it.id, "Corporate VPN Gateway", "Core Banking Application Server", "strong"),
        (corp_it.id, "Corporate VPN Gateway", "Customer Self-Service Portal", "moderate"),
        (corp_it.id, "Active Directory Domain Controller", "Core Banking Application Server", "strong"),
        (corp_it.id, "IT Admin Workstation", "CI/CD Pipeline (Jenkins)", "moderate"),  # corp → cloud
        (cloud_infra.id, "Cloud API Gateway (Kong)", "Customer Self-Service Portal", "moderate"),  # cloud → banking
        (cloud_infra.id, "Data Lake (S3 + Athena)", "Customer Loan Management DB", "weak"),
        (branch.id, "Branch Teller Terminals (x12)", "Core Banking Application Server", "moderate"),  # branch → banking
    ]

    # Add within-sheet edges
    for edge_list, sheet_obj in [
        (corp_edges, corp_it),
        (core_banking_edges, payment_systems),
        (cloud_edges, cloud_infra),
        (branch_edges, branch),
    ]:
        for src_name, tgt_name, strength in edge_list:
            src_id = asset_name_to_id.get(src_name)
            tgt_id = asset_name_to_id.get(tgt_name)
            if src_id and tgt_id:
                edge = GraphEdge(
                    sheet_id=sheet_obj.id,
                    source_asset_id=src_id,
                    target_asset_id=tgt_id,
                    dependency_strength=strength,
                )
                db.add(edge)

    # Add cross-sheet edges (use the target asset's sheet as the canonical sheet)
    for sheet_obj_id, src_name, tgt_name, strength in cross_edges:
        src_id = asset_name_to_id.get(src_name)
        tgt_id = asset_name_to_id.get(tgt_name)
        if src_id and tgt_id:
            edge = GraphEdge(
                sheet_id=sheet_obj_id,
                source_asset_id=src_id,
                target_asset_id=tgt_id,
                dependency_strength=strength,
            )
    # ── Compute Initial RiskScores for All Assets and Sheets ──────────────────
    controls_data_dicts = [
        {"id": c.id, "name": c.name, "status": c.status, "framework_clause_refs": c.framework_clause_refs}
        for c in controls
    ]
    controls_ctx = ControlsContext.from_control_list(controls_data_dicts)
    org_ctx = OrgContext(
        sector=org.sector,
        size_tier=org.size_tier,
        employee_count=org.employee_count,
        annual_revenue_inr=org.annual_revenue_inr,
    )

    for sheet_obj in sheets:
        sheet_assets_list = all_sheet_assets.get(sheet_obj.id, [])
        sheet_total_eal = 0.0
        sheet_traces = []

        for a in sheet_assets_list:
            vulns_res = await db.execute(select(Vulnerability).where(Vulnerability.asset_id == a.id))
            vulns = vulns_res.scalars().all()
            vuln_ctxs = [
                VulnContext(
                    cvss_score=v.cvss_score,
                    days_unpatched=v.days_unpatched,
                    cve_id=v.cve_id,
                    description=v.description,
                )
                for v in vulns
            ]
            asset_ctx = AssetContext(
                name=a.name,
                asset_type=a.asset_type,
                criticality_tag=a.criticality_tag,
                revenue_dependency_pct=a.revenue_dependency_pct,
            )
            out = compute_asset_risk(org_ctx, asset_ctx, vuln_ctxs, controls_ctx)
            asset_score = RiskScore(
                asset_id=a.id,
                sheet_id=sheet_obj.id,
                expected_annual_loss_inr=out.expected_annual_loss_inr,
                rule_trace=out.as_dict_trace(),
                ai_mode="rules_only",
            )
            db.add(asset_score)
            sheet_total_eal += out.expected_annual_loss_inr
            sheet_traces.extend(out.as_dict_trace())

        # Add sheet rollup RiskScore
        sheet_score = RiskScore(
            sheet_id=sheet_obj.id,
            asset_id=None,
            expected_annual_loss_inr=round(sheet_total_eal, 2),
            rule_trace=sheet_traces[:15],
            ai_mode="rules_only",
        )
        db.add(sheet_score)

    # ── Seed Compliance Gaps for all 8 frameworks ────────────────────────────
    for fw in ["ISO27001", "NIST_CSF", "CIS_CONTROLS", "RBI_CSF", "SEBI_CSCRF", "HIPAA", "PCI_DSS", "GDPR_DPDPA"]:
        results = evaluate_compliance(fw, controls_data_dicts)
        for r in results:
            ctrl_obj = ctrl_by_name.get(r.get("control_name") or "")
            gap = ComplianceGap(
                org_id=org.id,
                framework=fw,
                clause_ref=r["clause_ref"],
                clause_title=r["clause_title"],
                status=r["status"],
                linked_control_id=ctrl_obj.id if ctrl_obj else None,
            )
            db.add(gap)

    # ── Seed Recommendations for ROI Knapsack ───────────────────────────────
    from ..services.optimizer import estimate_control_risk_reduction
    for c in controls:
        if c.status != "present":
            red = estimate_control_risk_reduction(c.name, org.annual_revenue_inr, 25_000_000.0)
            cost = max(c.cost_inr, 1.0)
            roi = red / cost
            rec = Recommendation(
                org_id=org.id,
                control_id=c.id,
                risk_reduction_inr=round(red, 2),
                cost_inr=c.cost_inr,
                roi_ratio=round(roi, 2),
                ai_rationale=f"Deploying {c.name} reduces annualized loss expectancy by ₹{red:,.0f} with a {roi:.1f}x ROI.",
            )
            db.add(rec)

    await db.flush()

    logger.info(
        "Seeded Suraksha Finance Ltd: org=%s, sheets=%d, assets=%d, controls=%d",
        org.id, len(sheets), sum(len(v) for v in all_sheet_assets.values()), len(controls)
    )

    return org


async def clear_and_reseed_demo_org(db: AsyncSession) -> Organization:
    """Force clear existing Suraksha Finance Ltd records and re-seed from scratch."""
    from sqlalchemy import delete
    existing_res = await db.execute(select(Organization).where(Organization.name == "Suraksha Finance Ltd"))
    existing_orgs = existing_res.scalars().all()
    for existing in existing_orgs:
        await db.delete(existing)
    await db.commit()
    return await seed_demo_org(db)



# ---- Healthcare Controls Catalog (HIPAA-focused) ----------------------------
HEALTHCARE_CONTROLS_CATALOG = [
    {"name": "Patient Data Encryption (PHI at Rest and Transit)", "status": "present", "cost_inr": 900_000,
     "refs": {"HIPAA": "S164.312.a.2.iv", "ISO27001": "A.10.1.1"}},
    {"name": "Physical Security - Server Rooms and Medical Devices", "status": "present", "cost_inr": 1_200_000,
     "refs": {"HIPAA": "S164.310.a.1"}},
    {"name": "Staff Security and HIPAA Awareness Training", "status": "present", "cost_inr": 250_000,
     "refs": {"HIPAA": "S164.308.a.5"}},
    {"name": "Firewall and Perimeter Defense", "status": "present", "cost_inr": 1_500_000,
     "refs": {"ISO27001": "A.13.1.1"}},
    {"name": "Audit Logging and Access Records (PHI Access)", "status": "present", "cost_inr": 400_000,
     "refs": {"HIPAA": "S164.312.b", "ISO27001": "A.18.1.3"}},
    {"name": "User Identity and Role-Based Access Control", "status": "present", "cost_inr": 600_000,
     "refs": {"HIPAA": "S164.312.a.1"}},
    {"name": "MFA on Clinical and Admin Systems", "status": "partial", "cost_inr": 750_000,
     "refs": {"HIPAA": "S164.312.d", "ISO27001": "A.9.4.2"}},
    {"name": "Patch Management (Medical Systems)", "status": "partial", "cost_inr": 700_000,
     "refs": {"ISO27001": "A.12.6.1"}},
    {"name": "Network Segmentation (Clinical vs Admin)", "status": "partial", "cost_inr": 2_000_000,
     "refs": {"HIPAA": "S164.312.a.1", "ISO27001": "A.13.1.1"}},
    {"name": "Backup and Disaster Recovery (EHR Systems)", "status": "partial", "cost_inr": 1_800_000,
     "refs": {"HIPAA": "S164.308.a.7", "ISO27001": "A.12.3.1"}},
    {"name": "Security Monitoring (SIEM Basic)", "status": "partial", "cost_inr": 2_500_000,
     "refs": {"HIPAA": "S164.308.a.1.ii.D"}},
    {"name": "Endpoint Detection and Response (EDR) on Workstations", "status": "absent", "cost_inr": 2_500_000,
     "refs": {"ISO27001": "A.12.2.1"}},
    {"name": "Medical Device Security Management", "status": "absent", "cost_inr": 3_000_000,
     "refs": {"HIPAA": "S164.308.a.1"}},
    {"name": "Ransomware Protection and Immutable Backups", "status": "absent", "cost_inr": 2_200_000,
     "refs": {"HIPAA": "S164.308.a.7.ii.A", "ISO27001": "A.12.3.1"}},
    {"name": "Data Loss Prevention (DLP) for PHI", "status": "absent", "cost_inr": 2_000_000,
     "refs": {"HIPAA": "S164.312.a.1", "GDPR_DPDPA": "Art.32"}},
    {"name": "Incident Response Plan (Healthcare-Specific)", "status": "absent", "cost_inr": 900_000,
     "refs": {"HIPAA": "S164.308.a.6", "ISO27001": "A.16.1.1"}},
    {"name": "Privileged Access Management (PAM)", "status": "absent", "cost_inr": 3_500_000,
     "refs": {"HIPAA": "S164.312.a.2.i", "ISO27001": "A.9.4.4"}},
    {"name": "Web Application Firewall (Patient Portal)", "status": "absent", "cost_inr": 1_200_000,
     "refs": {"ISO27001": "A.14.2.5"}},
    {"name": "Vulnerability Scanning and Penetration Testing", "status": "absent", "cost_inr": 2_000_000,
     "refs": {"HIPAA": "S164.308.a.8"}},
    {"name": "Business Associate Agreement Management", "status": "absent", "cost_inr": 500_000,
     "refs": {"HIPAA": "S164.308.b.1"}},
    {"name": "Zero Trust Network Access (ZTNA)", "status": "absent", "cost_inr": 4_000_000, "refs": {}},
    {"name": "Cyber Insurance Policy (Healthcare)", "status": "absent", "cost_inr": 2_500_000, "refs": {}},
    {"name": "Asset Inventory and CMDB (Medical Devices)", "status": "absent", "cost_inr": 1_000_000,
     "refs": {"ISO27001": "A.8.1.1"}},
    {"name": "Patient Data Breach Notification Procedures", "status": "absent", "cost_inr": 600_000,
     "refs": {"GDPR_DPDPA": "Art.33"}},
]


async def is_already_seeded_healthcare(db: AsyncSession) -> bool:
    result = await db.execute(select(func.count()).where(Organization.name == "Aarogya Hospitals Ltd"))
    return (result.scalar() or 0) > 0


async def seed_healthcare_org(db: AsyncSession) -> Organization:
    """Seed Aarogya Hospitals Ltd - fictional Indian hospital chain for HIPAA/DPDPA demo."""
    if await is_already_seeded_healthcare(db):
        logger.info("Healthcare org already seeded - skipping")
        result = await db.execute(select(Organization).where(Organization.name == "Aarogya Hospitals Ltd"))
        return result.scalar_one()

    logger.info("Seeding demo organization: Aarogya Hospitals Ltd...")
    org = Organization(
        name="Aarogya Hospitals Ltd", sector="Healthcare", size_tier="Mid",
        employee_count=800, annual_revenue_inr=120_000_000,
    )
    db.add(org)
    await db.flush()

    controls: list = []
    for cd in HEALTHCARE_CONTROLS_CATALOG:
        ctrl = Control(org_id=org.id, name=cd["name"], status=cd["status"],
                       cost_inr=cd["cost_inr"], framework_clause_refs=cd.get("refs"))
        db.add(ctrl)
        controls.append(ctrl)
    await db.flush()
    ctrl_by_name = {c.name: c for c in controls}

    sheet_names = ["Clinical IT Systems", "Patient Data and Records", "Admin and HR Systems", "Medical Devices"]
    sheets: list = []
    for sn in sheet_names:
        s = Sheet(org_id=org.id, name=sn, type="base", is_org_wide_included=True)
        db.add(s)
        sheets.append(s)
    await db.flush()
    clinical_it, patient_data_sheet, admin_hr, med_devices = sheets

    all_assets_data = {
        clinical_it.id: [
            {"name": "Electronic Health Records (EHR) Server", "asset_type": "Server", "criticality_tag": "core_db", "rev_dep": 40.0,
             "meta": {"software": "Epic EHR"},
             "vulns": [{"cve_id": "CVE-2021-44228", "cvss": 10.0, "desc": "Log4Shell on EHR server - exploited against hospitals globally.", "days": 200}]},
            {"name": "Radiology PACS Server", "asset_type": "Server", "criticality_tag": "core_db", "rev_dep": 25.0,
             "meta": {"software": "Carestream PACS"},
             "vulns": [{"cve_id": "CVE-2022-22965", "cvss": 9.8, "desc": "Spring4Shell RCE on PACS.", "days": 150}]},
            {"name": "Hospital Information System (HIS)", "asset_type": "Web App", "criticality_tag": "payment_processing", "rev_dep": 30.0,
             "meta": {"software": "Insta HMS"},
             "vulns": [{"cve_id": "CVE-2023-46809", "cvss": 7.4, "desc": "Node.js timing attack on HIS web layer.", "days": 90}]},
            {"name": "Lab Management System (LIS)", "asset_type": "Server", "criticality_tag": "core_db", "rev_dep": 15.0,
             "meta": {"software": "Cerner LIS"}, "vulns": []},
            {"name": "Nursing Station Workstations (x20)", "asset_type": "Workstation", "criticality_tag": "admin_workstation", "rev_dep": 10.0,
             "meta": {"software": "Windows 10"},
             "vulns": [{"cve_id": "CVE-2024-21412", "cvss": 8.1, "desc": "Windows SmartScreen bypass on nursing stations.", "days": 75}]},
            {"name": "Doctor Workstations (x15)", "asset_type": "Workstation", "criticality_tag": "admin_workstation", "rev_dep": 8.0,
             "meta": {"software": "Windows 11"}, "vulns": []},
            {"name": "Hospital VPN Gateway", "asset_type": "Network Device", "criticality_tag": "standard", "rev_dep": 10.0,
             "meta": {"software": "Cisco AnyConnect"},
             "vulns": [{"cve_id": "CVE-2024-21762", "cvss": 9.6, "desc": "FortiOS SSL VPN unauthenticated RCE on hospital gateway.", "days": 45}]},
        ],
        patient_data_sheet.id: [
            {"name": "Patient Database (PHI Store)", "asset_type": "Database", "criticality_tag": "core_db", "rev_dep": 35.0,
             "meta": {"software": "Oracle DB", "data_sensitivity": "PHI"},
             "vulns": [{"cve_id": "CVE-2024-20953", "cvss": 8.8, "desc": "Oracle DB deserialization RCE - exposes patient health records.", "days": 60}]},
            {"name": "Patient Portal (Web App)", "asset_type": "Web App", "criticality_tag": "customer_portal", "rev_dep": 20.0,
             "meta": {"software": "React+Node.js"}, "vulns": []},
            {"name": "Billing and Insurance System", "asset_type": "Web App", "criticality_tag": "payment_processing", "rev_dep": 25.0,
             "meta": {"software": "Meditech Billing"},
             "vulns": [{"cve_id": "CVE-2023-34442", "cvss": 5.4, "desc": "Template injection in billing interface.", "days": 100}]},
            {"name": "Document Management System", "asset_type": "Server", "criticality_tag": "core_db", "rev_dep": 10.0,
             "meta": {"software": "OpenText Content"},
             "vulns": [{"cve_id": "CVE-2023-2729", "cvss": 5.9, "desc": "Insufficient randomness exposes document tokens.", "days": 120}]},
            {"name": "Backup Server (Patient Records)", "asset_type": "Server", "criticality_tag": "backup_system", "rev_dep": 15.0,
             "meta": {"software": "Veeam Backup"}, "vulns": []},
            {"name": "Pathology Report Storage", "asset_type": "Database", "criticality_tag": "core_db", "rev_dep": 8.0,
             "meta": {"software": "MinIO"},
             "vulns": [{"cve_id": "CVE-2023-28432", "cvss": 7.5, "desc": "MinIO credential exposure - leaks admin keys.", "days": 80}]},
        ],
        admin_hr.id: [
            {"name": "HR Management System", "asset_type": "Web App", "criticality_tag": "standard", "rev_dep": 5.0,
             "meta": {"software": "Darwinbox HRMS"}, "vulns": []},
            {"name": "Corporate Email Server", "asset_type": "Server", "criticality_tag": "standard", "rev_dep": 8.0,
             "meta": {"software": "Microsoft Exchange"},
             "vulns": [{"cve_id": "CVE-2024-21410", "cvss": 9.8, "desc": "Exchange NTLM relay attack.", "days": 55}]},
            {"name": "Payroll Processing System", "asset_type": "Web App", "criticality_tag": "payment_processing", "rev_dep": 10.0,
             "meta": {"software": "Keka Payroll"}, "vulns": []},
            {"name": "Admin Network Switch (Cisco)", "asset_type": "Network Device", "criticality_tag": "standard", "rev_dep": 4.0,
             "meta": {"software": "Cisco IOS"},
             "vulns": [{"cve_id": "CVE-2023-20198", "cvss": 10.0, "desc": "Cisco IOS XE Web UI privilege escalation - CVSS 10.0.", "days": 95}]},
            {"name": "Admin File Server", "asset_type": "Server", "criticality_tag": "standard", "rev_dep": 3.0,
             "meta": {"software": "Windows Server"}, "vulns": []},
        ],
        med_devices.id: [
            {"name": "ICU Patient Monitoring System", "asset_type": "Workstation", "criticality_tag": "payment_processing", "rev_dep": 20.0,
             "meta": {"software": "Philips IntelliVue"},
             "vulns": [{"cve_id": "CVE-2019-0708", "cvss": 9.8, "desc": "BlueKeep on ICU monitor running Windows XP Embedded - RCE on life-critical device.", "days": 400}]},
            {"name": "MRI Machine Controller", "asset_type": "Workstation", "criticality_tag": "standard", "rev_dep": 12.0,
             "meta": {"software": "Windows 7 Embedded"},
             "vulns": [{"cve_id": "CVE-2017-0144", "cvss": 9.3, "desc": "EternalBlue on EOL MRI controller - wormable SMB RCE.", "days": 730}]},
            {"name": "Pharmacy Dispensing System", "asset_type": "Server", "criticality_tag": "core_db", "rev_dep": 15.0,
             "meta": {"software": "BD Pyxis MedStation"},
             "vulns": [{"cve_id": "CVE-2021-44228", "cvss": 10.0, "desc": "Log4Shell on pharmacy backend - exposes medication dispensing controls.", "days": 180}]},
            {"name": "CT Scanner Workstation", "asset_type": "Workstation", "criticality_tag": "standard", "rev_dep": 8.0,
             "meta": {"software": "Windows 10 LTSC"}, "vulns": []},
            {"name": "Ventilator Control System", "asset_type": "Server", "criticality_tag": "payment_processing", "rev_dep": 18.0,
             "meta": {"software": "Drager Software"}, "vulns": []},
            {"name": "Medical Devices Network Gateway", "asset_type": "Network Device", "criticality_tag": "standard", "rev_dep": 6.0,
             "meta": {"software": "Medigate IoMT Gateway"},
             "vulns": [{"cve_id": "CVE-2023-5528", "cvss": 7.2, "desc": "IoMT gateway privilege escalation - lateral movement to medical devices.", "days": 60}]},
        ],
    }

    all_sheet_assets: dict = {}
    for sheet_obj in sheets:
        local_list: list = []
        for ad in all_assets_data.get(sheet_obj.id, []):
            asset = Asset(
                sheet_id=sheet_obj.id, name=ad["name"], asset_type=ad["asset_type"],
                criticality_tag=ad["criticality_tag"], revenue_dependency_pct=ad["rev_dep"],
                metadata_json=ad.get("meta"),
            )
            db.add(asset)
            await db.flush()
            for vd in ad.get("vulns", []):
                db.add(Vulnerability(
                    asset_id=asset.id, cve_id=vd.get("cve_id"), cvss_score=vd.get("cvss"),
                    description=vd.get("desc", ""), days_unpatched=vd.get("days", 0), source="cve_match",
                ))
            local_list.append(asset)
        all_sheet_assets[sheet_obj.id] = local_list
        await db.flush()

    asset_n2id: dict = {}
    for al in all_sheet_assets.values():
        for a in al:
            asset_n2id[a.name] = a.id

    for sid, sn, tn, st in [
        (clinical_it.id, "Hospital VPN Gateway", "Electronic Health Records (EHR) Server", "strong"),
        (clinical_it.id, "Nursing Station Workstations (x20)", "Electronic Health Records (EHR) Server", "moderate"),
        (clinical_it.id, "Doctor Workstations (x15)", "Electronic Health Records (EHR) Server", "moderate"),
        (clinical_it.id, "Electronic Health Records (EHR) Server", "Lab Management System (LIS)", "strong"),
        (clinical_it.id, "Radiology PACS Server", "Electronic Health Records (EHR) Server", "moderate"),
        (patient_data_sheet.id, "Patient Portal (Web App)", "Patient Database (PHI Store)", "strong"),
        (patient_data_sheet.id, "Billing and Insurance System", "Patient Database (PHI Store)", "moderate"),
        (patient_data_sheet.id, "Pathology Report Storage", "Patient Database (PHI Store)", "moderate"),
        (med_devices.id, "Medical Devices Network Gateway", "ICU Patient Monitoring System", "strong"),
        (med_devices.id, "Medical Devices Network Gateway", "Pharmacy Dispensing System", "strong"),
        (med_devices.id, "Medical Devices Network Gateway", "MRI Machine Controller", "moderate"),
        (clinical_it.id, "Electronic Health Records (EHR) Server", "Patient Database (PHI Store)", "strong"),
        (med_devices.id, "Medical Devices Network Gateway", "Electronic Health Records (EHR) Server", "moderate"),
    ]:
        si = asset_n2id.get(sn)
        ti = asset_n2id.get(tn)
        if si and ti:
            db.add(GraphEdge(sheet_id=sid, source_asset_id=si, target_asset_id=ti, dependency_strength=st))

    controls_dicts = [
        {"id": c.id, "name": c.name, "status": c.status, "framework_clause_refs": c.framework_clause_refs}
        for c in controls
    ]
    ctx_controls = ControlsContext.from_control_list(controls_dicts)
    ctx_org = OrgContext(
        sector=org.sector, size_tier=org.size_tier,
        employee_count=org.employee_count, annual_revenue_inr=org.annual_revenue_inr,
    )

    for sheet_obj in sheets:
        total_eal = 0.0
        traces: list = []
        for a in all_sheet_assets.get(sheet_obj.id, []):
            vr = await db.execute(select(Vulnerability).where(Vulnerability.asset_id == a.id))
            vs = vr.scalars().all()
            vcs = [VulnContext(cvss_score=v.cvss_score, days_unpatched=v.days_unpatched,
                               cve_id=v.cve_id, description=v.description) for v in vs]
            ac = AssetContext(name=a.name, asset_type=a.asset_type,
                              criticality_tag=a.criticality_tag, revenue_dependency_pct=a.revenue_dependency_pct)
            out = compute_asset_risk(ctx_org, ac, vcs, ctx_controls)
            db.add(RiskScore(asset_id=a.id, sheet_id=sheet_obj.id,
                             expected_annual_loss_inr=out.expected_annual_loss_inr,
                             rule_trace=out.as_dict_trace(), ai_mode="rules_only"))
            total_eal += out.expected_annual_loss_inr
            traces.extend(out.as_dict_trace())
        db.add(RiskScore(sheet_id=sheet_obj.id, asset_id=None,
                         expected_annual_loss_inr=round(total_eal, 2),
                         rule_trace=traces[:15], ai_mode="rules_only"))

    for fw in ["ISO27001", "NIST_CSF", "CIS_CONTROLS", "HIPAA", "GDPR_DPDPA", "PCI_DSS"]:
        for r in evaluate_compliance(fw, controls_dicts):
            co = ctrl_by_name.get(r.get("control_name") or "")
            db.add(ComplianceGap(
                org_id=org.id, framework=fw, clause_ref=r["clause_ref"],
                clause_title=r["clause_title"], status=r["status"],
                linked_control_id=co.id if co else None,
            ))

    from ..services.optimizer import estimate_control_risk_reduction
    for c in controls:
        if c.status != "present":
            red = estimate_control_risk_reduction(c.name, org.annual_revenue_inr, 15_000_000.0)
            cost = max(c.cost_inr, 1.0)
            roi = round(red / cost, 2)
            db.add(Recommendation(
                org_id=org.id, control_id=c.id, risk_reduction_inr=round(red, 2),
                cost_inr=c.cost_inr, roi_ratio=roi,
                ai_rationale=f"Deploying {c.name} reduces patient data exposure by Rs{red:,.0f} ({roi:.1f}x ROI).",
            ))

    await db.flush()
    logger.info("Seeded Aarogya Hospitals Ltd: org=%s, sheets=%d, assets=%d",
                org.id, len(sheets), sum(len(v) for v in all_sheet_assets.values()))
    return org
