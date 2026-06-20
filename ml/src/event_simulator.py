#!/usr/bin/env python3
"""event_simulator.py - Phase 7 Event Simulator / What-If Engine

Integrates model inference, spatial score propagation, alternate routing,
and resource allocation to simulate traffic management interventions.
"""
import os
import pickle
from datetime import datetime, timedelta
import pandas as pd
import geopandas as gpd

from ml.src.inference import predict_event
from ml.src import congestion_propagation
from ml.src import route_engine
from ml.src import resource_allocator
from ml.src import graph_utils


# Define paths
src_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.dirname(src_dir)
GRAPH_PATH = os.path.join(ml_dir, "data", "geo", "bengaluru_graph.pkl")
ZONES_PATH = os.path.join(ml_dir, "data", "geo", "bengaluru_zones.geojson")
EVENTS_PATH = os.path.join(ml_dir, "data", "processed", "events_clean.csv")
FM_PATH = os.path.join(ml_dir, "data", "processed", "feature_matrix.csv")
CACHE_DIST_PATH = os.path.join(ml_dir, "data", "processed", "zone_distances.pkl")

# Lazy loading globals
_G = None
_zones_gdf = None
_events_df = None
_fm_df = None

def load_resources():
    """Lazy loads graph, zones, events, and features to keep imports fast."""
    global _G, _zones_gdf, _events_df, _fm_df
    
    if _G is None:
        print("Loading road graph in simulator...")
        with open(GRAPH_PATH, "rb") as f:
            _G = pickle.load(f)
            
    if _zones_gdf is None:
        print("Loading zones in simulator...")
        _zones_gdf = gpd.read_file(ZONES_PATH)
        
    if _events_df is None:
        print("Loading events in simulator...")
        _events_df = pd.read_csv(EVENTS_PATH)
        
    if _fm_df is None:
        print("Loading feature matrix in simulator...")
        _fm_df = pd.read_csv(FM_PATH)
        
    return _G, _zones_gdf, _events_df, _fm_df

def find_matching_event_features(lat: float, lon: float, event_type: str, start_time_str: str):
    """Tries to find a matching historical event from features to use as a baseline."""
    _, _, events_df, fm_df = load_resources()
    
    # 1. Attempt exact coordinate match
    # Since float precision in UI requests might vary slightly, use a small delta (approx 10 meters)
    coord_mask = (events_df['latitude'] - lat).abs() < 0.0001
    coord_mask &= (events_df['longitude'] - lon).abs() < 0.0001
    
    matched_events = events_df[coord_mask]
    if not matched_events.empty:
        # Check event_id in feature matrix
        ev_id = matched_events.iloc[0]['id']
        fm_match = fm_df[fm_df['event_id'] == ev_id]
        if not fm_match.empty:
            return fm_match.iloc[0].to_dict(), ev_id
            
    # 2. Fallback: Reconstruct baseline features for hypothetical event
    # Find nearest zone to assign historical values
    zone_id = ""
    # Find nearest zone centroid
    min_dist = float('inf')
    for idx, row in _zones_gdf.iterrows():
        centroid = row.geometry.centroid
        dist = math.hypot(centroid.y - lat, centroid.x - lon)
        if dist < min_dist:
            min_dist = dist
            zone_id = congestion_propagation.clean_zone_id(row['KGISWardNo'])
            
    # Default temporal features
    dt = pd.to_datetime(start_time_str, utc=True)
    hour = dt.hour
    day = dt.dayofweek
    month = dt.month
    is_peak = 1 if hour in [7,8,9,10,17,18,19,20] else 0
    
    baseline = {
        "hour_of_day": hour,
        "day_of_week": day,
        "month": month,
        "is_peak_hour": is_peak,
        "requires_road_closure": 0,
        "priority_encoded": 2,
        "response_lag_minutes": 15.0,
        "violation_density_7d": 5.0,
        "historical_avg_duration": 60.0,
        "concurrent_events_in_zone": 0,
        "event_type_planned": 1 if event_type.lower() == 'planned' else 0,
        "event_type_unplanned": 1 if event_type.lower() == 'unplanned' else 0,
        "zone_id": zone_id
    }
    return baseline, None

import math

def run_simulation(event_dict_req: dict, params: dict) -> dict:
    """Runs a what-if simulation by applying interventions to baseline features.
    
    Interventions:
    - manpower: police officers (0-50)
    - barricades: barricades count (0-20)
    - diversion_active: boolean
    - start_time_offset_minutes: temporal shift (-120 to 120)
    """
    G, zones_gdf, events_df, fm_df = load_resources()
    
    lat = float(event_dict_req.get("latitude"))
    lon = float(event_dict_req.get("longitude"))
    event_type = str(event_dict_req.get("event_type"))
    start_time_str = str(event_dict_req.get("start_datetime"))
    
    # Step 1: Match event to get baseline feature vectors
    base_features, event_id = find_matching_event_features(lat, lon, event_type, start_time_str)
    
    # Predict baseline score
    base_prediction = predict_event(base_features)
    base_score = base_prediction["congestion_score"]
    
    # Step 2: Apply temporal offset (Time Shift)
    offset = int(params.get("start_time_offset_minutes", 0))
    adjusted_features = base_features.copy()
    if offset != 0:
        dt = pd.to_datetime(start_time_str, utc=True) + timedelta(minutes=offset)
        adjusted_features["hour_of_day"] = dt.hour
        adjusted_features["day_of_week"] = dt.dayofweek
        adjusted_features["month"] = dt.month
        adjusted_features["is_peak_hour"] = 1 if dt.hour in [7,8,9,10,17,18,19,20] else 0
        
    # Get score at adjusted time
    adjusted_prediction = predict_event(adjusted_features)
    adjusted_score = adjusted_prediction["congestion_score"]
    
    # Step 3: Apply manpower effect on the score
    manpower = int(params.get("manpower", 0))
    adjusted_score = adjusted_score * (1.0 - manpower * 0.012)
    adjusted_score = max(0.0, min(100.0, adjusted_score))
    
    # Step 4: Apply barricades effect (Radius Squeezing)
    barricades = int(params.get("barricades", 0))
    effective_radius = max(100.0, 500.0 - barricades * 20.0)  # Squeeze radius by 20m per barricade
    
    # Adjust decay lambda: smaller radius -> higher decay (faster dropoff)
    # Default decay is 0.3 (at 500m baseline). We scale lambda proportionally.
    lambda_adjusted = 0.3 * (500.0 / effective_radius)
    
    # Step 5: Propagate adjusted scores
    # Reconstruct event dict for propagation
    zone_id = base_features.get("zone_id")
    adjusted_event = {
        "zone_id": zone_id,
        "congestion_score": adjusted_score
    }
    
    zone_scores = congestion_propagation.aggregate_zone_scores(
        [adjusted_event], G, zones_gdf, CACHE_DIST_PATH, lambda_decay=lambda_adjusted
    )
    
    # Step 6: Fetch alternate routes
    diversion_active = bool(params.get("diversion_active", False))
    routes_geojson = {"type": "FeatureCollection", "features": []}
    
    if diversion_active:
        if event_id:
            # Load from cache or compute live
            routes_geojson = route_engine.get_route_for_event(G, event_id)
        else:
            # Compute live for hypothetical event
            nearest_node = graph_utils.get_nearest_node(G, lat, lon)
            dest_node = route_engine.find_downstream_node(G, nearest_node, target_distance_m=2000)
            blocked = route_engine.get_blocked_edges(G, lat, lon, radius_m=effective_radius)
            routes = route_engine.compute_alternate_routes(G, nearest_node, dest_node, blocked)
            routes_geojson = route_engine.routes_to_geojson(G, routes, adjusted_score)
            
    # Step 7: Allocate resources across affected zones
    allocations = resource_allocator.allocate_resources(
        zone_scores, total_police=manpower, total_barricades=barricades
    )
    
    # Step 8: Compute delay saved (assuming 100 score corresponds to 120 minutes max duration)
    base_duration = base_score / 100.0 * 120.0
    adjusted_duration = adjusted_score / 100.0 * 120.0
    delay_saved = round(max(0.0, base_duration - adjusted_duration))
    
    return {
        "zone_scores": zone_scores,
        "predicted_duration_minutes": int(round(adjusted_duration)),
        "high_impact": adjusted_score >= 75.0,
        "delay_saved_minutes": int(delay_saved),
        "alternate_routes": routes_geojson.get("features", []),  # Schema expects List[ZoneResponse] which is list of features
        "resource_allocation": {
            z_id: {"police": alloc["police"], "barricades": alloc["barricades"]}
            for z_id, alloc in allocations.items()
        }
    }

if __name__ == '__main__':
    # Test simulator logic
    req = {
        "event_type": "unplanned",
        "latitude": 13.0400041,
        "longitude": 77.5180991,
        "start_datetime": "2024-03-07T17:01:48.111000+00:00"
    }
    p = {
        "manpower": 10,
        "barricades": 5,
        "diversion_active": True,
        "start_time_offset_minutes": 30
    }
    res = run_simulation(req, p)
    print("Simulated predicted duration:", res["predicted_duration_minutes"])
    print("Simulated delay saved (mins):", res["delay_saved_minutes"])
    print("Alternate routes count:", len(res["alternate_routes"]))
