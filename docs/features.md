# Features

Tarazu provides a rich suite of capabilities designed to map, quantify, and mitigate cyber risk from a financial perspective.

## 1. Global Dashboard
A high-level overview of the selected organization's cyber posture.
- Displays Total Expected Annual Loss (EAL).
- Highlights critical vulnerabilities and offline assets.
- Provides compliance score summaries (e.g., RBI CSF, ISO 27001).

## 2. Organization Isolation
- **Feature:** Seamlessly toggle between multiple organizations in the top-left menu.
- **Why it exists:** To demonstrate the application's ability to scale perfectly from massive enterprises (Suraksha Finance) to small businesses (FreshBites Bakery).

## 3. Pillar 1: Risk Overview
- A comparative visualization area for structural metrics.
- Shows asset types, risk severity distributions, and top risks by raw score.

## 4. Pillar 2: Blast Radius (Impact Map)
- A highly interactive topology visualization using a 2D force graph.
- **Why it exists:** To visually demonstrate how an outage in an upstream service (like a core router) cascades to take down downstream revenue-generating services (like a Payment Gateway).

## 5. Pillar 3: AI Security Advisor
- Recharts-powered analytics providing board-ready visualizations.
- **Features:** 
  - Risk Distribution Shift charts.
  - Return on Security Investment (ROSI) optimization tracking.
  - Top 5 Assets by Financial Impact.
  - Departmental exposure concentrations.

## 6. What-If Scenario Simulator
- An advanced mathematical simulator to test security changes.
- **How it works:** Users can select predefined scenarios (e.g., "Enforce MFA on all accounts") or toggle specific assets to "offline". The engine calculates the precise mathematical change in Expected Annual Loss without double-counting shared dependencies.

## 7. Intelligent Document Processing
- Located in the "Platform Modules" tab.
- **Feature:** Upload PDFs, network scans, or SOC-2 reports to instantly extract missing controls, provision new assets, and calculate updated risk.

## 8. Currency & Timeline Controls
- Adjust global presentation metrics via the Tools/Settings tab. Converts all INR baselines to the chosen currency (e.g., USD, EUR).
