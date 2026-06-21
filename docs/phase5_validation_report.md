# Phase 5 Validation Report — Role B

**Date:** 2026-06-19  
**Phase:** 5 — Congestion Propagation + Backend Integration  
**Role:** B (ML / Backend / API)

---

## 1. zone_scores.csv Validation

| Check | Result |
|-------|--------|
| File exists | ✅ `ml/data/processed/zone_scores.csv` (46 MB) |
| Row count | ✅ 1,977,048 rows |
| Columns | ✅ `event_id`, `zone_id`, `score` (exactly 3) |
| Null values | ✅ 0 nulls in all columns |
| Score range | ✅ 0.0 – 100.0 |
| Unique zones | ✅ 243 (matches GeoJSON feature count) |
| Unique events | ✅ 8,136 (matches events_clean.csv) |
| Mean score | 1.596 |
| Median score | 0.000 |
| 75th percentile | 0.372 |

> [!NOTE]
> The score distribution is heavily right-skewed — most zone-event pairs receive near-zero propagated congestion, which is expected since exponential decay attenuates scores quickly with graph distance.

---

## 2. Input File Summary

| File | Size | Rows | Key Columns |
|------|------|------|-------------|
| `bengaluru_zones.geojson` | 2.0 MB | 243 features | `KGISWardNo`, `KGISWardName`, geometry |
| `violations_clean.csv` | 101 MB | 298,282 | `latitude`, `longitude`, `junction_name` |
| `zone_scores.csv` | 46 MB | 1,977,048 | `event_id`, `zone_id`, `score` |

---

## 3. GET /api/zones — Endpoint Validation

| Check | Result |
|-------|--------|
| HTTP Status | ✅ 200 OK |
| Feature count | ✅ 243 |
| Valid GeoJSON structure | ✅ Each feature has `type`, `geometry`, `properties` |
| `zone_id` populated | ✅ All 243 |
| `zone_name` populated | ✅ All 243 |
| `baseline_score` populated | ✅ All 243 (0 nulls) |
| Score range | 0.2411 – 3.7618 |
| Average baseline score | **1.5958** |

### Sample Response (first feature):

```json
{
  "type": "Feature",
  "geometry": { "type": "Polygon", "coordinates": [...] },
  "properties": {
    "zone_id": "1",
    "zone_name": "Kempegowda Ward",
    "baseline_score": 0.9681155734288902
  }
}
```

### Sample Zone Names:
- Kempegowda Ward
- Chowdeswari Ward
- Someshwara Ward
- Atturu Layout
- Yelahanka Satellite Town

---

## 4. GET /api/violations/heatmap — Endpoint Validation

| Check | Result |
|-------|--------|
| HTTP Status | ✅ 200 OK |
| Non-empty response | ✅ |
| Heatmap point count | ✅ 169 points |
| Total violations covered | 298,277 |
| Latitude range | 12.90212 – 13.01088 (valid Bengaluru range) |
| Longitude range | 77.52670 – 77.64479 (valid Bengaluru range) |
| Count range | 6 – 147,712 |

### Sample Response (first 3 points):

```json
[
  { "lat": 13.0042963, "lon": 77.553442, "count": 2812 },
  { "lat": 12.9906036, "lon": 77.5571348, "count": 47 },
  { "lat": 12.9982551, "lon": 77.5529857, "count": 1190 }
]
```

---

## 5. Files Modified by Role B

| File | Action |
|------|--------|
| `ml/api/routes/zones.py` | Updated — added `zone_name` from GeoJSON properties |
| `ml/api/routes/violations.py` | Rewritten — full heatmap implementation with junction aggregation |
| `ml/api/schemas.py` | Updated — added `zone_name: str` to `ZoneProperties` |

---

## 6. Verification Summary

All checks passed:

- ✅ `zone_scores.csv` generated with correct shape, schema, and score bounds
- ✅ 243 zones match between GeoJSON and zone_scores.csv
- ✅ `GET /zones/` returns 243 features with valid GeoJSON, zone names, and baseline scores
- ✅ `GET /violations/heatmap` returns 169 aggregated junction points covering 298,277 violations
- ✅ No dummy/hardcoded responses remain
- ✅ No null scores or coordinates
- ✅ All coordinates fall within valid Bengaluru geographic bounds
