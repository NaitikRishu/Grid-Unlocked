# Grid-Unlocked: Intelligent Traffic Mitigation & What-If Planner
### Concept Note & Architectural Guide

Grid-Unlocked is an intelligent traffic simulation and operations dashboard built for Bengaluru. It combines historical incident logs, spatial road networks, machine learning duration predictions, and graph propagation algorithms to allow municipal planners and traffic police officers to test and optimize traffic mitigation scenarios before deploying them on the streets.

---

## 1. High-Level Architecture

The system is split into three main components:
1. **React Frontend (Vite)**: An interactive operations dashboard displaying Bengaluru wards, incidents, and dynamic routing instructions using Leaflet maps.
2. **Node.js/Express Server**: A proxy gateway and WebSocket server that handles real-time animation replay streaming.
3. **FastAPI Backend (Python)**: The core algorithmic engine containing the Machine Learning models, road graph network routing, and resource allocation solvers.

```text
+-----------------------+           +-----------------------+           +-----------------------+
|    React Frontend     |           |     Express Proxy     |           |    FastAPI Backend    |
| (Interactive Map UI)  | <=======> |  (HTTP API / Replay)  | <=======> | (Inference & Routing) |
|   (Leaflet / React)   |           |    (Port 3001 / WS)   |           |    (Port 8000 / ML)   |
+-----------------------+           +-----------------------+           +-----------------------+
            ^                                                                       |
            |                                                                       v
            |                                                             +------------------+
            +====================== (Direct API Calls) ================== |  bengaluru_graph |
                                                                          |   events_clean   |
                                                                          |   Random Forest  |
                                                                          +------------------+
```

---

## 2. Core Datasets & Graph Layer

- **`bengaluru_graph.pkl`**: A NetworkX directed MultiDiGraph containing Bengaluru's road network, parsed using OSMnx. It maintains the nodes (intersections) and edges (streets with lengths, geometries, and travel weights).
- **`bengaluru_zones.geojson`**: A GeoJSON file containing coordinates and boundaries for the 243 municipal wards (BBMP zones) of Bengaluru.
- **`events_clean.csv`**: A cleaned registry of historical incident logs, categorised by cause (breakdown, accident, waterlogging, etc.), priority (low, medium, high), duration, and ward.
- **`violations_clean.csv`**: A log of 7-day traffic violation densities across major junctions, mapped as a heatmap.

---

## 3. The Backend Engines (FastAPI)

### A. Machine Learning Prediction (`inference.py`)
When a planned or unplanned event is created:
1. The backend snaps the latitude and longitude coordinates to the nearest road network node.
2. It extracts temporal features (hour, day of week, month, peak hour flag) and spatial features (historical average duration of incidents in that ward, violation density).
3. The pre-loaded Random Forest model predicts a **Baseline Congestion Score** (from 0 to 100) indicating the congestion severity.

### B. What-If Simulation Algorithms (`event_simulator.py`)
Planners can adjust slide parameters to test mitigation interventions. The engine computes these changes in real-time:
1. **Manpower Effect**: Police officers deployment dampens the congestion score linearly:
   $$\text{Congestion Score} = \text{Score} \times (1.0 - \text{Police Officers} \times 0.012)$$
   Deploying 50 police officers cuts congestion by up to 60%.
2. **Barricade Squeezing**: Barricades restrict the spatial propagation radius of the congestion around the epicenter:
   $$\text{Radius} = 500\text{ meters} - \text{Barricades} \times 20\text{ meters}$$
   Deploying 20 barricades squeezes the impact radius down from 500m to 100m.
3. **Congestion Propagation**: An exponential decay formula propagates the residual congestion score from the incident epicenter outward through the road network to surrounding zones. Neighboring wards are colored (Green -> Yellow -> Red) based on proximity.
4. **Diversion Routing**: If "Activate Diversion Routes" is enabled:
   - The engine identifies all road segments (edges) within the congested radius and labels them as **ROAD CLOSED**.
   - It runs Dijkstra shortest-path calculations to find 3 distinct alternate paths bypassing the closed segments.
   - The fastest alternate path is marked in **GREEN**, and the closed road segments are marked in **RED**.

### C. Smart Recommendation Solver
Instead of manual sliders, planners can click **💡 Auto-Recommend**:
1. It solves for the minimal manpower required to reduce the predicted congestion score below a safe threshold of `40.0`.
2. It tests scheduling shifts (offsets like -60, -30, +30, +60 minutes) to see if moving the start time avoids peak hours and lowers congestion.
3. It scans historical events in the same ward to match similar past events (e.g. past waterlogging or breakdowns) so officers have operational references.

---

## 4. Visualizing on the Operations Map

- **Wards (Zone Choropleth)**: Colored according to simulated congestion scores. Wards colored deep red have the highest propagated traffic impact.
- **Floating Pill Badges**: 
  - **`🚧 BARRICADE (CLOSED)`** (Red): Positioned exactly at the start of the blocked streets.
  - **`🔀 DIVERSION (DETOUR) ➔`** (Green): Positioned at the turn-off intersection showing police where to direct detour traffic.
- **Simulation Results Card**: Shows the planner exactly how much delay is saved (e.g. *Saves 35 minutes*) and the exact police/barricade dispatch counts by ward.
