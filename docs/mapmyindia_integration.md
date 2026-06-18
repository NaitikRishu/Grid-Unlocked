# MapmyIndia (Mappls) Integration Guide

This document outlines how MapmyIndia (Mappls) APIs are being integrated into the `Grid-Unlocked` platform. It serves to convey the exact scope of changes to all team members (Team A, B, and C) to ensure **backwards compatibility** and **zero code breakage**.

---

## 1. Key Principles & Zero Code Breakage
We are introducing MapmyIndia APIs to improve:
1. **Snapping accuracy** (using the Snap to Road API).
2. **Visual aesthetics** (using MapmyIndia Raster Tiles on the Leaflet map).

To prevent any breaking changes:
* **The OSMnx/NetworkX graph engine remains the core backend architecture.**
* All graph distance calculations (`congestion_propagation.py`), route modifications/alternate paths (`route_engine.py`), and zone geometries (`bengaluru_zones.geojson`) remain exactly as specified in the workplan.
* **Graceful Fallback**: If MapmyIndia credentials are not present in `.env`, the scripts will automatically fall back to standard OSMnx snapping. **Nothing will break.**

---

## 2. Impact & Action Items per Team Member

### 🛠️ Team A (YOU) — Graph, Simulation & Routing
* **`build_graph.py`**: No changes. Downloads OSM graph and BBMP zones exactly as before.
* **`snap_to_road.py`**: 
  * Will attempt to read MapmyIndia credentials from `ml/.env`.
  * If credentials are valid, it queries the **MapmyIndia Snap to Road API** (`/route/movement/snapToRoad`) in batches of 100 points to snap raw event coords to high-accuracy road positions before mapping them to OSM graph nodes.
  * If credentials are missing or default, it falls back to standard `ox.nearest_nodes` matching.
* **`graph_utils.py`**: No changes. All OSMnx helpers remain standard.

### 🐍 Team B — ML, FastAPI & Database
* **No changes** to your data cleaning, feature engineering, model training (`train_model.py`), or inference (`inference.py`) scripts.
* **API Configuration**: You will need to copy the `ml/.env` file and make sure the API server has access to these keys if it needs to proxy tiles, or simply let the frontend consume the `MAPMYINDIA_REST_API_KEY` directly.
* All Pydantic schemas and endpoints (`GET /api/events`, `POST /api/simulate`) remain 100% frozen as per the API contract.

### 🎨 Team C — Frontend & Map UI
* **`BengaluruMap.jsx`**:
  * Instead of standard OpenStreetMap tiles, you will load MapmyIndia Raster Tiles using Leaflet's `TileLayer`.
  * **Tile URL Template**: 
    `https://apis.mapmyindia.com/advancedmaps/v1/{MAPMYINDIA_REST_API_KEY}/tile/{z}/{x}/{y}.png`
  * Add the appropriate attribution: `© MapmyIndia`.
  * All GeoJSON polygon renderings, choropleths, markers, and route polyline properties remain completely unchanged.

---

## 3. Configuration Setup
Create a file named `.env` in the `ml/` directory (and root if preferred):

```env
# MapmyIndia (Mappls) API Credentials
MAPMYINDIA_CLIENT_ID=your_client_id
MAPMYINDIA_CLIENT_SECRET=your_client_secret
MAPMYINDIA_REST_API_KEY=your_rest_api_key
```
