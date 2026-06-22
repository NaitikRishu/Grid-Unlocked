#!/usr/bin/env python3
"""replay_generator.py - Phase 9 Replay Generator

Precomputes 20-step replay congestion propagation snapshots for historical events.
"""
import os
import json
import math
import pickle
import pandas as pd
import geopandas as gpd
from datetime import datetime, timedelta

from ml.src import congestion_propagation
from ml.src.graph_utils import load_graph

# Define paths
src_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.dirname(src_dir)
ZONES_PATH = os.path.join(ml_dir, "data", "geo", "bengaluru_zones.geojson")
EVENTS_PATH = os.path.join(ml_dir, "data", "processed", "events_ml_ready.csv")
CACHE_DIST_PATH = os.path.join(ml_dir, "data", "processed", "zone_distances.pkl")
OUTPUT_PATH = os.path.join(ml_dir, "data", "processed", "replay_data.json")

def generate_replay_data():
    print("Loading resources for Replay Generator...")
    if not os.path.exists(EVENTS_PATH):
        print(f"Error: {EVENTS_PATH} not found.")
        return
        
    G = load_graph()
    zones_gdf = gpd.read_file(ZONES_PATH)
    events_df = pd.read_csv(EVENTS_PATH)
    
    # We take the first 200 events to pre-compute
    target_events = events_df.head(200)
    replay_data = {}
    
    total = len(target_events)
    print(f"Pre-computing 20-step replay for {total} events...")
    
    for idx, row in target_events.reset_index(drop=True).iterrows():
        event_id = str(row["id"])
        zone_id = congestion_propagation.clean_zone_id(row.get("zone_id"))
        
        if not zone_id:
            continue
            
        duration = float(row["event_duration_minutes"]) if pd.notna(row["event_duration_minutes"]) else 60.0
        base_score = min(max(duration / 120.0 * 100.0, 0.0), 100.0)
        
        start_time_str = str(row["start_datetime"])
        try:
            start_dt = pd.to_datetime(start_time_str, utc=True)
        except Exception:
            start_dt = datetime.now()
            
        snapshots = []
        for t in range(20):
            # progress percent
            progress = round((t / 19.0) * 100.0, 1)
            # score multiplier using sine curve
            multiplier = math.sin(math.pi * t / 19.0)
            score = max(0.0, base_score * multiplier)
            
            # calculate timestamp at step t
            step_time = start_dt + timedelta(minutes=t * (duration / 19.0))
            
            # run propagation for the single event at step t
            event_dict = {"zone_id": zone_id, "congestion_score": score}
            zone_scores = congestion_propagation.aggregate_zone_scores(
                [event_dict], G, zones_gdf, CACHE_DIST_PATH, lambda_decay=0.3
            )
            
            snapshots.append({
                "timestamp": step_time.isoformat(),
                "zone_scores": zone_scores,
                "progress_percent": progress
            })
            
        replay_data[event_id] = snapshots
        
        if (idx + 1) % 20 == 0 or (idx + 1) == total:
            print(f" -> Computed replay data for {idx + 1}/{total} events...")
            
    print(f"Saving replay data to {OUTPUT_PATH}...")
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w") as f:
        json.dump(replay_data, f)
        
    print("Replay Generator precomputation complete!")

if __name__ == '__main__':
    generate_replay_data()
