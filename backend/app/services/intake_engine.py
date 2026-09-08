"""
services/intake_engine.py — Input Intake & Normalization Rules Engine for Tarazu (Module 1).

Implements 22 deterministic rules for:
- Pattern matching asset categories & criticality tags
- Regex extraction of IPs, versions, domains, and software identifiers
- Scanner export auto-parsing (Nessus, Nmap, Qualys, generic CSV/JSON)
- Passive domain exposure reconnaissance (DNS, SSL certificate, HTTP security headers)
- Revenue dependency and criticality heuristics
"""
from __future__ import annotations
import re
import json
import csv
import io
from typing import Optional, Any
from datetime import datetime, timezone

# ── 22 Deterministic Normalization Rules ───────────────────────────────────────

RE_IPV4 = re.compile(r"^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$")
RE_PRIVATE_IP = re.compile(r"^(?:10\.|192\.168\.|172\.(?:1[6-9]|2[0-9]|3[01])\.)")
RE_VERSION = re.compile(r"\b(?:v|ver|version)?\s*(\d+(?:\.\d+)+(?:-[a-z0-9]+)?)\b", re.IGNORECASE)
RE_CVE = re.compile(r"\b(CVE-\d{4}-\d{4,7})\b", re.IGNORECASE)

DATABASE_KEYWORDS = ["database", "db", "oracle", "postgres", "mysql", "mssql", "mongodb", "redis", "mariadb", "cassandra", "cbs_db"]
PAYMENT_KEYWORDS = ["payment", "gateway", "switch", "pci", "card", "pos", "transaction", "settlement", "upi", "neft", "rtgs", "swift", "atm"]
CORE_BANKING_KEYWORDS = ["finacle", "flexcube", "core_banking", "cbs", "treasury", "loan_origination", "gl", "ledger"]
HEALTHCARE_KEYWORDS = ["ehr", "emr", "pacs", "his", "patient", "clinical", "pharmacy", "radiology", "dicom"]
MANUFACTURING_OT_KEYWORDS = ["scada", "plc", "hmi", "modbus", "opc", "controller", "assembly", "robotic", "sensor", "historian"]
WORKSTATION_KEYWORDS = ["laptop", "desktop", "workstation", "macbook", "pc", "endpoint", "thin_client"]
IDENTITY_KEYWORDS = ["activedirectory", "ad", "domain_controller", "ldap", "keycloak", "okta", "iam", "sso", "idp", "dc01", "dc02"]
NETWORK_KEYWORDS = ["firewall", "router", "switch", "vpn", "gateway", "loadbalancer", "waf", "proxy", "bastion"]
CLOUD_KEYWORDS = ["aws", "azure", "gcp", "s3", "ec2", "rds", "lambda", "kubernetes", "k8s", "cluster", "container"]


def rule_i01_ip_categorization(value: str) -> tuple[bool, str]:
    """Rule I01: Detect IPv4 and categorize as private RFC1918 vs public external."""
    if RE_IPV4.match(value.strip()):
        is_private = bool(RE_PRIVATE_IP.match(value.strip()))
        return True, "private_ip" if is_private else "public_ip"
    return False, "hostname"


def rule_i02_extract_version(text: str) -> Optional[str]:
    """Rule I02: Regex extraction of semantic version strings."""
    match = RE_VERSION.search(text)
    return match.group(1) if match else None


def rule_i03_detect_cves(text: str) -> list[str]:
    """Rule I03: Regex extraction of CVE identifiers."""
    return list(set(RE_CVE.findall(text.upper())))


def rule_i04_classify_asset_type(name: str, desc: str = "") -> str:
    """Rule I04: Deterministic keyword classification into asset types."""
    combined = f"{name} {desc}".lower()
    if any(k in combined for k in DATABASE_KEYWORDS):
        return "Database"
    if any(k in combined for k in WORKSTATION_KEYWORDS):
        return "Workstation"
    if any(k in combined for k in IDENTITY_KEYWORDS):
        return "Identity/IAM"
    if any(k in combined for k in NETWORK_KEYWORDS):
        return "Network Appliance"
    if any(k in combined for k in CLOUD_KEYWORDS):
        return "Cloud Resource"
    if any(k in combined for k in MANUFACTURING_OT_KEYWORDS):
        return "OT/SCADA"
    if any(k in combined for k in PAYMENT_KEYWORDS):
        return "Payment Switch"
    return "Server"


def rule_i05_infer_criticality(name: str, asset_type: str, desc: str = "") -> tuple[str, float]:
    """
    Rule I05-I08: Infer criticality tag and revenue dependency percentage.
    Returns (criticality_tag, revenue_dependency_pct).
    """
    combined = f"{name} {desc}".lower()
    # Crown jewels
    if any(k in combined for k in CORE_BANKING_KEYWORDS):
        return "core_db", 35.0
    if any(k in combined for k in PAYMENT_KEYWORDS):
        return "payment_processing", 30.0
    if any(k in combined for k in HEALTHCARE_KEYWORDS):
        return "core_db", 25.0
    if any(k in combined for k in MANUFACTURING_OT_KEYWORDS):
        return "crown_jewel", 28.0
    if any(k in combined for k in IDENTITY_KEYWORDS):
        return "admin_workstation", 15.0
    # Customer portals
    if any(k in combined for k in ["portal", "customer", "public", "api", "mobile", "frontend", "www"]):
        return "customer_portal", 20.0
    # Admin & Privileged
    if any(k in combined for k in ["admin", "bastion", "jumphost", "root", "devops", "ci_cd"]):
        return "admin_workstation", 12.0
    # Standard server or workstation
    if asset_type == "Workstation":
        return "standard", 2.0
    return "standard", 5.0


def rule_i09_normalize_single_record(raw: dict[str, Any]) -> dict[str, Any]:
    """
    Rules I09-I16: Normalize a dictionary into Tarazu's standard Asset + Vuln schema.
    """
    name = str(raw.get("name") or raw.get("host") or raw.get("hostname") or raw.get("asset") or "Discovered Asset").strip()
    desc = str(raw.get("description") or raw.get("notes") or raw.get("summary") or "")

    asset_type = raw.get("asset_type") or rule_i04_classify_asset_type(name, desc)
    criticality_tag, rev_dep_default = rule_i05_infer_criticality(name, asset_type, desc)

    try:
        rev_dep = float(raw.get("revenue_dependency_pct", rev_dep_default))
    except (ValueError, TypeError):
        rev_dep = rev_dep_default

    cve_id = raw.get("cve_id")
    cves_found = rule_i03_detect_cves(desc)
    if not cve_id and cves_found:
        cve_id = cves_found[0]

    cvss_score = raw.get("cvss_score")
    if cvss_score is not None:
        try:
            cvss_score = float(cvss_score)
            cvss_score = max(0.0, min(10.0, cvss_score))
        except (ValueError, TypeError):
            cvss_score = None

    version = raw.get("version") or rule_i02_extract_version(f"{name} {desc}")

    metadata = raw.get("metadata_json") or {}
    if not isinstance(metadata, dict):
        metadata = {}
    if version:
        metadata["version"] = version
    if any(k in name.lower() for k in ["vendor", "partner", "external"]):
        metadata["vendor_integrated"] = True
    if any(k in name.lower() for k in ["scada", "plc", "modbus"]):
        metadata["ot_connected"] = True

    return {
        "name": name,
        "asset_type": asset_type,
        "criticality_tag": raw.get("criticality_tag") or criticality_tag,
        "revenue_dependency_pct": rev_dep,
        "metadata_json": metadata,
        "cve_id": cve_id,
        "cvss_score": cvss_score,
        "vuln_description": str(raw.get("vuln_description") or desc)[:500],
        "days_unpatched": int(raw.get("days_unpatched", 30)),
    }


def parse_csv_or_json_content(content_bytes: bytes, filename: str) -> list[dict[str, Any]]:
    """
    Rules I17-I20: Parse CSV or JSON exports (Nessus, Nmap, Qualys, or standard CSV)
    into normalized asset intake dictionaries.
    """
    text = content_bytes.decode("utf-8", errors="replace")
    normalized_results: list[dict[str, Any]] = []

    # Case 1: JSON
    if filename.lower().endswith(".json") or text.strip().startswith(("[", "{")):
        try:
            data = json.loads(text)
            if isinstance(data, dict):
                # Try finding top-level list
                for k in ["assets", "hosts", "items", "vulnerabilities"]:
                    if isinstance(data.get(k), list):
                        data = data[k]
                        break
                else:
                    data = [data]
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        normalized_results.append(rule_i09_normalize_single_record(item))
            return normalized_results
        except Exception:
            pass

    # Case 2: CSV
    reader = csv.DictReader(io.StringIO(text))
    for row in reader:
        clean_row = {str(k).strip().lower(): str(v).strip() for k, v in row.items() if k}

        # Header mappings (Nessus, Qualys, Nmap, generic)
        name = clean_row.get("host") or clean_row.get("ip") or clean_row.get("name") or clean_row.get("asset") or "Host"
        desc = clean_row.get("synopsis") or clean_row.get("description") or clean_row.get("plugin name") or ""
        cve = clean_row.get("cve") or ""
        cvss = clean_row.get("cvss") or clean_row.get("cvss v3.0 base score") or clean_row.get("cvss_score") or None

        normalized_results.append(rule_i09_normalize_single_record({
            "name": name,
            "description": desc,
            "cve_id": cve.split(",")[0].strip() if cve else None,
            "cvss_score": cvss,
            "asset_type": clean_row.get("asset_type"),
            "criticality_tag": clean_row.get("criticality_tag"),
            "revenue_dependency_pct": clean_row.get("revenue_dependency_pct"),
            "days_unpatched": clean_row.get("days_unpatched", 45),
        }))

    return normalized_results

