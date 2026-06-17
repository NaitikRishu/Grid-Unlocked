# Grid Unlocked

Grid Unlocked is a traffic intelligence and simulation platform for analyzing urban congestion, predicting impact, simulating interventions, and visualizing route diversions on a city map.

Repository: [NaitikRishu/Grid-Unlocked](https://github.com/NaitikRishu/Grid-Unlocked)

## Project Summary

The system combines:

- historical traffic event data
- traffic violation data
- OpenStreetMap road graphs
- ML-based congestion prediction
- graph-based congestion propagation
- what-if simulation
- replay and dashboard visualization

The goal is to help estimate congestion impact, test intervention strategies, and present results through an interactive frontend.

## Current Status

- Project documentation and structure are being prepared
- No active phase has been started yet
- This README is based on the detailed implementation workplan

## High-Level Architecture

The project is split into three major parts:

- `ml/` for data cleaning, feature engineering, graph logic, model training, simulation, and analytics
- `server/` for the Node/Express proxy layer and WebSocket replay service
- `frontend/` for the React dashboard, map UI, controls, and analytics views

## Folder Structure

```text
gridlock/
├── ml/
│   ├── data/
│   │   ├── raw/
│   │   │   ├── events.csv
│   │   │   └── violations.csv
│   │   ├── processed/
│   │   │   ├── events_clean.csv
│   │   │   ├── violations_clean.csv
│   │   │   ├── feature_matrix.csv
│   │   │   ├── node_mapping.csv
│   │   │   ├── zone_scores.csv
│   │   │   └── replay_data.json
│   │   └── geo/
│   │       ├── bengaluru_graph.pkl
│   │       ├── bengaluru_roads.geojson
│   │       └── bengaluru_zones.geojson
│   ├── notebooks/
│   │   └── eda.ipynb
│   ├── models/
│   │   ├── congestion_model.pkl
│   │   └── impact_classifier.pkl
│   ├── src/
│   │   ├── clean_events.py
│   │   ├── clean_violations.py
│   │   ├── feature_engineering.py
│   │   ├── train_model.py
│   │   ├── inference.py
│   │   ├── build_graph.py
│   │   ├── snap_to_road.py
│   │   ├── graph_utils.py
│   │   ├── congestion_propagation.py
│   │   ├── route_engine.py
│   │   ├── event_simulator.py
│   │   ├── resource_allocator.py
│   │   └── replay_generator.py
│   ├── api/
│   │   ├── main.py
│   │   ├── schemas.py
│   │   └── routes/
│   │       ├── events.py
│   │       ├── zones.py
│   │       ├── simulate.py
│   │       ├── violations.py
│   │       ├── routes.py
│   │       └── analytics.py
│   └── requirements.txt
├── server/
│   ├── index.js
│   ├── config.js
│   ├── routes/
│   │   └── proxy.js
│   ├── ws/
│   │   └── replay.js
│   ├── middleware/
│   │   └── cors.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Map/
│   │   │   ├── Controls/
│   │   │   ├── Analytics/
│   │   │   └── Layout/
│   │   ├── hooks/
│   │   ├── store/
│   │   ├── api/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── public/
│   │   └── bengaluru_zones.geojson
│   ├── index.html
│   └── package.json
├── docs/
│   ├── concept_note.md
│   ├── api_contract.md
│   └── demo_script.md
└── README.md
```

## Core Features

- Clean and preprocess traffic events and violations datasets
- Build a Bengaluru road graph from OpenStreetMap
- Snap event coordinates to road nodes and map them to zones
- Engineer features for congestion prediction
- Train models for congestion score and high-impact classification
- Propagate congestion scores across nearby zones using graph distance
- Generate alternate diversion routes
- Run what-if simulations using manpower, barricades, diversions, and start time offsets
- Allocate police and barricades across affected zones
- Replay event progression over time through WebSocket snapshots
- Visualize zones, events, heatmaps, routes, and analytics in the frontend

## Phase Plan

### Phase 0: Project Setup

- set up Python environment and core dependencies
- create the ML source files and API/service skeletons
- initialize Express backend
- initialize React frontend

### Phase 1: Data Cleaning

- clean `events.csv`
- clean `violations.csv`
- parse timestamps and normalize categorical fields
- generate cleaned datasets for downstream work

### Phase 2: Map Generation

- download Bengaluru road graph from OpenStreetMap
- export roads to GeoJSON
- download ward or zone polygons
- snap events to nearest road nodes
- spatially join events to zones

This is the most critical dependency phase because later ML, routing, and frontend work depend on these outputs.

### Phase 3: Feature Engineering

- build temporal, spatial, and event-based features
- compute violation density and historical averages
- generate `feature_matrix.csv`

### Phase 4: Model Training

- train regression model for congestion score
- train classifier for high-impact events
- evaluate with RMSE, MAE, R2, F1, precision, and recall
- expose inference for event-level predictions

### Phase 5: Congestion Propagation

- compute graph distance between zones
- propagate congestion using exponential decay
- aggregate zone-level scores
- generate `zone_scores.csv`

### Phase 6: Route Engine

- identify blocked road segments around an event
- compute alternate routes
- estimate delay by congestion level
- build and cache route GeoJSON outputs

### Phase 7: Event Simulator

- predict base congestion
- adjust scores using manpower, barricades, diversion mode, and time shifts
- compute updated zone scores
- return alternate routes and resource allocation

### Phase 8: Resource Allocator

- distribute police and barricades by zone score
- handle low-resource and edge-case scenarios
- connect allocations into the simulator response

### Phase 9: Replay

- generate time-stepped event replay snapshots
- expose replay API output
- stream snapshots over WebSocket for frontend playback

### Phase 10: Integration and Submission

- perform end-to-end testing across ML, backend, and frontend
- fix API, proxy, rendering, and data edge cases
- finalize docs, concept note, and submission materials

## API Contract

### `GET /api/events`

Returns a list of event objects.

### `GET /api/events/:id`

Returns one event with prediction details.

### `GET /api/zones`

Returns zone GeoJSON with baseline congestion score properties.

### `GET /api/violations/heatmap`

Returns heatmap points in the form:

```json
[{ "lat": 0, "lon": 0, "count": 0 }]
```

### `GET /api/routes/:event_id`

Returns alternate route GeoJSON for an event.

### `POST /api/simulate`

Request body:

```json
{
  "event_type": "string",
  "latitude": 0,
  "longitude": 0,
  "start_datetime": "ISO string",
  "manpower": 0,
  "barricades": 0,
  "diversion_active": true,
  "start_time_offset_minutes": 0
}
```

Response body:

```json
{
  "zone_scores": { "zone_id": 0 },
  "predicted_duration_minutes": 0,
  "high_impact": false,
  "delay_saved_minutes": 0,
  "alternate_routes": [],
  "resource_allocation": {
    "zone_id": { "police": 0, "barricades": 0 }
  }
}
```

### `GET /api/analytics/post-event`

Returns predicted vs actual event performance data.

### `GET /api/analytics/zone-summary`

Returns zone-level summary analytics.

### `WS /replay`

Streams replay snapshots for a chosen event until completion.

## Important Outputs

The project relies heavily on these generated artifacts:

- `ml/data/geo/bengaluru_graph.pkl`
- `ml/data/geo/bengaluru_roads.geojson`
- `ml/data/geo/bengaluru_zones.geojson`
- `ml/data/processed/events_clean.csv`
- `ml/data/processed/violations_clean.csv`
- `ml/data/processed/feature_matrix.csv`
- `ml/data/processed/node_mapping.csv`
- `ml/data/processed/zone_scores.csv`
- `ml/data/processed/replay_data.json`
- `ml/data/processed/route_cache.pkl`
- `ml/models/congestion_model.pkl`
- `ml/models/impact_classifier.pkl`

## Priority Order

### Must Have

- cleaned events and feature matrix
- Bengaluru graph and zone GeoJSON
- trained congestion model and inference flow
- working congestion propagation
- `POST /api/simulate` returning zone scores
- choropleth map updating from simulation response
- working what-if controls

### Nice to Have

- diversion route polylines
- replay animation
- post-event accuracy table
- violation heatmap layer
- zone ranking table

### Can Be Cut If Time Is Short

- delay comparison charts
- multiple route colour refinements
- mobile responsiveness
- precomputed route cache if live computation is sufficient

## Setup Plan

### Python / ML

```bash
python -m venv venv
source venv/bin/activate
pip install osmnx networkx geopandas shapely pandas requests pickle5
```

Additional ML and API packages expected in the plan include:

```bash
pip install pandas xgboost lightgbm scikit-learn fastapi uvicorn pydantic
```

### Backend

```bash
cd server
npm install
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## End-to-End Run Plan

When implementation is ready, the expected local services are:

- FastAPI on port `8000`
- Express on port `3001`
- React frontend on port `5173`

Typical flow:

1. Start FastAPI
2. Start Express
3. Start React
4. Open the dashboard
5. Load zones and events
6. Run a simulation
7. Inspect updated map layers and analytics
8. Play a replay for a selected event

## Rules and Constraints

- The API contract should remain stable after Phase 5
- Any endpoint change should be agreed before updating dependent layers
- Spatial outputs are a hard dependency for the rest of the project
- End-to-end testing is required before submission
- Submission deadline in the workplan is before June 21, 2026, 11:59 PM IST

## Notes

This README is derived from the detailed implementation workplan and is intended to serve as the project’s main starting document until the repository is fully scaffolded.
