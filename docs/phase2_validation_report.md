# Phase 2 Validation Report

## Overview
This report documents the end-to-end execution and validation of Phase 2 (Map Generation).

## Scripts Executed
1. `ml/src/build_graph.py`: Downloaded the OSM road graph and BBMP zones GeoJSON.
2. `ml/src/snap_to_road.py`: Mapped cleaned events to graph nodes and appended spatial zone IDs.

## Outputs Generated & Verification
* `ml/data/geo/bengaluru_graph.pkl`
  * Size: 54 MB
  * Status: Successfully generated and verified (155,376 nodes, 393,743 edges).
* `ml/data/geo/bengaluru_roads.geojson`
  * Size: 192 MB
  * Status: Successfully generated and verified.
* `ml/data/geo/bengaluru_zones.geojson`
  * Size: 2.0 MB
  * Status: Successfully generated and verified (243 zones loaded).
* `ml/data/processed/node_mapping.csv`
  * Size: 348 KB
  * Rows: 8,136 mapped nodes
  * Status: Successfully generated and verified. Matches events row count perfectly.
* `ml/data/processed/events_clean.csv` (Updated)
  * Size: 4.1 MB
  * Status: Appended with `zone_id`. 446/8136 events fell outside the bounding polygons and received a missing `zone_id`.

## Known Limitations
* MapmyIndia API credentials (`MAPMYINDIA_CLIENT_ID` and `MAPMYINDIA_CLIENT_SECRET`) were not provided in a `.env` file. The `snap_to_road.py` script gracefully fell back to standard OpenStreetMap nearest-node logic. Snapping was completed successfully for 100% of the dataset, but relies on geometric proximity (OSMnx) rather than standard commercial GPS road snapping algorithms.
