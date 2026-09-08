"""
services/rules_engine.py — Tarazu Deterministic Risk Quantification Engine.

Implements 20+ rules. Every triggered rule outputs:
  {rule_id, description, contribution_inr, rule_tier, reason}

The engine runs FIRST for every quantification. The AI layer only calibrates
on the output of this engine (bounded ±30%). Never bypassed.

FAIR-inspired base formula:
  EAL = LEF × SLE
  SLE_base = (revenue × rev_dep_pct/100 × 0.05) + (employees × ₹15,000)
  LEF is accumulated from vulnerability and control rules.
"""
from __future__ import annotations
from dataclasses import dataclass, field
from typing import Optional


# ── Organization Context ──────────────────────────────────────────────────────

@dataclass
class OrgContext:
    sector: str           # BFSI, Healthcare, Manufacturing, IT-SaaS, Other
    size_tier: str        # MSME, Mid, Enterprise
    employee_count: int
    annual_revenue_inr: float

    # Scale tier multipliers — same vuln → different ₹ impact at different scale
    @property
    def tier_multiplier(self) -> float:
        return {"MSME": 0.6, "Mid": 1.0, "Enterprise": 2.2}[self.size_tier]


@dataclass
class AssetContext:
    name: str
    asset_type: str
    criticality_tag: str
    revenue_dependency_pct: float


@dataclass
class VulnContext:
    cvss_score: Optional[float]
    days_unpatched: int
    cve_id: Optional[str] = None
    description: str = ""


@dataclass
class ControlsContext:
    """Snapshot of relevant org-level controls and their statuses."""
    mfa_admin: str = "absent"           # present/absent/partial
    edr: str = "absent"
    immutable_backups: str = "absent"
    tls_encryption: str = "absent"
    patch_management: str = "absent"
    dlp: str = "absent"
    vulnerability_scanning: str = "absent"
    incident_response_plan: str = "absent"
    network_segmentation: str = "absent"
    privileged_access_mgmt: str = "absent"
    waf: str = "absent"
    siem: str = "absent"
    ztna: str = "absent"
    cspm: str = "absent"
    penetration_testing: str = "absent"
    cyber_insurance: str = "absent"

    @classmethod
    def from_control_list(cls, controls: list[dict]) -> "ControlsContext":
        """Build ControlsContext from list of {name, status} dicts."""
        def status(keyword: str) -> str:
            for c in controls:
                if keyword.lower() in c["name"].lower():
                    return c["status"]
            return "absent"

        return cls(
            mfa_admin=status("MFA"),
            edr=status("EDR") or status("Endpoint Detection"),
            immutable_backups=status("Backup") or status("Immutable"),
            tls_encryption=status("Encryption") or status("TLS"),
            patch_management=status("Patch"),
            dlp=status("DLP") or status("Data Loss"),
            vulnerability_scanning=status("Vulnerability Scan"),
            incident_response_plan=status("Incident Response"),
            network_segmentation=status("Network Segmentation"),
            privileged_access_mgmt=status("Privileged Access") or status("PAM"),
            waf=status("WAF") or status("Web Application Firewall"),
            siem=status("SIEM") or status("Security Monitoring") or status("SOC"),
            ztna=status("Zero Trust") or status("ZTNA"),
            cspm=status("Cloud Security") or status("CSPM"),
            penetration_testing=status("Penetration") or status("Red Team"),
            cyber_insurance=status("Insurance"),
        )


# ── Result ────────────────────────────────────────────────────────────────────

@dataclass
class RuleResult:
    rule_id: str
    description: str
    contribution_inr: float
    rule_tier: str  # "universal" | "sector"
    reason: str


@dataclass
class EngineOutput:
    expected_annual_loss_inr: float
    rule_trace: list[RuleResult]

    def as_dict_trace(self) -> list[dict]:
        return [
            {
                "rule_id": r.rule_id,
                "description": r.description,
                "contribution_inr": round(r.contribution_inr, 2),
                "rule_tier": r.rule_tier,
                "reason": r.reason,
            }
            for r in self.rule_trace
        ]


# ── Helper — control partial credit ──────────────────────────────────────────

def _control_factor(status: str) -> float:
    """Returns the risk-reduction factor for a control. present=full, partial=half."""
    return {"present": 1.0, "partial": 0.5, "absent": 0.0}.get(status, 0.0)


def _absent_or_partial(status: str) -> bool:
    return status in ("absent", "partial")


# ── Core Engine ───────────────────────────────────────────────────────────────

def compute_asset_risk(
    org: OrgContext,
    asset: AssetContext,
    vulns: list[VulnContext],
    controls: ControlsContext,
) -> EngineOutput:
    """
    Run deterministic rules against a single asset and return EAL + full trace.
    Rules accumulate into LEF and SLE modifiers separately, then combine at the end.
    """
    trace: list[RuleResult] = []

    # ── SLE Base Calculation ──────────────────────────────────────────────────
    rev_dep = asset.revenue_dependency_pct / 100.0
    sle_base = (org.annual_revenue_inr * rev_dep * 0.05) + (org.employee_count * 15_000)
    sle_base = max(sle_base, 100_000)  # floor: ₹1 lakh

    # Apply tier multiplier — Demo Pillar #1 core differentiator
    sle_base *= org.tier_multiplier

    lef_accumulator: float = 0.10   # baseline 10% annual likelihood
    sle_multiplier: float = 1.0
    fixed_additions: float = 0.0    # flat ₹ additions for regulatory/sector penalties

    # ── R18: Control Partial Credit Baseline ──────────────────────────────────
    # (handled inline in each rule below, but we log it once)
    if _absent_or_partial(controls.mfa_admin) or _absent_or_partial(controls.edr):
        pass  # no standalone contribution — each rule handles its own logging

    # ── UNIVERSAL RULES ───────────────────────────────────────────────────────

    for vuln in vulns:
        cvss = vuln.cvss_score or 0.0
        days = vuln.days_unpatched

        # R01 — Critical unpatched vulnerability
        if cvss >= 9.0 and days > 30:
            lef_addition = 0.45
            contrib = sle_base * lef_addition
            trace.append(RuleResult(
                rule_id="R01_CVSS_CRITICAL",
                description=f"CVSS {cvss:.1f} critical vulnerability unpatched for {days} days",
                contribution_inr=contrib,
                rule_tier="universal",
                reason=f"CVSS ≥ 9.0 + >30 days unpatched → high exploitability. LEF +{lef_addition:.0%}",
            ))
            lef_accumulator += lef_addition

        # R02 — High severity unpatched vulnerability
        elif 7.0 <= cvss < 9.0 and days > 60:
            lef_addition = 0.25
            contrib = sle_base * lef_addition
            trace.append(RuleResult(
                rule_id="R02_CVSS_HIGH",
                description=f"CVSS {cvss:.1f} high-severity vulnerability unpatched for {days} days",
                contribution_inr=contrib,
                rule_tier="universal",
                reason=f"CVSS 7.0–8.9 + >60 days unpatched → elevated attack probability. LEF +{lef_addition:.0%}",
            ))
            lef_accumulator += lef_addition

        # R03 — Long-standing unpatched vulnerability (age multiplier)
        if days > 180:
            age_mult = 1.30
            trace.append(RuleResult(
                rule_id="R03_OLD_VULN",
                description=f"Vulnerability open >180 days ({days}d) — negligence multiplier applied",
                contribution_inr=sle_base * 0.30,
                rule_tier="universal",
                reason=f"Unpatched > 180 days → SLE multiplier ×{age_mult}. Extended exposure window increases real-world exploitation probability.",
            ))
            sle_multiplier *= age_mult

        # R17 — Crown jewel + high CVSS + 90 days
        if cvss >= 8.0 and days > 90 and asset.criticality_tag in ("payment_processing", "core_db"):
            trace.append(RuleResult(
                rule_id="R17_PATCH_SLA_BREACH",
                description=f"CVSS {cvss:.1f} on crown-jewel asset unpatched {days}d — SLA breach",
                contribution_inr=sle_base * 0.20,
                rule_tier="universal",
                reason="High CVSS on critical asset beyond 90-day SLA → executive liability and board-level risk escalation modifier ×1.2",
            ))
            sle_multiplier *= 1.20

    # R04 — No MFA on admin accounts
    if _absent_or_partial(controls.mfa_admin):
        credit = _control_factor(controls.mfa_admin)  # 0.5 if partial
        lef_add = 0.35 * (1 - credit)
        contrib = sle_base * lef_add
        trace.append(RuleResult(
            rule_id="R04_NO_MFA_ADMIN",
            description=f"MFA on Admin Accounts: {controls.mfa_admin}",
            contribution_inr=contrib,
            rule_tier="universal",
            reason=f"Missing/partial MFA on administrative accounts greatly increases credential theft risk. LEF +{lef_add:.0%} (R18 partial credit applied: {credit:.0%})",
        ))
        lef_accumulator += lef_add

    # R05 — No EDR
    if _absent_or_partial(controls.edr):
        credit = _control_factor(controls.edr)
        impact_add = 0.25 * (1 - credit)
        contrib = sle_base * impact_add
        trace.append(RuleResult(
            rule_id="R05_NO_EDR",
            description=f"Endpoint Detection & Response (EDR): {controls.edr}",
            contribution_inr=contrib,
            rule_tier="universal",
            reason=f"Absent/partial EDR reduces detection probability → dwell time increases → blast radius expands. Impact +{impact_add:.0%}",
        ))
        sle_multiplier += impact_add

    # R06 — No immutable/airgapped backups (ransomware factor)
    if _absent_or_partial(controls.immutable_backups):
        credit = _control_factor(controls.immutable_backups)
        ransomware_add = 0.40 * (1 - credit)
        contrib = sle_base * ransomware_add
        trace.append(RuleResult(
            rule_id="R06_NO_BACKUP_AIRGAP",
            description=f"Immutable/Airgapped Backups: {controls.immutable_backups}",
            contribution_inr=contrib,
            rule_tier="universal",
            reason=f"No protected backups → ransomware recovery cost multiplier +{ransomware_add:.0%}. Key driver of large ₹ incidents in India BFSI.",
        ))
        sle_multiplier += ransomware_add

    # R15 — Admin workstation as lateral movement springboard
    if asset.asset_type == "Workstation" and asset.criticality_tag == "admin_workstation":
        lef_add = 0.20
        contrib = sle_base * lef_add
        trace.append(RuleResult(
            rule_id="R15_ADMIN_WORKSTATION_LATERAL",
            description="Admin workstation with weak controls — lateral movement springboard",
            contribution_inr=contrib,
            rule_tier="universal",
            reason="Admin workstations are the #1 pivot point for post-compromise lateral movement. LEF +20%",
        ))
        lef_accumulator += lef_add

    # R16 — Missing encryption
    if _absent_or_partial(controls.tls_encryption):
        fixed_additions += 800_000
        trace.append(RuleResult(
            rule_id="R16_WEAK_ENCRYPTION",
            description=f"TLS/Data Encryption: {controls.tls_encryption}",
            contribution_inr=800_000,
            rule_tier="universal",
            reason="Missing encryption exposes data-in-transit/rest to interception → regulatory leakage penalty floor ₹8,00,000",
        ))

    # R20 — Supply chain / vendor integration
    meta = getattr(asset, "metadata_json", None) or {}
    if meta.get("vendor_integrated") or meta.get("third_party"):
        lef_add = 0.10
        contrib = sle_base * lef_add
        trace.append(RuleResult(
            rule_id="R20_SUPPLY_CHAIN_VENDOR",
            description="Third-party vendor integration detected in asset metadata",
            contribution_inr=contrib,
            rule_tier="universal",
            reason="Vendor integrations extend the attack surface beyond perimeter. LEF +10% for supply chain risk.",
        ))
        lef_accumulator += lef_add

    # ── CRITICALITY TAG RULES ─────────────────────────────────────────────────

    # R07 — Payment processing asset
    if asset.criticality_tag == "payment_processing":
        tier_penalty = {"MSME": 2_500_000, "Mid": 5_000_000, "Enterprise": 15_000_000}
        penalty = tier_penalty[org.size_tier]
        fixed_additions += penalty
        trace.append(RuleResult(
            rule_id="R07_PAYMENT_PROCESSING",
            description=f"Asset tagged 'payment_processing' — financial fraud & PCI DSS exposure",
            contribution_inr=penalty,
            rule_tier="universal",
            reason=f"Payment infrastructure compromise → direct card fraud liability + RBI fine. Penalty ₹{penalty/100_000:.0f} lakh (tier: {org.size_tier})",
        ))

    # R08 — Core database
    if asset.criticality_tag == "core_db":
        tier_penalty = {"MSME": 3_500_000, "Mid": 7_000_000, "Enterprise": 20_000_000}
        penalty = tier_penalty[org.size_tier]
        fixed_additions += penalty
        trace.append(RuleResult(
            rule_id="R08_CORE_DATABASE",
            description="Asset tagged 'core_db' — data breach, DPDPA notification, customer churn",
            contribution_inr=penalty,
            rule_tier="universal",
            reason=f"Core DB breach → DPDPA Act notification cost + class action risk + customer churn @ 2%. Penalty ₹{penalty/100_000:.0f} lakh",
        ))

    # R09 — Customer-facing asset with vulnerabilities
    if asset.criticality_tag == "customer_portal" and any(v.cvss_score and v.cvss_score >= 6.0 for v in vulns):
        trace.append(RuleResult(
            rule_id="R09_CUSTOMER_FACING",
            description="Customer-facing portal with CVSS ≥ 6.0 vulnerability — public attack surface",
            contribution_inr=sle_base * 0.25,
            rule_tier="universal",
            reason="Externally reachable vulnerable portal → attack surface multiplier ×1.25. Wider threat actor pool than internal-only assets.",
        ))
        sle_multiplier *= 1.25

    # R19 — Dependency cascade (if asset has downstream assets — flagged via metadata)
    if meta.get("downstream_dependency_count", 0) >= 3:
        trace.append(RuleResult(
            rule_id="R19_DEPENDENCY_CASCADE",
            description=f"Asset has ≥3 high-dependency downstream nodes",
            contribution_inr=sle_base * 0.15,
            rule_tier="universal",
            reason="High fan-out dependency → cascade failure blast multiplier +15% to SLE",
        ))
        sle_multiplier += 0.15

    # ── SECTOR RULES ──────────────────────────────────────────────────────────

    if org.sector == "BFSI":
        # R10 — RBI CSF compliance gap
        if _absent_or_partial(controls.privileged_access_mgmt):
            fixed_additions += 1_500_000
            trace.append(RuleResult(
                rule_id="R10_SECTOR_BFSI_RBI_COMPLIANCE",
                description="BFSI org: Missing Privileged Access Management — RBI CSF core control gap",
                contribution_inr=1_500_000,
                rule_tier="sector",
                reason="RBI Circular RBI/2015-16/418 requires PAM for all regulated entities. Sanction risk ₹15 lakh + enforcement notice.",
            ))

        # R11 — BFSI fraud risk multiplier on payment assets
        if asset.criticality_tag in ("payment_processing", "core_db"):
            trace.append(RuleResult(
                rule_id="R11_SECTOR_BFSI_FRAUD_RISK",
                description="BFSI sector + transaction infrastructure → fraud exposure multiplier",
                contribution_inr=sle_base * 0.40,
                rule_tier="sector",
                reason="Indian BFSI fraud rates 40% higher than global average per IBM India CODB 2024. SLE ×1.4",
            ))
            sle_multiplier *= 1.40

    elif org.sector == "Healthcare":
        # R12 — DPDP Act patient records penalty
        if asset.criticality_tag in ("core_db", "customer_portal"):
            fixed_additions += 2_000_000
            trace.append(RuleResult(
                rule_id="R12_SECTOR_HEALTHCARE_DPDP",
                description="Healthcare org: patient data asset → DPDP Act 2023 penalty exposure",
                contribution_inr=2_000_000,
                rule_tier="sector",
                reason="DPDP Act 2023 §8 data breach notification + §12 maximum penalty ₹250 crore for significant breaches. Floor estimate ₹20 lakh.",
            ))

    elif org.sector == "Manufacturing":
        # R13 — OT/SCADA downtime
        if meta.get("ot_connected") or asset.asset_type in ("OT/SCADA", "Industrial Controller"):
            trace.append(RuleResult(
                rule_id="R13_SECTOR_MANUFACTURING_OT",
                description="Manufacturing org: OT/SCADA-connected asset — factory downtime risk",
                contribution_inr=sle_base * 0.50,
                rule_tier="sector",
                reason="OT attacks cause physical production shutdown. Factory floor halt cost: ₹{:,.0f}/hr average for Indian SME manufacturers.".format(sle_base * 0.01),
            ))
            sle_multiplier *= 1.50

    elif org.sector == "IT-SaaS":
        # R14 — Multi-tenant churn multiplier
        if meta.get("multi_tenant") or asset.criticality_tag == "customer_portal":
            trace.append(RuleResult(
                rule_id="R14_SECTOR_IT_SAAS_TENANT",
                description="IT-SaaS: multi-tenant infrastructure breach → customer churn & SLA penalty",
                contribution_inr=sle_base * 0.35,
                rule_tier="sector",
                reason="SaaS breach destroys trust across all tenants simultaneously. Reputational churn multiplier ×1.35 on SLE.",
            ))
            sle_multiplier *= 1.35

    elif org.sector in ("Retail", "E-Commerce"):
        # R27 — Retail / E-commerce customer churn & festival outage liability
        if asset.criticality_tag in ("customer_portal", "payment_processing"):
            fixed_additions += 1_200_000
            trace.append(RuleResult(
                rule_id="R27_SECTOR_RETAIL_ECOMMERCE_SLA",
                description="Retail/E-Commerce: checkout portal breach → cart abandonment & festive downtime",
                contribution_inr=1_200_000,
                rule_tier="sector",
                reason="E-Commerce checkout outage during peak demand → immediate revenue leakage floor ₹12 lakh.",
            ))

    elif org.sector in ("Energy", "Utilities"):
        # R28 — Critical National Infrastructure (NCIIPC) penalty
        if asset.criticality_tag in ("crown_jewel", "core_db") or meta.get("ot_connected"):
            fixed_additions += 2_500_000
            trace.append(RuleResult(
                rule_id="R28_SECTOR_ENERGY_CRITICAL_INFRA",
                description="Energy/Utilities: National Critical Information Infrastructure (NCII) compliance risk",
                contribution_inr=2_500_000,
                rule_tier="sector",
                reason="Section 70 of IT Act 2000 mandates protected system status for power grid. Statutory breach penalty floor ₹25 lakh.",
            ))

    # ── ADDITIONAL COMPLIANCE & POSTURE RULES (R21-R30) ──────────────────────

    # R21 — Missing Web Application Firewall (WAF)
    if asset.criticality_tag == "customer_portal" and _absent_or_partial(controls.waf):
        lef_add = 0.20
        contrib = sle_base * lef_add
        trace.append(RuleResult(
            rule_id="R21_WAF_PROTECTION_ABSENT",
            description=f"Web Application Firewall (WAF): {controls.waf}",
            contribution_inr=contrib,
            rule_tier="universal",
            reason="Exposed web application with missing/partial WAF → automated SQLi and XSS exploitation likelihood +20%",
        ))
        lef_accumulator += lef_add

    # R22 — Missing Zero Trust Network Access (ZTNA)
    if (asset.asset_type in ("Cloud Resource", "Workstation") or meta.get("remote_access")) and _absent_or_partial(controls.ztna):
        lef_add = 0.15
        contrib = sle_base * lef_add
        trace.append(RuleResult(
            rule_id="R22_ZERO_TRUST_ABSENT",
            description=f"Zero Trust Network Access (ZTNA): {controls.ztna}",
            contribution_inr=contrib,
            rule_tier="universal",
            reason="Absence of ZTNA micro-segmentation allows unchecked post-breach perimeter hop. LEF +15%",
        ))
        lef_accumulator += lef_add

    # R23 — Missing SIEM & 24/7 Security Operations
    if _absent_or_partial(controls.siem):
        trace.append(RuleResult(
            rule_id="R23_SIEM_SOC_TELEMETRY_ABSENT",
            description=f"SIEM & 24/7 SOC Telemetry: {controls.siem}",
            contribution_inr=sle_base * 0.25,
            rule_tier="universal",
            reason="Without centralized SIEM, median dwell time exceeds 200 days per Mandiant benchmarks. SLE multiplier ×1.25",
        ))
        sle_multiplier *= 1.25

    # R24 — Missing Incident Response Plan (IRP)
    if _absent_or_partial(controls.incident_response_plan):
        trace.append(RuleResult(
            rule_id="R24_INCIDENT_RESPONSE_ABSENT",
            description=f"Incident Response Plan (IRP): {controls.incident_response_plan}",
            contribution_inr=sle_base * 0.20,
            rule_tier="universal",
            reason="Lack of formal IRP delays containment by 35% → escalating forensic cleanup costs. SLE multiplier ×1.20",
        ))
        sle_multiplier *= 1.20

    # R25 — Missing Annual Red Teaming & VAPT
    if _absent_or_partial(controls.penetration_testing):
        trace.append(RuleResult(
            rule_id="R25_VAPT_ANNUAL_TESTING_ABSENT",
            description=f"Annual Red Team & VAPT: {controls.penetration_testing}",
            contribution_inr=sle_base * 0.15,
            rule_tier="universal",
            reason="No regular penetration testing leaves critical architectural blindspots unexposed. SLE multiplier ×1.15",
        ))
        sle_multiplier *= 1.15

    # R26 — Cloud Misconfiguration Risk (No CSPM)
    if asset.asset_type == "Cloud Resource" and _absent_or_partial(controls.cspm):
        lef_add = 0.18
        contrib = sle_base * lef_add
        trace.append(RuleResult(
            rule_id="R26_CONTAINER_CSPM_MISCONFIG",
            description=f"Cloud Security Posture Management (CSPM): {controls.cspm}",
            contribution_inr=contrib,
            rule_tier="universal",
            reason="Unmonitored cloud workloads suffer IAM privilege escalation & public bucket exposures. LEF +18%",
        ))
        lef_accumulator += lef_add

    # R29 — CERT-In 6-Hour Reporting Mandate Compliance Risk
    if any(v.cvss_score and v.cvss_score >= 8.5 for v in vulns) and _absent_or_partial(controls.siem):
        fixed_additions += 1_000_000
        trace.append(RuleResult(
            rule_id="R29_CERT_IN_6HR_REPORTING_MANDATE",
            description="High-severity exploitability without automated detection — CERT-In 6h reporting liability",
            contribution_inr=1_000_000,
            rule_tier="universal",
            reason="CERT-In Directions 2022 mandate cyber incident reporting within 6 hours. Undetected breach creates ₹10 lakh statutory penalty liability.",
        ))

    # R30 — Cyber Insurance Recovery Offset
    insurance_offset = 1.0
    if controls.cyber_insurance == "present":
        insurance_offset = 0.65  # 35% insurance claim recovery
        trace.append(RuleResult(
            rule_id="R30_CYBER_INSURANCE_RECOVERY_OFFSET",
            description="Active Cyber Insurance Policy detected: risk transfer credit applied",
            contribution_inr=-(sle_base * 0.35),
            rule_tier="universal",
            reason="Commercial cyber insurance policy transfers first-party business interruption losses. Recovery factor ×0.65.",
        ))


    # ── Final EAL Computation ─────────────────────────────────────────────────
    # EAL = (SLE_base × SLE_multiplier × LEF_accumulator) + fixed_additions
    lef_final = min(lef_accumulator, 0.95)  # cap at 95% annual probability
    eal = ((sle_base * sle_multiplier * lef_final) + fixed_additions) * insurance_offset
    eal = max(eal, 0.0)

    return EngineOutput(
        expected_annual_loss_inr=round(eal, 2),
        rule_trace=trace,
    )


def compute_sheet_risk(asset_outputs: list[EngineOutput]) -> float:
    """Roll up per-asset EALs to a sheet total (simple sum — correlation handled by Correlation Agent)."""
    return round(sum(o.expected_annual_loss_inr for o in asset_outputs), 2)
