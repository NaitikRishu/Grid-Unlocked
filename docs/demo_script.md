# Grid Unlocked: Executive Demo Walkthrough Script
### Senior-Level Presenter Guidance & System Walkthrough

This script is designed for a **10-minute executive presentation** or evaluator walkthrough of the **Grid Unlocked** platform. It demonstrates the transition from reactive dispatch to proactive spatial computation.

---

## Roles
* **Presenter**: Explains the mathematical and algorithmic foundations.
* **Driver / Operator**: Interacts with the dashboard interface live.

---

## Demo Walkthrough

### Part 1: Operational Baseline & Live Spatial View (2 mins)
* **Presenter Voiceover**:
  > *"Welcome. Grid Unlocked is our spatio-temporal traffic intelligence platform designed for Bengaluru. On screen, you see the active municipal wards of Bengaluru represented as a live choropleth map. The color coding maps directly to baseline ward congestion, computed by merging raw historical incidents with localized junction violation densities."*
* **Driver Action**:
  * Hover over different municipal wards (such as *Indiranagar*, *Koromangala*, or *HSR Layout*) to show the tooltips displaying ward names and baseline scores.
  * Toggle the map layer switches in the top-right corner to show how the **Heatmap** (traffic violation points) and **Events** layers can be isolated to prevent cognitive overload for dispatchers.

---

### Part 2: Incident Selection & Historical Replay Analysis (2 mins)
* **Presenter Voiceover**:
  > *"When an incident occurs—such as major waterlogging or a heavy vehicle breakdown—our system snapped it to the nearest intersection in the Bengaluru street graph. Let us select a historical high-impact event to analyze its footprint."*
* **Driver Action**:
  * Click on a red event marker on the map.
  * Point to the sidebar results card showing the **Predicted Incident Duration** (computed by our Random Forest model) and the **Calibrated Risk Assessment Gauge** (showing LOW, MEDIUM, or CRITICAL risk index).
  * Click the **PLAY** button on the bottom timeline scrubber. Watch the ward colors decay dynamically as the playback progresses from peak intensity ($T+0\text{m}$) to baseline clearance ($T+60\text{m}$).

---

### Part 3: What-If Simulation & Policy Interventions (3 mins)
* **Presenter Voiceover**:
  > *"Now, let's step into the shoes of a traffic commander. If we deploy resources immediately, how does the grid respond? We will run a What-If simulation by placing resources and testing policy parameters."*
* **Driver Action**:
  * Turn on the **"Simulate custom incident / intervention"** mode.
  * Drag the **Police Dispatch Slider** to 30. Point to the HUD showing the expected delay saved and the reduction in ward congestion scores.
  * Drag the **Barricade Slider** to 10. Show how the recommended barricade placement pins appear on the map.
  * Click directly on one of the **Orange recommended barricade pins** on the map. Watch it turn **Red (Deployed)**, representing active containment. Point out that the sidebar slider incremented automatically.

---

### Part 4: Dynamic Dijkstra Detour Routing (2 mins)
* **Presenter Voiceover**:
  > *"By activating diversions, our computational engine masks the congested street edges in the directed graph with a travel-time penalty. It then solves Dijkstra's shortest-path equation in real-time to compute detours bypassing the bottleneck."*
* **Driver Action**:
  * Check the **"Activate Diversion Routes"** checkbox.
  * Point to the map showing the **Cyan (Primary Alternate Path)**, **Orange (Secondary Alternate Path)**, and **Red (Closed Congested Path)**.
  * Point to the **HUD Route Comparison Chart** at the bottom of the results panel. Highlight the relative efficiency bars, the dynamically calculated average speed improvements (e.g. $+30\%$ speed with Signal Optimization), and the CO₂ emission savings.

---

### Part 5: Optimization Recommendation & Outcome Logging (1 min)
* **Presenter Voiceover**:
  > *"Rather than relying on manual trial-and-error, dispatchers can leverage the Smart Recommendation Solver. The platform solves for the minimum manpower required to drop congestion below a safe threshold, and searches historical patterns for similar occurrences to serve as operational evidence."*
* **Driver Action**:
  * Click the **💡 Auto-Recommend** button in the sidebar. Explain the recommended police and barricade dispatch numbers that appear.
  * Scroll down to the **Supporting Evidence Table** to show the top 3 similar historical matches.
  * Go to the **Log Actual Outcome Form** at the bottom. Input actual dispatch metrics, write a note (e.g., *"Event resolved 15 mins ahead of schedule"*), and click **Submit Log**. Show the glowing success indicator.

---

* **Presenter Voiceover**:
  > *"Grid Unlocked merges spatio-temporal graphs, machine learning, and intuitive controls into a single, cohesive command system, ensuring Bengaluru's roads remain unlocked. Thank you."*
