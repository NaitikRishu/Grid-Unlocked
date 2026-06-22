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
EVENTS_PATH = os.path.join(ml_dir, "data", "processed", "events_ml_ready.csv")
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
        if os.path.exists(FM_PATH):
            _fm_df = pd.read_csv(FM_PATH)
        else:
            print("Feature matrix not found. Initializing dummy feature matrix.")
            _fm_df = pd.DataFrame(columns=["event_id"])
        
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
    vms_active = bool(params.get("vms_active", False))
    signal_optimized = bool(params.get("signal_optimized", False))
    clearway_enforced = bool(params.get("clearway_enforced", False))
    heavy_vehicle_restricted = bool(params.get("heavy_vehicle_restricted", False))

    adjusted_score = adjusted_score * (1.0 - manpower * 0.012)
    
    if vms_active:
        adjusted_score = adjusted_score * 0.85
        
    if heavy_vehicle_restricted:
        adjusted_score = adjusted_score * 0.90

    weather = str(params.get("weather", "sunny")).lower()
    if weather == "rainy":
        adjusted_score = adjusted_score * 1.15
    elif weather == "monsoon":
        adjusted_score = adjusted_score * 1.30
    elif weather == "thunderstorm":
        adjusted_score = adjusted_score * 1.50
        
    adjusted_score = max(0.0, min(100.0, adjusted_score))
    
    # Step 4: Apply barricades effect (Radius Squeezing)
    barricades = int(params.get("barricades", 0))
    effective_radius = max(100.0, 500.0 - barricades * 20.0)  # Squeeze radius by 20m per barricade
    if heavy_vehicle_restricted:
        effective_radius = max(100.0, effective_radius * 0.90)
    
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
    
    delay_mult = 1.0
    if signal_optimized:
        delay_mult *= 0.70
    if clearway_enforced:
        delay_mult *= 0.80
        
    if weather == "rainy":
        delay_mult *= 1.20
    elif weather == "monsoon":
        delay_mult *= 1.50
    elif weather == "thunderstorm":
        delay_mult *= 2.00

    if diversion_active:
        if event_id:
            # If detour metrics are optimized, run live routing to apply the delay multiplier
            if signal_optimized or clearway_enforced or not event_id:
                nearest_node = graph_utils.get_nearest_node(G, lat, lon)
                dest_node = route_engine.find_downstream_node(G, nearest_node, target_distance_m=2000)
                blocked = route_engine.get_blocked_edges(G, lat, lon, radius_m=effective_radius)
                routes = route_engine.compute_alternate_routes(G, nearest_node, dest_node, blocked)
                routes_geojson = route_engine.routes_to_geojson(G, routes, adjusted_score, blocked, delay_mult)
            else:
                routes_geojson = route_engine.get_route_for_event(G, event_id)
        else:
            # Compute live for hypothetical event
            nearest_node = graph_utils.get_nearest_node(G, lat, lon)
            dest_node = route_engine.find_downstream_node(G, nearest_node, target_distance_m=2000)
            blocked = route_engine.get_blocked_edges(G, lat, lon, radius_m=effective_radius)
            routes = route_engine.compute_alternate_routes(G, nearest_node, dest_node, blocked)
            routes_geojson = route_engine.routes_to_geojson(G, routes, adjusted_score, blocked, delay_mult)
            
    # Step 7: Allocate resources across affected zones
    allocations = resource_allocator.allocate_resources(
        zone_scores, total_police=manpower, total_barricades=barricades
    )
    
    # Step 8: Compute delay saved (assuming 100 score corresponds to 120 minutes max duration)
    base_duration = base_score / 100.0 * 120.0
    adjusted_duration = adjusted_score / 100.0 * 120.0
    
    extra_savings = 0.0
    if diversion_active:
        if signal_optimized:
            extra_savings += 8.0
        if clearway_enforced:
            extra_savings += 5.0
            
    delay_saved = round(max(0.0, base_duration - adjusted_duration)) + extra_savings
    
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


def recommend_interventions(event_dict_req: dict) -> dict:
    """Recommends mitigation parameters based on baseline predictions and past historical events."""
    G, zones_gdf, events_df, fm_df = load_resources()
    
    lat = float(event_dict_req.get("latitude"))
    lon = float(event_dict_req.get("longitude"))
    event_type = str(event_dict_req.get("event_type"))
    start_time_str = str(event_dict_req.get("start_datetime"))
    
    # Predict baseline score
    base_features, event_id = find_matching_event_features(lat, lon, event_type, start_time_str)
    base_prediction = predict_event(base_features)
    base_score = base_prediction["congestion_score"]
    
    # 1. Recommend manpower
    # We want base_score * (1 - manpower * 0.012) <= 40
    if base_score > 40.0:
        manpower = math.ceil((1.0 - 40.0 / base_score) / 0.012)
        manpower = max(5, min(45, manpower))
    else:
        manpower = 5
        
    # 2. Recommend barricades
    barricades = math.ceil(base_score / 5.0)
    barricades = max(2, min(20, barricades))
    
    # 3. Recommend offset
    best_offset = 0
    min_score = base_score
    offsets_to_try = [-60, -30, 0, 30, 60]
    for off in offsets_to_try:
        adjusted_features = base_features.copy()
        if off != 0:
            dt = pd.to_datetime(start_time_str, utc=True) + timedelta(minutes=off)
            adjusted_features["hour_of_day"] = dt.hour
            adjusted_features["day_of_week"] = dt.dayofweek
            adjusted_features["month"] = dt.month
            adjusted_features["is_peak_hour"] = 1 if dt.hour in [7,8,9,10,17,18,19,20] else 0
            
        pred = predict_event(adjusted_features)
        score_at_off = pred["congestion_score"]
        if score_at_off < min_score:
            min_score = score_at_off
            best_offset = off
            
    # Only recommend offset if it saves at least 3 score points
    if base_score - min_score < 3.0:
        best_offset = 0
        
    # 4. Recommend diversion active
    diversion_active = base_score >= 50.0
    
    recommended_vms_active = base_score >= 50.0
    recommended_signal_optimized = base_score >= 55.0
    recommended_clearway_enforced = base_score >= 60.0
    recommended_heavy_vehicle_restricted = base_score >= 65.0
    
    # 5. Fetch past similar events in the same zone
    zone_id = base_features.get("zone_id")
    similar_events = []
    
    if not events_df.empty and 'zone_id' in events_df.columns:
        # clean zone ids for matching
        mask = events_df['zone_id'].astype(str).apply(congestion_propagation.clean_zone_id) == zone_id
        # match same type
        mask &= events_df['event_type'].astype(str).str.lower() == event_type.lower()
        
        similar_df = events_df[mask]
        if similar_df.empty:
            # fallback: match zone only
            similar_df = events_df[events_df['zone_id'].astype(str).apply(congestion_propagation.clean_zone_id) == zone_id]
            
        if not similar_df.empty:
            # Sort by start_datetime descending to get latest
            similar_df = similar_df.sort_values(by="start_datetime", ascending=False)
            
            # Format up to 3 events
            for _, row in similar_df.head(3).iterrows():
                dur = float(row.get("event_duration_minutes", 60.0))
                if pd.isna(dur) or math.isnan(dur):
                    dur = 60.0
                similar_events.append({
                    "id": str(row["id"]),
                    "event_cause": str(row.get("event_cause", "vehicle_breakdown")),
                    "start_datetime": str(row["start_datetime"]),
                    "duration_minutes": round(dur, 1),
                    "priority": str(row.get("priority", "medium"))
                })
                
    # 6. Generate explanation
    exp = f"Based on a predicted baseline congestion score of {base_score:.1f} in zone {zone_id}, "
    exp += f"we recommend deploying {manpower} officers and {barricades} barricades. "
    if best_offset != 0:
        exp += f"A schedule shift of {best_offset} minutes is suggested to reduce peak impact to {min_score:.1f}. "
    else:
        exp += "No schedule shift is necessary. "
        
    if diversion_active:
        exp += "Activating alternate routes is highly recommended to divert traffic."
    else:
        exp += "Standard routing should suffice as the impact is localized."

    extra_recs = []
    if recommended_vms_active:
        extra_recs.append("VMS signboards")
    if recommended_signal_optimized:
        extra_recs.append("signal timing optimization")
    if recommended_clearway_enforced:
        extra_recs.append("no-parking enforcement")
    if recommended_heavy_vehicle_restricted:
        extra_recs.append("heavy vehicle restrictions")
    
    if extra_recs:
        exp += f" Additionally, consider activating: {', '.join(extra_recs)}."
        
    if similar_events:
        past_causes = list(set([e["event_cause"] for e in similar_events]))
        exp += f" Similar past incidents (such as {', '.join(past_causes[:2])}) in this ward took up to {max([e['duration_minutes'] for e in similar_events]):.1f} minutes to resolve."
        
    return {
        "recommended_manpower": manpower,
        "recommended_barricades": barricades,
        "recommended_diversion_active": diversion_active,
        "recommended_offset_minutes": best_offset,
        "recommended_signal_optimized": recommended_signal_optimized,
        "recommended_vms_active": recommended_vms_active,
        "recommended_clearway_enforced": recommended_clearway_enforced,
        "recommended_heavy_vehicle_restricted": recommended_heavy_vehicle_restricted,
        "explanation": exp,
        "similar_events": similar_events
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
    
    rec = recommend_interventions(req)
    print("Recommended manpower:", rec["recommended_manpower"])
    print("Recommended barricades:", rec["recommended_barricades"])
    print("Explanation:", rec["explanation"])

