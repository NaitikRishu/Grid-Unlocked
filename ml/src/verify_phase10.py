#!/usr/bin/env python3
import os
import json
import pickle
import pandas as pd
from ml.src.event_simulator import run_simulation

src_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.dirname(src_dir)

REPLAY_PATH = os.path.join(ml_dir, "data", "processed", "replay_data.json")
ROUTE_CACHE_PATH = os.path.join(ml_dir, "data", "processed", "route_cache.pkl")
ZONE_SCORES_PATH = os.path.join(ml_dir, "data", "processed", "zone_scores.csv")

def test_outputs():
    print("=== Phase 10 Verification ===")
    
    # 1. Test event_simulator.run_simulation shape
    print("\n1. Testing event_simulator.run_simulation shape...")
    req = {
        "event_type": "unplanned",
        "latitude": 13.0400041,
        "longitude": 77.5180991,
        "start_datetime": "2024-03-07T17:01:48.111000+00:00"
    }
    params = {
        "manpower": 10,
        "barricades": 5,
        "diversion_active": True,
        "start_time_offset_minutes": 30
    }
    res = run_simulation(req, params)
    
    required_keys = [
        "zone_scores",
        "predicted_duration_minutes",
        "high_impact",
        "delay_saved_minutes",
        "alternate_routes",
        "resource_allocation"
    ]
    for key in required_keys:
        if key not in res:
            print(f"FAIL: run_simulation is missing key '{key}'")
            return False
        else:
            print(f"  - Key '{key}' check: PASSED")
            
    # 2. Test replay_data.json
    print("\n2. Checking replay_data.json...")
    if not os.path.exists(REPLAY_PATH):
        print(f"FAIL: replay_data.json not found at {REPLAY_PATH}")
        return False
        
    with open(REPLAY_PATH, "r") as f:
        replay_data = json.load(f)
        
    num_replay_events = len(replay_data)
    print(f"  - Total events in replay data: {num_replay_events}")
    if num_replay_events < 50:
        print(f"FAIL: replay_data.json has only {num_replay_events} events (need at least 50)")
        return False
    else:
        print("  - Replay event count check: PASSED (>= 50)")
        
    # Check that each event has 20 steps
    sample_key = list(replay_data.keys())[0]
    steps_len = len(replay_data[sample_key])
    print(f"  - Steps in sample replay event: {steps_len}")
    if steps_len != 20:
        print(f"FAIL: Replay event steps count is {steps_len} (expected 20)")
        return False
    else:
        print("  - Replay steps count check: PASSED (== 20)")

    # 3. Test route_cache.pkl
    print("\n3. Checking route_cache.pkl...")
    if not os.path.exists(ROUTE_CACHE_PATH):
        print(f"FAIL: route_cache.pkl not found at {ROUTE_CACHE_PATH}")
        return False
        
    with open(ROUTE_CACHE_PATH, "rb") as f:
        route_cache = pickle.load(f)
        
    num_cache_events = len(route_cache)
    print(f"  - Total events in route cache: {num_cache_events}")
    if num_cache_events < 50:
        print(f"FAIL: route_cache.pkl has only {num_cache_events} events (need at least 50)")
        return False
    else:
        print("  - Route cache event count check: PASSED (>= 50)")

    # 4. Test baseline_scores.json distributions
    print("\n4. Checking baseline_scores.json distributions...")
    baseline_scores_path = os.path.join(ml_dir, "data", "processed", "baseline_scores.json")
    if not os.path.exists(baseline_scores_path):
        print(f"FAIL: baseline_scores.json not found at {baseline_scores_path}")
        return False
        
    with open(baseline_scores_path, "r") as f:
        baseline_scores = json.load(f)
        
    print(f"  - Total zones in baseline_scores.json: {len(baseline_scores)}")
    if not baseline_scores:
        print("FAIL: baseline_scores.json is empty")
        return False
        
    scores = [float(v) for v in baseline_scores.values()]
    score_min = min(scores)
    score_max = max(scores)
    score_mean = sum(scores) / len(scores)
    print(f"  - Score stats: min={score_min:.2f}, max={score_max:.2f}, mean={score_mean:.2f}")
    if not (0 <= score_min <= 100) or not (0 <= score_max <= 100):
        print("FAIL: scores are not within [0, 100] range")
        return False
    else:
        print("  - Score distributions check: PASSED")

    print("\nALL PHASE 10 E2E VERIFICATIONS PASSED!")
    return True

if __name__ == "__main__":
    import sys
    success = test_outputs()
    if not success:
        sys.exit(1)
