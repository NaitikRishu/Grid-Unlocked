---
marp: true
theme: gaia
_class: lead
paginate: true
backgroundColor: #050b18
color: #f0f2f5
style: |
  section {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    padding: 40px;
    background: radial-gradient(circle at 10% 20%, #081326 0%, #050b18 100%);
  }
  h1 {
    color: #00f0ff;
    font-weight: 800;
    text-shadow: 0 0 10px rgba(0, 240, 255, 0.3);
  }
  h2 {
    color: #00f0ff;
    border-bottom: 2px solid rgba(0, 240, 255, 0.2);
    padding-bottom: 8px;
  }
  h3 {
    color: #ff9f0a;
  }
  footer {
    color: #5d6b83;
    font-size: 0.5em;
  }
  code {
    background: #0d1b2a;
    color: #00f0ff;
    border: 1px solid rgba(0, 240, 255, 0.2);
    border-radius: 4px;
  }
  .highlight {
    color: #00f0ff;
    font-weight: bold;
  }
  .warning {
    color: #ff3b30;
    font-weight: bold;
  }
  .accent {
    color: #ff9f0a;
    font-weight: bold;
  }
  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
  .text-small {
    font-size: 0.8em;
    line-height: 1.4;
  }
---

# GRID UNLOCKED
### Spatio-Temporal Traffic Intelligence & What-If Simulation Platform

**Senior-Level Engineering & Academic Evaluation Deck**
*A Graph-Theoretic, Machine Learning-Driven Approach to Bengaluru Traffic Mitigation*

Presented by: **Naitik Rishu**
Repository: [github.com/NaitikRishu/Grid-Unlocked](https://github.com/NaitikRishu/Grid-Unlocked)
Production: [grid-unlocked-backend-production.up.railway.app](https://grid-unlocked-backend-production.up.railway.app)

---

## 1. Executive Summary

Grid Unlocked is a **research-grade traffic simulation, predictive analytics, and real-time operations dashboard** designed for Bengaluru's municipal authorities. 

* **The Core Premise**: Move traffic management from reactive dispatch to *proactive computational planning*.
* **Key Innovations**:
  * **Incident Duration ML Predictor**: Gradient boosted and ensemble regression modeling of traffic clearance times.
  * **Spatio-Temporal Graph Propagation**: Graph-theoretic exponential decay modeling of incident congestion across Bengaluru's street networks.
  * **Dijkstra-Based Route Diversion**: Dynamic edge capacity penalty masking for computed detour paths.
  * **What-If Strategy Planner**: Real-time simulation of police dispatch, physical barricades, and peak-hour time offsets.

---

## 2. System Architecture

A robust, three-tier microservice architecture designed for sub-second database queries and live WebSockets.

```
       +--------------------------------------------------------+
       |             Interactive React Frontend (Vite)          |
       |      Leaflet MAP UI | Zustand Store | Canvas Rendering |
       +--------------------------------------------------------+
                                   ^
                                   | HTTP API / WebSockets
                                   v
       +--------------------------------------------------------+
       |             Node.js / Express Proxy Gateway            |
       |      Route Proxying | ws:// Replay Server | CORS       |
       +--------------------------------------------------------+
                                   ^
                                   | Local Loopback (Sub-ms)
                                   v
       +--------------------------------------------------------+
       |             FastAPI Computational Backend              |
       |  NetworkX routing | ML Inference | Simulator Engines   |
       +--------------------------------------------------------+
```

---

## 3. Data Processing & Geographic snappers

Grid Unlocked relies on highly cleaned, spatially-snapped historical dataset matrices.

* **Raw Ingestion**: Parsing of 7-day incident registries (`events.csv`) and violation densities (`violations.csv`).
* **Geographic Layer**: 
  * Directed graph of Bengaluru parsed via `OSMnx` (`bengaluru_graph.pkl`) maintaining $N \approx 50,000$ intersection nodes and $E \approx 120,000$ street edges.
  * 243 ward geometries integrated using GeoJSON spatial polygon arrays (`bengaluru_zones.geojson`).
* **Spatial snapping**:
  * Points of interest snapped to the nearest road network node $v \in V$ using MapmyIndia Snap-to-Road API with a fallback to Haversine bounding boxes.
  * Spatial join mapping of events to their containing municipal ward polygons.

---

## 4. ML Pipeline: Incident Duration Prediction

Predicting the temporal impact of incidents using ensemble models.

<div class="grid-2">
<div>

### Feature Matrix Construction
* **Temporal Features**: Hour of day, day of week, seasonal metrics, peak hour flags (morning vs. evening peak).
* **Spatial Features**: Historical ward incident averages, local violation density, road class (trunk vs. residential).
* **Target Variable**: Incident duration (minutes).
</div>
<div>

### Modeling & Metrics
* **Algorithms**: Random Forest Regressor & XGBoost Ensemble.
* **Accuracy Threshold**: Optimized using hyperparameter search to minimize RMSE and MAE.
* **Inference Latency**: FastAPI inference pipeline executes in **< 15ms**, allowing real-time parameter tweaking.
</div>
</div>

---

## 5. Spatio-Temporal Congestion Propagation

Incidents do not exist in isolation; congestion spills over into adjacent zones. Grid Unlocked models this propagation mathematically.

Let the incident epicenter be at node $v_0$ in ward $W_0$. The baseline congestion score of the epicenter ward is $S_{\text{peak}}$. 

For any ward $W_i$, we compute its propagated score $S(W_i)$ based on graph geodesic distance $d_G(W_0, W_i)$ through the street network:

$$S(W_i) = S_{\text{baseline}}(W_i) + (S_{\text{peak}} - S_{\text{baseline}}(W_0)) \times e^{-\lambda \cdot d_G(W_0, W_i)}$$

* $\lambda$ is the **spatial decay constant** (calibrated to $0.15$).
* $d_G$ is calculated using the shortest-path distance over the road graph edges rather than straight-line Euclidean distance, respecting natural geography.

---

## 6. What-If Simulation Engine

Urban planners can slide controls to dynamically apply and visualize mitigation strategies.

### A. Linear Police Dampening
Police presence at intersections accelerates bottleneck clearing, reducing local congestion score:
$$S_{\text{mitigated}} = S_{\text{base}} \times (1.0 - \alpha \times P)$$
*Where $P$ is the number of dispatched officers, and dampening factor $\alpha = 0.012$.*

### B. Barricade Radius Squeezing
Physical barricades block traffic from entering congested side-streets, squeezing the spatial radius $R$ of propagation:
$$R_{\text{effective}} = R_{\text{max}} - (\beta \times B)$$
*Where $B$ is the number of barricades, and squeezing factor $\beta = 20\text{ meters}$.*

---

## 7. Dynamic Graph-Based Routing & Detours

When "Activate Diversions" is triggered, the routing engine runs live detour calculations.

<div class="grid-2">
<div>

### Edge Capacity Masking
1. The simulator identifies all edges $e = (u,v)$ in the graph falling within the congested radius $R_{\text{effective}}$.
2. The weight of these edges (travel time) is multiplied by a penalty factor:
   $$W(e) = W(e) \times (1.0 + \gamma \times S_{\text{ward}})$$
   *Where $\gamma = 10.0$ for extreme congestion.*
</div>
<div>

### Dijkstra detours
1. Calculates 3 distinct paths from detour origin to destination over the modified weight matrix.
2. The UI renders the optimal alternative route in **Cyan**, the secondary in **Orange**, and the blocked route in **Red**.
3. Compares travel times and computes carbon emission reduction based on idle time models.
</div>
</div>

---

## 8. Smart Optimization Recommendation Solver

Instead of manual guessing, planners can execute the smart recommendation engine.

```
+-----------------------------------------------------------------+
|                        Auto-Recommend                           |
+-----------------------------------------------------------------+
                                |
                                v
                Minimize Manpower (P) subject to:
                S_mitigated(W_0) < Threshold (40.0)
                                |
                                v
               Evaluate Time Offsets (T + Delta)
               (Find T that minimizes baseline load)
                                |
                                v
              Fetch Top 3 Historical Ward Incidents
            (Pattern Matching on Ward & Incident Cause)
```

---

## 9. Elite Operations Control Center UI

A premium, high-contrast dark space dashboard design customized for rapid assessment.

<div class="grid-2">
<div>

* **Calibrated Risk Gauge**: A 20-segment colored block meter indicating LOW, MEDIUM, or CRITICAL risk based on incident severity index.
* **Interactive Map Barricades**: Orange recommendation pins rendered on map. Users click pins to physically deploy barricades, turning them red and updating the sidebar slider instantly.
</div>
<div>

* **Timeline Scrubber**: A playback scrubber allowing operators to visualize traffic dispersion over a 60-minute forecast window, built with stable color choropleth normalization.
* **Smart Resource dispatch**: Dedicated visual badges for Police (`IconShieldCheck`) and Barricades (`IconBarrierBlock`) dynamically rendered without text overflow.
</div>
</div>

---

## 10. Verification, Deployment & Reproducibility

Rigorous testing guarantees the system is production-ready and easily reproducible.

* **Automated Test Coverage**: Comprehensive suite testing API endpoints (`test_api_endpoints.py`), congestion algorithms, and websocket telemetry streams.
* **Production Pipeline**:
  * **Frontend**: Compiled statically via Vite and deployed to Netlify.
  * **Backend & Websockets**: Hosted on Railway with automatic Docker rebuilds.
  * **Spaces**: Pushed and synced to Hugging Face Spaces.
* **Evaluation ZIP Package**: A 40MB package containing pre-compiled NetworkX pickle files, processed databases, and a unified launcher (`./run_local.sh` and `run_local.bat`) to install dependencies and run all services with one command.

---

# GRID UNLOCKED
### Empowering Cities with Spatio-Temporal Intelligence

*Thank you! Questions?*

* **Repository**: [github.com/NaitikRishu/Grid-Unlocked](https://github.com/NaitikRishu/Grid-Unlocked)
* **Frontend**: [grid-unlocked-1782050398.netlify.app](https://grid-unlocked-1782050398.netlify.app)
* **Backend REST API**: [grid-unlocked-backend-production.up.railway.app/docs](https://grid-unlocked-backend-production.up.railway.app/docs)
