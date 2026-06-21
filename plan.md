# Smart Recommendation Engine Implementation Plan

The goal is to implement a **Smart Recommendation Engine** that scans historical similar events to recommend optimal resource allocations (manpower, barricades), optimal temporal offsets, and route diversions. We will expose this through a new FastAPI backend endpoint and wire it to the React frontend Map Simulation workspace.

## 1. Backend Design

### A. Recommendation Algorithm
We will implement the recommendation logic in `ml/src/event_simulator.py`.
Given an event request (`event_type`, `latitude`, `longitude`, `start_datetime`):
1. **Determine Nearest Zone**: Identify the zone ID and predict the baseline score using current coordinates and temporal features.
2. **Retrieve Past Similar Events**:
   - Filter historical events in `events_clean.csv` that belong to the same `zone_id` and have the same `event_type`.
   - Sort these by how recently they occurred or how close they are in time of day.
   - Extract up to 3 similar past events (including their cause, duration, priority, and date).
3. **Calculate Interventions**:
   - **Manpower (Police)**: Based on bringing the baseline score down to a safe threshold (e.g. 40).
     Formula: `manpower = math.ceil((1.0 - 40.0 / base_score) / 0.012)` if `base_score > 40` else `5`. Cap between `0` and `50`.
   - **Barricades**: Recommend barricades based on baseline score severity to squeeze the congestion propagation radius.
     Formula: `barricades = math.ceil(base_score / 5.0)`. Cap between `0` and `20`.
   - **Time Shift (Offset)**: Search alternative offsets (e.g., `-60, -30, 0, 30, 60` minutes) and select the offset that yields the lowest predicted congestion score.
   - **Route Diversion**: Activate route diversion if the baseline congestion score is high (`>= 50`).

### B. API Route
Create a new endpoint `POST /api/simulate/recommend` in `ml/api/routes/simulate.py`.
- **Request Body**:
  ```json
  {
    "event_type": "unplanned",
    "latitude": 12.9218755,
    "longitude": 77.6451585,
    "start_datetime": "2024-01-30T04:07:24.173Z"
  }
  ```
- **Response Body**:
  ```json
  {
    "recommended_manpower": 18,
    "recommended_barricades": 8,
    "recommended_diversion_active": true,
    "recommended_offset_minutes": 30,
    "explanation": "Based on past trends, we recommend deploying 18 officers and 8 barricades with a 30-minute shift to minimize impact.",
    "similar_events": [
      {
        "id": "FKID000001",
        "event_cause": "vehicle_breakdown",
        "start_datetime": "2024-01-30 04:07:24",
        "duration_minutes": 10.37,
        "priority": "high"
      }
    ]
  }
  ```

---

## 2. Frontend Integration

### A. What-If Panel Upgrade (`WhatIfPanel.jsx`)
- Add an **"💡 Auto-Recommend"** button next to the "Run Scenario Simulation" button.
- When clicked, fetch recommendations from `/api/simulate/recommend` for the currently selected event.
- Apply the recommended values directly to the local states:
  - `manpower`
  - `barricades`
  - `diversionActive`
  - `offsetMinutes`
- Automatically run the simulation (by calling the simulate API) with the recommended parameters so the user immediately sees the visual impact on the map simulation.
- Render a sleek recommendation card containing:
  - The generated text explanation.
  - A collapsible list of "Similar Historical Events" with their durations and causes to justify the recommendation.

---

## 3. Verification Plan

1. **Backend Unit / Schema Tests**: Verify the endpoint responds correctly using direct python script requests.
2. **Manual Integration Test**: Select an event on the UI, click "💡 Auto-Recommend", verify that sliders update, simulation is triggered, alternate routes are displayed on the map, and similar events card shows up.
