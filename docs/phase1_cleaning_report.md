# Phase 1 Cleaning Report — Gridlock

Generated: 2026-06-17

This report summarizes Phase 1 cleaning actions (deduplication, parsing, normalization, spatial filtering) and lists columns with high missingness (>90%). No imputation or feature engineering was performed.

## Events

- Original rows: 8,173
- After deduplication: 8,173 (duplicates removed: 0)
- Rows after Bengaluru bbox filter: 8,136 (dropped coordinates: 37)

### Null statistics (selected)

- `start_datetime`: 115 null
- `end_datetime`: 7,662 null
- `closed_datetime`: 5,004 null
- `created_date`: 1 null
- `zone`: 4,692 null
- `junction`: 5,635 null
- `event_duration_minutes`: 4,951 null
- `response_lag_minutes`: 115 null

### High-missing columns (>90% missing)

- `end_address`, `end_datetime`, `map_file`, `direction`, `cargo_material`, `reason_breakdown`, `age_of_truck`, `route_path`, `assigned_to_police_id`, `citizen_accident_id`, `comment`, `meta_data`, `resolved_at_address`, `resolved_at_latitude`, `resolved_at_longitude`, `resolved_by_id`, `resolved_datetime`

### Notes on events cleaning

- Datetimes parsed: `start_datetime`, `end_datetime`, `closed_datetime`, `created_date`, `modified_datetime`, `resolved_datetime`.
- Normalized (lowercased/stripped): `event_type`, `status`, `priority`, `event_cause`.
- Calculated `event_duration_minutes` using `closed_datetime - start_datetime` with fallback to `resolved_datetime - start_datetime`.
- Calculated `response_lag_minutes` as `start_datetime - created_date`.
- Did not drop rows with null `closed_datetime`, `zone`, or `junction` (per directive).

Cleaned events written to: `ml/data/processed/events_clean.csv`

---

## Violations

- Original rows: 298,450
- After deduplication: 298,450 (duplicates removed: 0)
- Rows after Bengaluru bbox filter: 298,282 (dropped coordinates: 168)

### Null statistics (selected)

- `description`: 298,282 null
- `closed_datetime`: 298,282 null (not used)
- `data_sent_to_scita_timestamp`: 256,146 null
- `updated_vehicle_number`: 125,166 null
- `validation_status`: 125,166 null

### High-missing columns (>90% missing)

- `description`, `closed_datetime`, `action_taken_timestamp`

### Notes on violations cleaning

- Datetimes parsed: `created_datetime`, `modified_datetime`, `validation_timestamp`, `data_sent_to_scita_timestamp`.
- Normalized (lowercased/stripped): `violation_type`, `validation_status`, `vehicle_type`.
- Did not compute durations (closed_datetime is empty).
- Did not drop rows where `validation_status` is null (per directive).

Cleaned violations written to: `ml/data/processed/violations_clean.csv`

---

## Recommendations / next steps

- Preserve the full cleaned CSVs for Phase 2 spatial joins and Phase 3 feature engineering.
- For Phase 3, consider parsing JSON-like fields such as `violation_type` and `offence_code` and normalizing multi-valued strings into exploded rows or indicator features.
