---
title: Grid Unlocked Backend
emoji: 🚦
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# Grid Unlocked: Predictive Traffic Twin and Control Room Simulator

Grid Unlocked is an analytical framework and real-time digital twin designed to model downstream traffic cascades and calculate dynamic, congestion-penalized detour routes around urban disruptions. The platform provides municipal dispatchers and traffic engineers with a sandbox environment to simulate policy interventions and coordinate resource dispatches.

---

## 1. System Architecture

The application is built on a decoupled, three-tier architecture:

```text
                  ┌──────────────────────────────┐
                  │    FastAPI Python Service    │
                  │ (Dijkstra, XGBoost Inference)│
                  │          Port 8000           │
                  └──────────────┬───────────────┘
                                 │ Proxy
                  ┌──────────────▼───────────────┐
                  │    Node.js Express Gateway   │
                  │  (WebSockets Replay Server)  │
                  │          Port 3001           │
                  └──────────────┬───────────────┘
                                 │ HTTP / WSS
                  ┌──────────────▼───────────────┐
                  │   Vite React Frontend App    │
                  │    (Tailwind, Leaflet Map)   │
                  │          Port 5173           │
                  └──────────────────────────────┘
```

*   **FastAPI Backend (Analytics & ML)**: Executes Dijkstra routing on spatial road graphs, performs inference using predictive duration models, and processes resource allocation matrices.
*   **Node.js Gateway (Proxy & WebSocket Server)**: Handles cross-origin requests, proxies API traffic to FastAPI, and streams time-sliced historical replay snapshots over WebSocket connections.
*   **Vite React Frontend (Dashboard)**: Manages spatial rendering, map overlays, interactive timeline scrubbing, and telemetry charts.

---

## 2. Core Engineering Pillars

### Predictive Congestion Modeling
The platform utilizes an XGBoost regressor trained on historical traffic metrics to predict clearance durations for unplanned incidents. The duration output serves as the base severity multiplier for downstream routing calculations.

### Spatial Congestion Propagation
Downstream congestion is modeled at the municipal ward level (243 BBMP zones) over a 60-minute forecast horizon. The propagation decay follows an exponential decay algorithm:
$$Score(t) = Baseline + (Peak - Baseline) \times e^{-t \cdot 0.15}$$
The system normalizes scores against the peak incident severity to represent color-coded transitions from critical epicenters back to standard baselines.

### Congestion-Penalized Alternate Routing
The routing engine implements Dijkstra's shortest-path algorithm. Rather than removing blocked roads (which causes pathing failures), the system dynamically scales edge weights in the affected zone:
$$Length_{scaled} = Length_{base} \times 1000$$
This forces detours around the congested area, calculating three alternate routes (Cyan, Orange, and Magenta) ranked by travel times, average speeds, and carbon (CO2) emission reduction factors.

### Policy Intervention Modeling
Operators can toggle regional policies (Signal Optimization, Clearway Enforcement, Variable Message Signs, Freight Restrictions) and place physical barricade pins on the map. The simulator adjusts road network speeds and recalculates congestion decay curves dynamically.

---

## 3. Decision-Support Features

*   **Bi-Directional Map-Sidebar Sync**: Resource sliders in the control panel map directly to physical barricade pins. Toggling pins on the map updates slider counts, and vice versa, triggering real-time recalculations.
*   **Timeline Playback Scrubber**: Allows time-scrubbing through dispersion forecasts and historical replay sessions with dedicated status badges.
*   **Calibrated Risk Assessment**: Renders localized risk indicators (Low, Medium, Critical) mapped to historical similarity queries using KGIS Ward ID and Incident Cause matching.
*   **Dispatch outcome Logger**: Evaluates and logs resource usage (police officers and barricades) and operator notes.

---

## 4. Local Launch and Execution

The repository provides automated launcher scripts that check prerequisites (Node.js v18+ and Python 3.9+), initialize virtual environments, install dependencies, and run all services concurrently.

### For macOS and Linux:
1. Open a terminal in the project root directory.
2. Run:
   ```bash
   chmod +x run_local.sh
   ./run_local.sh
   ```

### For Windows:
1. Execute the batch script via Command Prompt / PowerShell:
   ```cmd
   run_local.bat
   ```

### Ports and URLs:
*   **Frontend Dashboard**: http://localhost:5173
*   **FastAPI Backend Docs**: http://localhost:8000/docs
*   **Express Proxy Gateway**: http://localhost:3001

---

## 5. Directory Structure

```text
Grid-Unlocked/
├── ml/                      # Machine Learning & Spatial Processing
│   ├── api/                 # FastAPI routes, schemas, and endpoints
│   ├── data/
│   │   ├── geo/             # OSM Bengaluru Graph, road network & ward boundary GeoJSONs
│   │   └── processed/       # Precomputed baseline scores, route caches, and node mappings
│   ├── models/              # Serialized XGBoost duration and Random Forest models
│   ├── src/                 # Graph build, snapped road, and simulation algorithms
│   └── requirements.txt     # Python requirements
├── server/                  # Node Express WS Server & Proxy Layer
│   ├── middleware/          # CORS configurations
│   ├── routes/              # Proxy handlers to redirect traffic to FastAPI
│   ├── ws/                  # WebSocket event stream handler
│   └── package.json         # Node.js backend requirements
├── frontend/                # React Dashboard UI
│   ├── src/                 # Components, hooks, Zustand stores, and assets
│   ├── public/              # Wards GeoJSON static assets
│   └── package.json         # Frontend build requirements
├── docs/                    # Design decks, walkthrough scripts, and concept reports
├── run_local.sh             # macOS/Linux local setup launcher
├── run_local.bat            # Windows local setup launcher
├── Dockerfile               # Production Docker container
├── start.sh                 # Unified container entry point
└── README.md                # Project documentation
```

---

## 6. Production Deployments

*   **Production Frontend**: Deployed on Netlify, configured to point to the active backend space.
*   **Production Backend**: Deployed on Hugging Face Spaces using a custom Docker environment running Node.js and Python.
