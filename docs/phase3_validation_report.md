# Phase 3 Validation Report

## Overview
This document summarizes the successful execution and validation of Phase 3 (Feature Engineering) for Role B.

## Input Datasets Used
* `ml/data/processed/events_clean.csv` (8,136 rows)
* `ml/data/processed/violations_clean.csv` (298,282 rows)

## Features Implemented
### Temporal
* `hour_of_day`, `day_of_week`, `month`, `is_peak_hour` (binary indicating 7-10 AM or 5-8 PM)

### Event-level
* `requires_road_closure` (binary)
* `priority_encoded` (high=3, medium=2, low=1)
* `event_type_encoded` (one-hot encoding of the top 8 event types, with remaining grouped as "other")
* `response_lag_minutes` (preserved from Phase 1)

### Spatial / Historical
* `violation_density_7d` (count of violations at the same junction in the preceding 7 days)
* `historical_avg_duration` (historical mean duration grouped by event_type and zone_id)
* `concurrent_events_in_zone` (count of overlapping events occurring within the same zone_id)

### Targets
* `congestion_score` (duration / 120 * 100, capped between 0 and 100)
* `high_impact` (binary 1 if congestion_score >= 75)

## Validation Checks Performed
Inside `feature_engineering.py`, the following explicit checks were implemented and passed:
* Duplicate `event_id` check (0 duplicates)
* Row count check (Exactly 8,136 rows preserved)
* Bounds check on `congestion_score` (Strictly between 0 and 100)
* Binary check on `high_impact` (Strictly 0 or 1)
* Null checks handled gracefully via 0-fill and median-fill logic.

## Output Details
* **Output File:** `ml/data/processed/feature_matrix.csv`
* **Row Count:** 8,136
* **Column Count:** 16

## Proxy Test Results
* Node server successfully installed dependencies (`npm install` run in `server/`).
* Proxied `http://localhost:3001/api/events/` successfully reached FastAPI port `8000`.
* Proxied `http://localhost:3001/api/zones/` successfully reached FastAPI port `8000`.
* Both routes responded with `HTTP/1.1 200 OK` and correctly relayed the dummy `[]` JSON payload.

## Blockers or Edge Cases
* The proxy requests require a trailing slash (e.g., `/api/events/`) depending on the exact FastAPI router definition. A 307 Temporary Redirect is safely handled by standard fetch clients, but trailing slashes ensure a direct 200 OK hit.
* `zone_id` was missing for 446 out of 8,136 events due to spatial bounds mismatch in Phase 2; these missing zones were handled gracefully in group-by computations and did not break the matrix.
