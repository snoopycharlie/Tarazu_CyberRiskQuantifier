import asyncio
import httpx

async def test():
    async with httpx.AsyncClient(base_url="http://127.0.0.1:8000", timeout=30.0) as client:
        # 1. Health
        r = await client.get("/health")
        print("Health:", r.status_code, r.json())

        # 2. Get Org
        r = await client.get("/api/organizations")
        orgs = r.json()
        target_org = next((o for o in orgs if "Suraksha" in o["name"]), orgs[0])
        org_id = target_org["id"]
        print("Org fetched:", target_org["name"], org_id)

        # 3. Dashboard summary with 5 statistics
        r = await client.get(f"/api/reports/dashboard/{org_id}")
        dash = r.json()
        print("Dashboard EAL:", dash["total_eal_inr"])
        print("Top 5 Risky Assets Count:", len(dash["top_risky_assets"]))
        print("Top 5 ROI Controls Count:", len(dash["top_roi_controls"]))
        print("Compliance Overview Count:", len(dash["compliance_overview"]))
        print("Risk Trend Points:", len(dash["risk_trend"]))
        print("Incident Cost Breakdown:", dash["incident_cost_breakdown"]["total_exposure_inr"])
        print("Peer Benchmark:", dash["peer_benchmark"]["sector"], "|", dash["peer_benchmark"]["benchmark_status"])

        # 4. CISO QA
        r = await client.post("/api/reports/ciso-qa", json={"org_id": org_id, "query": "What is our regulatory penalty exposure under DPDP Act?"})
        print("CISO QA status:", r.status_code)
        print("CISO QA answer preview:", r.json()["answer"][:120], "...")

        # 5. Intake Conversational
        r = await client.post("/api/assets/intake/conversational", json={"text": "We host our corporate payment gateway on 10.0.4.15 running Nginx 1.18.0 with open port 443 which is internet facing and handles 30% of revenue."})
        print("Conversational intake status:", r.status_code)
        intake_res = r.json()
        print("Parsed assets count:", len(intake_res["assets"]))
        if intake_res["assets"]:
            print("Extracted asset:", intake_res["assets"][0]["name"], "| Criticality:", intake_res["assets"][0]["criticality_tag"])

        # 6. Compliance 8 frameworks
        frameworks = ["ISO27001", "NIST_CSF", "CIS_CONTROLS", "RBI_CSF", "SEBI_CSCRF", "HIPAA", "PCI_DSS", "GDPR_DPDPA"]
        for fw in frameworks:
            r = await client.get(f"/api/compliance/{fw}?org_id={org_id}")
            c_data = r.json()
            print(f"Compliance {fw}: {c_data['satisfied']}/{c_data['total_clauses']} clauses ({c_data['coverage_pct']}%)")

if __name__ == "__main__":
    asyncio.run(test())
