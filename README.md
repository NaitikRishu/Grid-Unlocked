---
title: Grid Unlocked Backend
emoji: 🚦
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# 🌐 Grid Unlocked: Predictive Traffic Twin & Control Room Simulator

**Grid Unlocked** is a research-grade, real-time traffic intelligence and what-if simulation platform. It serves as a **digital twin** of urban road networks, designed to assist municipal dispatchers and traffic engineers in proactively modeling, predicting, and mitigating metropolitan congestion cascades.

---

## 🚀 Quick Start (Local Setup & Run)

We have provided automated launcher scripts that automatically verify prerequisites, configure Python virtual environments, install dependencies, and launch all services simultaneously.

### 🍏 For macOS and Linux:
1. Open a terminal in the project root directory.
2. Grant execute permissions and run the launcher:
   ```bash
   chmod +x run_local.sh
   ./run_local.sh
   ```

### 🪟 For Windows:
1. Run the batch script via Command Prompt / PowerShell:
   ```cmd
   run_local.bat
   ```

### 🔗 Local Endpoints:
Once running, you can access the services at:
*   **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173) (Interactive map and HUD control room)
*   **FastAPI API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs) (Interactive Swagger API)
*   **Express Gateway/WS:** [http://localhost:3001](http://localhost:3001) (Real-time WebSockets replay stream)

---

## 🏛️ System Architecture

Grid Unlocked is built on a high-throughput, decoupled architecture designed to scale:

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

1.  **FastAPI Backend (ML & Routing Engine)**: Runs Dijkstra routing on spatial road graphs, performs inference using predictive duration models, and simulates resource allocations.
2.  **Node Express Server (Proxy & WebSocket Server)**: Handles CORS, proxies HTTP queries to the Python API, and streams time-sliced historical replay snapshots to the frontend over WebSockets.
3.  **Vite React Frontend (Traffic Dashboard)**: Renders zone choropleth layers, alternate route polylines, physical barricade points, and telemetry HUD metrics.

---

## 💡 Core Innovations

### 1. Bi-Directional Map-Sidebar Sync
*   **Interactive Barricading:** Dispatchers can click recommended barricade placement points directly on the Leaflet map to deploy physical barricades (turning them red).
*   **State Alignment:** Dragging the sidebar resource sliders automatically deploys/retracts map barricades, and clicking map barricades dynamically adjusts sidebar sliders. Every toggle triggers a **real-time recalculation of detour routes and travel speed changes**.

### 2. Time-Scrubbing Dispersion Scrubber
*   Provides an interactive 60-minute playback scrubber for both **historical replays** (orange theme) and **what-if simulations** (blue theme).
*   Wards decay exponentially back to their baselines over the timeline:
    $$Score(t) = Baseline + (Peak - Baseline) \times e^{-t \cdot 0.15}$$
*   Normalized against the peak congestion score at simulation initialization to ensure realistic color transition from critical red to green.

### 3. Integrated Route Telemetry HUD
*   Compares **three alternate detour routes** (Cyan, Orange, and Magenta) in real-time.
*   Displays comparative metrics for travel times, average speeds, and relative carbon (CO₂) emission reductions based on active traffic policies.

### 4. Decision-Support Logs
*   **Calibrated Risk Gauge:** A visual status bar indicating LOW (`<40%`), MEDIUM (`40%-70%`), or CRITICAL (`>70%`) risk based on predicted durations.
*   **Supporting Evidence:** Logs the top 3 similar historical incidents in the active ward zone using KGIS Ward ID and Incident Cause matching.
*   **Log Actual Outcome:** A dispatch log form letting operators record active officer usage, barricades, priority status, and custom dispatcher notes.

---

## 📂 Project Directory Structure

```text
Grid-Unlocked/
├── ml/                      # Machine Learning & Spatial Processing
│   ├── api/                 # FastAPI routes, schemas, and endpoints
│   ├── data/
│   │   ├── geo/             # OSM Bengaluru Graph, road network & ward boundary GeoJSONs
│   │   └── processed/       # Precomputed baseline scores, route caches, and node mappings
│   ├── models/              # Serialized XGBoost duration and Random Forest impact models
│   ├── src/                 # Graph build, snapped road, and simulation algorithms
│   └── requirements.txt     # Python environment requirements
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
├── run_local.sh             # macOS/Linux automated local setup launcher
├── run_local.bat            # Windows automated local setup launcher
├── Dockerfile               # Production Docker container
├── start.sh                 # Unified container execution entry point
└── README.md                # Project documentation
```

---

## 📊 Model Training & Performance
The platform's prediction accuracy relies on:
1.  **XGBoost Regressor (`congestion_model.pkl`)**: Predicts the duration of traffic bottlenecks.
2.  **Random Forest Classifier (`impact_classifier.pkl`)**: Predicts if an incident will result in critical high-impact congestion.
3.  **OSM Graph (`bengaluru_graph.pkl`)**: Represents Bengaluru's drive network containing 40,000+ nodes and 100,000+ road segments.

---

## 📦 Production Deployments
*   **Production Frontend:** Hosted on [Netlify](https://grid-unlocked-1782050398.netlify.app) and configured to point to the active backend space.
*   **Production Backend:** Hosted on [Hugging Face Spaces](https://huggingface.co/spaces/naitikrishu/grid-unlocked-backend) inside a custom Docker environment.
