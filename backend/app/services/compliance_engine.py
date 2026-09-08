"""
services/compliance_engine.py — Comprehensive 8-Framework Compliance Audit Engine for Tarazu (Module 8).

Full clause-level lookup tables for all 8 mandatory frameworks:
1. ISO 27001:2022 Annex A
2. NIST CSF 2.0 (National Institute of Standards & Technology)
3. CIS Controls v8 (Center for Internet Security)
4. RBI CSF (Reserve Bank of India Cyber Security Framework for Banks/NBFCs)
5. SEBI CSCRF (Securities & Exchange Board of India Cybersecurity & Cyber Resilience Framework)
6. HIPAA Security Rule (Health Insurance Portability and Accountability Act - §164.308 / §164.312)
7. PCI DSS v4.0 (Payment Card Industry Data Security Standard)
8. GDPR & India DPDP Act 2023 (Digital Personal Data Protection Act)
"""
from __future__ import annotations
from typing import Optional

# ── 1. ISO 27001 Annex A ──────────────────────────────────────────────────────
ISO27001_CLAUSES = [
    {"ref": "A.5.1.1", "title": "Policies for Information Security", "control_keywords": ["security policy", "governance framework", "information security policy"]},
    {"ref": "A.6.1.2", "title": "Segregation of Duties & Access Control", "control_keywords": ["privileged access", "pam", "access control"]},
    {"ref": "A.8.1.1", "title": "Inventory and Ownership of Assets", "control_keywords": ["asset inventory", "cmdb"]},
    {"ref": "A.9.4.2", "title": "Secure Log-on Procedures (MFA Enforcement)", "control_keywords": ["mfa", "multi-factor", "two-factor"]},
    {"ref": "A.9.4.4", "title": "Use of Privileged Utility Programs", "control_keywords": ["privileged access", "pam"]},
    {"ref": "A.10.1.1", "title": "Policy on Use of Cryptographic Controls", "control_keywords": ["encryption", "tls", "cryptography"]},
    {"ref": "A.12.2.1", "title": "Controls Against Malware (EDR Detection)", "control_keywords": ["edr", "endpoint detection", "anti-malware", "antivirus"]},
    {"ref": "A.12.3.1", "title": "Information Backup & Immutable Retention", "control_keywords": ["backup", "immutable", "disaster recovery", "airgapped"]},
    {"ref": "A.12.6.1", "title": "Management of Technical Vulnerabilities (Patching)", "control_keywords": ["patch", "vulnerability scan", "patch management"]},
    {"ref": "A.13.1.1", "title": "Network Security Controls & Segmentation", "control_keywords": ["network segmentation", "firewall", "vlan"]},
    {"ref": "A.13.2.1", "title": "Information Transfer Policies (DLP Protection)", "control_keywords": ["dlp", "data loss prevention"]},
    {"ref": "A.14.2.5", "title": "Secure System Development & WAF", "control_keywords": ["waf", "web application firewall", "secure code", "sast"]},
    {"ref": "A.16.1.1", "title": "Responsibilities and Procedures for Incident Response", "control_keywords": ["incident response", "irp"]},
    {"ref": "A.16.1.4", "title": "Assessment & Monitoring of Security Events (SIEM)", "control_keywords": ["siem", "security monitoring", "soc"]},
    {"ref": "A.18.1.3", "title": "Protection of Records & Immutable Audit Logs", "control_keywords": ["audit log", "log retention", "logging"]},
]

# ── 2. NIST CSF 2.0 ────────────────────────────────────────────────────────────
NIST_CSF_CLAUSES = [
    {"ref": "NIST-GV.PO", "title": "Organizational Context & Security Governance", "control_keywords": ["security policy", "governance framework"]},
    {"ref": "NIST-ID.AM", "title": "Asset Management & Hardware/Software Inventory", "control_keywords": ["asset inventory", "cmdb"]},
    {"ref": "NIST-PR.AC", "title": "Identity Management, Authentication & Access Control (MFA/PAM)", "control_keywords": ["mfa", "privileged access", "pam"]},
    {"ref": "NIST-PR.DS", "title": "Data Security (Encryption at Rest and in Transit)", "control_keywords": ["encryption", "tls", "dlp"]},
    {"ref": "NIST-PR.PS", "title": "Protective Technology (Firewall, WAF & Zero Trust)", "control_keywords": ["firewall", "waf", "zero trust", "ztna"]},
    {"ref": "NIST-PR.IP", "title": "Baseline Maintenance, Patching & Resilience Backups", "control_keywords": ["patch", "backup", "immutable"]},
    {"ref": "NIST-DE.CM", "title": "Continuous Security Monitoring (SOC / SIEM / EDR)", "control_keywords": ["siem", "edr", "security monitoring", "soc"]},
    {"ref": "NIST-DE.DP", "title": "Vulnerability Detection & Periodic Penetration Testing", "control_keywords": ["vulnerability scan", "red team", "penetration testing"]},
    {"ref": "NIST-RS.RP", "title": "Incident Response Plan & Operational Execution", "control_keywords": ["incident response", "irp"]},
    {"ref": "NIST-RC.RP", "title": "Recovery Planning, Cyber Insurance & BCP Restoration", "control_keywords": ["backup", "cyber insurance", "bcp"]},
]

# ── 3. CIS Controls v8 ─────────────────────────────────────────────────────────
CIS_CONTROLS_CLAUSES = [
    {"ref": "CIS-01", "title": "Inventory and Control of Enterprise Assets", "control_keywords": ["asset inventory", "cmdb"]},
    {"ref": "CIS-03", "title": "Data Protection (DLP & Storage Encryption)", "control_keywords": ["dlp", "data loss", "encryption", "tls"]},
    {"ref": "CIS-04", "title": "Secure Configuration of Enterprise Assets & Software", "control_keywords": ["security policy", "firewall"]},
    {"ref": "CIS-05", "title": "Account Management & Role Segregation", "control_keywords": ["privileged access", "pam"]},
    {"ref": "CIS-06", "title": "Access Control Management & Multi-Factor Authentication", "control_keywords": ["mfa", "multi-factor"]},
    {"ref": "CIS-07", "title": "Continuous Vulnerability Management (Scanning & Patching)", "control_keywords": ["patch", "vulnerability scan"]},
    {"ref": "CIS-08", "title": "Audit Log Management & Centralized Retention", "control_keywords": ["audit log", "log retention", "siem"]},
    {"ref": "CIS-10", "title": "Malware Defenses (EDR Active Host Protection)", "control_keywords": ["edr", "endpoint detection"]},
    {"ref": "CIS-11", "title": "Data Recovery Capabilities (Airgapped & Immutable Backups)", "control_keywords": ["backup", "immutable"]},
    {"ref": "CIS-12", "title": "Network Infrastructure Management (Micro-segmentation)", "control_keywords": ["network segmentation", "vlan", "firewall"]},
    {"ref": "CIS-14", "title": "Security Awareness and Skills Training", "control_keywords": ["awareness training", "training"]},
    {"ref": "CIS-17", "title": "Incident Response Management and Tabletop Drills", "control_keywords": ["incident response", "irp"]},
]

# ── 4. RBI Cyber Security Framework (CSF) for Banks/NBFCs ─────────────────────
RBI_CSF_CLAUSES = [
    {"ref": "RBI-CSF-1.1", "title": "Cyber Security Policy & Board-Level Governance", "control_keywords": ["security policy", "cyber policy"]},
    {"ref": "RBI-CSF-2.1", "title": "Privileged Access Management (PAM & Dual Control)", "control_keywords": ["privileged access", "pam"]},
    {"ref": "RBI-CSF-3.1", "title": "Mandatory MFA for Critical Banking Infrastructure", "control_keywords": ["mfa", "multi-factor", "two-factor"]},
    {"ref": "RBI-CSF-3.2", "title": "Network Segmentation (Core Banking vs Perimeter Isolation)", "control_keywords": ["network segmentation", "firewall", "vlan"]},
    {"ref": "RBI-CSF-4.1", "title": "Strict Patch & Known Exploit Remediation SLA", "control_keywords": ["patch", "vulnerability scan"]},
    {"ref": "RBI-CSF-5.1", "title": "End-to-End Financial Payload Encryption (TLS 1.3)", "control_keywords": ["encryption", "tls"]},
    {"ref": "RBI-CSF-5.2", "title": "Data Loss Prevention across Customer Transaction Channels", "control_keywords": ["dlp", "data loss prevention"]},
    {"ref": "RBI-CSF-6.1", "title": "Cyber Crisis Management Plan & 6-Hour CERT-In Reporting", "control_keywords": ["incident response", "irp"]},
    {"ref": "RBI-CSF-7.1", "title": "Security Operations Center (SOC) & SIEM 24/7 Telemetry", "control_keywords": ["siem", "security monitoring", "soc"]},
    {"ref": "RBI-CSF-8.1", "title": "Air-Gapped Golden Copies & Business Continuity Backups", "control_keywords": ["backup", "immutable", "airgapped"]},
]

# ── 5. SEBI CSCRF (Securities & Capital Markets) ──────────────────────────────
SEBI_CSCRF_CLAUSES = [
    {"ref": "SEBI-CSCRF-1.1", "title": "Cyber Resilience Policy & Steering Committee Oversight", "control_keywords": ["security policy", "governance framework"]},
    {"ref": "SEBI-CSCRF-2.1", "title": "Access Entitlement Review & Privileged Credential Vaulting", "control_keywords": ["privileged access", "pam"]},
    {"ref": "SEBI-CSCRF-3.1", "title": "Algorithmic Trading & Depository Network Isolation", "control_keywords": ["network segmentation", "zero trust", "ztna"]},
    {"ref": "SEBI-CSCRF-4.1", "title": "Bi-Annual VAPT & Third-Party Code Auditing", "control_keywords": ["red team", "penetration testing", "secure code", "sast"]},
    {"ref": "SEBI-CSCRF-5.1", "title": "Real-time Anomaly Detection & Market Data Feed Monitoring", "control_keywords": ["siem", "edr", "security monitoring"]},
    {"ref": "SEBI-CSCRF-6.1", "title": "Forensic Readiness & Immutable Audit Trail Preservation", "control_keywords": ["audit log", "log retention"]},
    {"ref": "SEBI-CSCRF-7.1", "title": "Disaster Recovery RTO < 15 Min & Off-Site Data Replication", "control_keywords": ["backup", "immutable"]},
    {"ref": "SEBI-CSCRF-8.1", "title": "Supply Chain & Vendor Risk Security Certification", "control_keywords": ["third-party", "vendor risk"]},
]

# ── 6. HIPAA Security Rule (§164.308 / §164.312) ───────────────────────────────
HIPAA_CLAUSES = [
    {"ref": "HIPAA-308(a)(1)", "title": "Security Management Process & Risk Analysis", "control_keywords": ["security policy", "vulnerability scan"]},
    {"ref": "HIPAA-308(a)(3)", "title": "Workforce Access Authorization & Clearance", "control_keywords": ["privileged access", "pam"]},
    {"ref": "HIPAA-308(a)(5)", "title": "Security Awareness and Phishing Training", "control_keywords": ["awareness training", "training"]},
    {"ref": "HIPAA-308(a)(6)", "title": "Security Incident Procedures & Breach Escalation", "control_keywords": ["incident response", "irp"]},
    {"ref": "HIPAA-308(a)(7)", "title": "Contingency Plan & Disaster Emergency Mode Operations", "control_keywords": ["backup", "immutable"]},
    {"ref": "HIPAA-312(a)(1)", "title": "Unique ePHI User Identification & Emergency Access", "control_keywords": ["mfa", "multi-factor"]},
    {"ref": "HIPAA-312(b)", "title": "Audit Controls & Electronic Medical Record Logging", "control_keywords": ["audit log", "siem"]},
    {"ref": "HIPAA-312(c)(1)", "title": "ePHI Integrity & Anti-Tamper Mechanisms", "control_keywords": ["immutable", "edr"]},
    {"ref": "HIPAA-312(e)(1)", "title": "Transmission Security & Transport Encryption (HL7/DICOM/TLS)", "control_keywords": ["encryption", "tls"]},
]

# ── 7. PCI DSS v4.0 (Cardholder Data Protection) ──────────────────────────────
PCI_DSS_CLAUSES = [
    {"ref": "PCI-Req-01", "title": "Install and Maintain Network Security Controls (Firewalls)", "control_keywords": ["firewall", "network segmentation"]},
    {"ref": "PCI-Req-02", "title": "Apply Secure Configurations to All System Components", "control_keywords": ["security policy", "asset inventory"]},
    {"ref": "PCI-Req-03", "title": "Protect Stored Account Data with Industry Encryption", "control_keywords": ["encryption", "tls"]},
    {"ref": "PCI-Req-04", "title": "Protect Cardholder Data with Strong Cryptography in Transit", "control_keywords": ["encryption", "tls"]},
    {"ref": "PCI-Req-05", "title": "Protect Systems from Malicious Software with EDR/AV", "control_keywords": ["edr", "endpoint detection", "anti-malware"]},
    {"ref": "PCI-Req-06", "title": "Develop and Maintain Secure Software (WAF & SAST)", "control_keywords": ["waf", "web application firewall", "secure code", "sast"]},
    {"ref": "PCI-Req-07", "title": "Restrict Access to System Components by Business Need-to-Know", "control_keywords": ["privileged access", "pam"]},
    {"ref": "PCI-Req-08", "title": "Identify Users and Authenticate Access (MFA Mandatory)", "control_keywords": ["mfa", "multi-factor"]},
    {"ref": "PCI-Req-10", "title": "Log and Monitor All Access to System Components & Cardholder Data", "control_keywords": ["audit log", "siem", "log retention"]},
    {"ref": "PCI-Req-11", "title": "Test Security of Systems and Networks Regularly (VAPT)", "control_keywords": ["vulnerability scan", "red team", "penetration testing"]},
    {"ref": "PCI-Req-12", "title": "Support Information Security with Organizational Policies & IRP", "control_keywords": ["incident response", "irp", "security policy"]},
]

# ── 8. GDPR & India DPDP Act 2023 ─────────────────────────────────────────────
GDPR_DPDPA_CLAUSES = [
    {"ref": "DPDPA-Sec-08(1)", "title": "Implementation of Reasonable Security Safeguards", "control_keywords": ["security policy", "governance framework"]},
    {"ref": "DPDPA-Sec-08(5)", "title": "Data Erasure & Storage Limitation upon Purpose Completion", "control_keywords": ["dlp", "data loss prevention"]},
    {"ref": "DPDPA-Sec-08(6)", "title": "Mandatory Personal Data Breach Notification to Board & Data Principals", "control_keywords": ["incident response", "irp"]},
    {"ref": "DPDPA-Sec-09", "title": "Special Protection Safeguards for Children's Data & Biometrics", "control_keywords": ["encryption", "privileged access"]},
    {"ref": "GDPR-Art-32(1)(a)", "title": "Pseudonymisation and Encryption of Personal Data", "control_keywords": ["encryption", "tls"]},
    {"ref": "GDPR-Art-32(1)(b)", "title": "Confidentiality, Integrity, Availability and Resilience of Systems", "control_keywords": ["edr", "firewall", "immutable"]},
    {"ref": "GDPR-Art-32(1)(c)", "title": "Timely Restoration of Availability and Access in Physical/Technical Incidents", "control_keywords": ["backup", "immutable", "bcp"]},
    {"ref": "GDPR-Art-32(1)(d)", "title": "Process for Regularly Testing, Assessing and Evaluating Effectiveness", "control_keywords": ["vulnerability scan", "red team", "penetration testing"]},
    {"ref": "GDPR-Art-33", "title": "Notification of a Personal Data Breach to the Supervisory Authority within 72h", "control_keywords": ["incident response", "irp", "siem"]},
]

FRAMEWORK_CLAUSES = {
    "ISO27001": ISO27001_CLAUSES,
    "NIST_CSF": NIST_CSF_CLAUSES,
    "CIS_CONTROLS": CIS_CONTROLS_CLAUSES,
    "RBI_CSF": RBI_CSF_CLAUSES,
    "SEBI_CSCRF": SEBI_CSCRF_CLAUSES,
    "HIPAA": HIPAA_CLAUSES,
    "PCI_DSS": PCI_DSS_CLAUSES,
    "GDPR_DPDPA": GDPR_DPDPA_CLAUSES,
}

FRAMEWORK_DISPLAY_NAMES = {
    "ISO27001": "ISO/IEC 27001:2022",
    "NIST_CSF": "NIST CSF 2.0",
    "CIS_CONTROLS": "CIS Controls v8",
    "RBI_CSF": "RBI Cyber Security Framework",
    "SEBI_CSCRF": "SEBI CSCRF 2024",
    "HIPAA": "HIPAA Security Rule",
    "PCI_DSS": "PCI DSS v4.0",
    "GDPR_DPDPA": "GDPR & India DPDP Act 2023",
}


def evaluate_compliance(
    framework: str,
    controls: list[dict],
) -> list[dict]:
    """
    Evaluate compliance for a given framework against the org's control list.

    Args:
        framework: one of ["ISO27001", "NIST_CSF", "CIS_CONTROLS", "RBI_CSF", "SEBI_CSCRF", "HIPAA", "PCI_DSS", "GDPR_DPDPA"]
        controls: list of {id, name, status} dicts

    Returns:
        list of {clause_ref, clause_title, status, linked_control_id, control_name}
    """
    clauses = FRAMEWORK_CLAUSES.get(framework, ISO27001_CLAUSES)
    results = []

    for clause in clauses:
        keywords = [k.lower() for k in clause["control_keywords"]]
        matched_control = None
        clause_status = "gap"

        # Check for explicit ref match first
        for c in controls:
            refs = c.get("framework_clause_refs") or {}
            if refs.get(framework) == clause["ref"]:
                matched_control = c
                break

        # Fallback to keyword match
        if not matched_control:
            for c in controls:
                c_name = c["name"].lower()
                if any(kw in c_name for kw in keywords):
                    matched_control = c
                    break

        if matched_control:
            c_status = matched_control.get("status", "absent")
            if c_status == "present":
                clause_status = "satisfied"
            elif c_status == "partial":
                clause_status = "partial"
            else:
                clause_status = "gap"
        else:
            clause_status = "gap"

        results.append({
            "clause_ref": clause["ref"],
            "clause_title": clause["title"],
            "status": clause_status,
            "linked_control_id": matched_control["id"] if matched_control else None,
            "control_name": matched_control["name"] if matched_control else None,
        })

    return results
