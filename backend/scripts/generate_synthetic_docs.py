import os
import csv
import json

base_dir = r"c:\Users\Lenovo\Desktop\Main\Projects\SIH_26105\synthetic-data"

def write_csv():
    # Asset Inventory
    path = os.path.join(base_dir, "Cloud_Asset_Inventory_Q3.csv")
    with open(path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Asset Name", "Type", "Status", "Criticality", "Owner", "IP"])
        writer.writerow(["prod-db-cluster-01", "Database", "Running", "High", "Data Team", "10.0.1.45"])
        writer.writerow(["auth-service-api", "API", "Running", "Critical", "Security Team", "10.0.1.12"])
        writer.writerow(["marketing-site", "Web App", "Running", "Low", "Marketing", "10.0.2.100"])
        writer.writerow(["internal-wiki", "Web App", "Stopped", "Low", "IT", "10.0.2.101"])
        writer.writerow(["payment-gateway", "Service", "Running", "Critical", "Payments", "10.0.1.25"])
        writer.writerow(["legacy-crm", "Web App", "Running", "Medium", "Sales", "10.0.3.50"])
        writer.writerow(["analytics-queue", "Queue", "Running", "Medium", "Data Team", "10.0.3.51"])
        writer.writerow(["backup-storage", "Storage", "Running", "High", "IT", "10.0.4.10"])

def write_txt():
    # Network Architecture Scan
    path = os.path.join(base_dir, "Network_Architecture_Scan.txt")
    content = """SCAN REPORT - 2026-09-15
TARGET: INTERNAL CORPORATE NETWORK

[Discovered Assets]
- 10.0.5.21 (Hostname: core-router-sw1, Type: Network Device)
- 10.0.5.22 (Hostname: vpn-gateway-primary, Type: Network Device)
- 10.0.6.10 (Hostname: hr-system-db, Type: Database)
- 10.0.6.15 (Hostname: employee-portal, Type: Web App)

[Vulnerabilities Detected]
- 10.0.6.10: Exposed port 5432 (PostgreSQL). Missing security patches for CVE-2023-XXXX.
- 10.0.5.22: Outdated SSL certificate.

[Dependencies]
- employee-portal depends on hr-system-db
- vpn-gateway-primary connects to core-router-sw1
"""
    with open(path, 'w') as f:
        f.write(content)

def write_json():
    # Vendor Security Compliance
    path = os.path.join(base_dir, "Vendor_Security_Compliance.json")
    content = {
        "vendor": "Acme Cloud Services",
        "assessment_date": "2026-09-10",
        "overall_status": "Warning",
        "findings": [
            {
                "id": "F-01",
                "severity": "Medium",
                "description": "SOC2 Type II report expired.",
                "affected_services": ["auth-service-api"]
            },
            {
                "id": "F-02",
                "severity": "High",
                "description": "Lack of Multi-Factor Authentication on partner portal.",
                "affected_services": ["payment-gateway"]
            }
        ]
    }
    with open(path, 'w') as f:
        json.dump(content, f, indent=2)

def write_markdown():
    # Cyber Risk Assessment
    path = os.path.join(base_dir, "Cyber_Risk_Assessment_Q3.md")
    content = """# Q3 Cyber Risk Assessment Report

## Executive Summary
This document outlines the primary cyber risks identified during the Q3 audit.

## Extracted Policies
- **Access Control Policy (ACP-01)**: All administrative accounts must enforce MFA. Currently missing on `legacy-crm`.
- **Data Encryption (DEP-02)**: At-rest encryption is required for all databases. Verified on `prod-db-cluster-01`.

## Incident Risks
- Ransomware susceptibility is considered **High** due to unpatched endpoints in the branch offices.
- Supply chain risk is **Medium** following the Acme Cloud Services audit.

## Financial Impact Estimates
- A breach in the `auth-service-api` could result in an estimated downstream loss of ₹50M due to SLA penalties and downtime.
- Compliance violation for DEP-02 could trigger fines up to ₹15M.
"""
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def write_small_biz():
    # Asset Inventory
    path = os.path.join(base_dir, "small_bakery_inventory.csv")
    with open(path, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Asset Name", "Type", "Status", "Criticality", "Owner", "IP"])
        writer.writerow(["POS Terminal (Front Desk)", "Workstation", "Running", "High", "Store Manager", "192.168.1.10"])
        writer.writerow(["Store Wi-Fi Router", "Network Device", "Running", "Medium", "IT Support", "192.168.1.1"])
        writer.writerow(["Owner Laptop", "Workstation", "Running", "Medium", "Owner", "192.168.1.15"])
        writer.writerow(["CCTV Camera System", "Network Device", "Running", "Low", "Security", "192.168.1.20"])
        writer.writerow(["Inventory Tablet", "Workstation", "Running", "Medium", "Staff", "192.168.1.12"])
        
    # Risk Register
    path_risk = os.path.join(base_dir, "small_bakery_risk_register.csv")
    with open(path_risk, 'w', newline='') as f:
        writer = csv.writer(f)
        writer.writerow(["Risk ID", "Description", "Severity", "Affected Asset"])
        writer.writerow(["RSK-001", "Outdated OS on POS", "High", "POS Terminal (Front Desk)"])
        writer.writerow(["RSK-002", "Weak Default Password", "Medium", "Store Wi-Fi Router"])
        
    # Network Scan
    path_scan = os.path.join(base_dir, "small_bakery_network_scan.txt")
    scan_content = """FreshBites Bakery - Network Scan - Sept 2026
Hosts Found:
- 192.168.1.1 (Router - Port 80 Open)
- 192.168.1.10 (POS - Port 443 Open)
- 192.168.1.20 (CCTV - Port 554 Open - Warning: RTSP Auth Disabled)
"""
    with open(path_scan, 'w') as f:
        f.write(scan_content)

if __name__ == "__main__":
    write_csv()
    write_txt()
    write_json()
    write_markdown()
    write_small_biz()
    print("Generated synthetic data.")
