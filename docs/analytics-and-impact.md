# Analytics and Impact Map

Tarazu offers two deeply visual ways to understand risk: The **Advisor Analytics** engine and the **Blast Radius (Impact Map)**.

## AI Security Advisor Analytics (Pillar 3)

The Advisor view translates raw telemetry into Board-ready metrics using `recharts`.

### Key Metrics & Charts
- **Total Exposure / Risk Reduction:** Shows the net Return on Security Investment (ROSI) in the chosen currency if suggested controls are implemented.
- **Risk Distribution Shift (Donut/Pie):** Compares the percentage of Critical, High, Medium, and Low assets.
- **Top 5 Assets by Financial Impact (Bar):** Sorts the highest contributing Expected Annual Loss (EAL) assets.
- **Exposure by Department (Bar):** Groups risk by logical Sheets to identify the most financially vulnerable business units.
- **Asset Concentration (Bar):** Maps the physical density of assets across business units.

### Global Interactivity
All charts automatically react to the Global **Currency** state. If the user swaps to USD, the Y-axes and Tooltips of all Bar and Area charts format the ticks gracefully.

---

## Blast Radius / Impact Map (Pillar 2)

The Blast Radius is an interactive 2D physics engine built on `react-force-graph-2d`. It visually maps how an isolated technical failure cascades into a business loss.

### Visual Encodings
- **Node Size:** Corresponds to the asset's financial criticality (`revenue_dependency_pct`). Massive core banking databases appear larger than individual workstations.
- **Node Color:** Corresponds to the asset's real-time risk score status:
  - `emerald`: Healthy
  - `amber`: Warning
  - `crimson`: Critical
  - `slate`: Offline/Disabled
- **Edges (Links):** Directional arrows showing the path of dependency.
- **Particle Animations:** Moving particles flow along the edges to demonstrate the direction of data/revenue. This is not arbitrary animation; it maps strictly to the backend `DEPENDENCY` relationships.

### Interactions
- Clicking a node opens a side panel detailing its properties, vulnerabilities, and downstream dependents.
- Hovering over a node highlights its direct neighborhood, dimming the rest of the topology to prevent visual noise in large architectures.
