#!/usr/bin/env python3
"""Script to append healthcare seed data to seed_data.py"""

healthcare_code = r'''

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
'''

seed_file = 'backend/app/services/seed_data.py'
with open(seed_file, 'a', encoding='utf-8') as f:
    f.write(healthcare_code)
print('Successfully appended healthcare seed org!')
