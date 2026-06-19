#!/usr/bin/env python3
"""feature_engineering.py - Phase 3 Feature Engineering

Builds temporal, spatial, and event-based features and targets.
"""
import os
import pandas as pd
import numpy as np

def main():
    src_dir = os.path.dirname(os.path.abspath(__file__))
    ml_dir = os.path.dirname(src_dir)
    
    events_path = os.path.join(ml_dir, "data", "processed", "events_clean.csv")
    violations_path = os.path.join(ml_dir, "data", "processed", "violations_clean.csv")
    output_path = os.path.join(ml_dir, "data", "processed", "feature_matrix.csv")
    
    print("Loading datasets...")
    events = pd.read_csv(events_path)
    violations = pd.read_csv(violations_path)
    
    print("Parsing datetimes...")
    events["start_datetime"] = pd.to_datetime(events["start_datetime"], utc=True)
    events["end_datetime"] = pd.to_datetime(events["end_datetime"], utc=True)
    
    # Fill missing end_datetime using event_duration_minutes
    events["end_datetime"] = events["end_datetime"].fillna(
        events["start_datetime"] + pd.to_timedelta(events["event_duration_minutes"].fillna(0), unit='m')
    )
    
    violations["created_datetime"] = pd.to_datetime(violations["created_datetime"], utc=True)
    
    # 1. Temporal Features
    print("Building temporal features...")
    events["hour_of_day"] = events["start_datetime"].dt.hour
    events["day_of_week"] = events["start_datetime"].dt.dayofweek
    events["month"] = events["start_datetime"].dt.month
    events["is_peak_hour"] = events["hour_of_day"].apply(lambda x: 1 if x in [7,8,9,10,17,18,19,20] else 0)
    
    # 2. Event-level Features
    print("Building event-level features...")
    events["requires_road_closure"] = events["requires_road_closure"].fillna(False).astype(int)
    
    priority_map = {"high": 3, "medium": 2, "low": 1}
    events["priority_encoded"] = events["priority"].str.lower().map(priority_map).fillna(1).astype(int)
    
    top_8 = events["event_type"].value_counts().nlargest(8).index.tolist()
    events["event_type_clean"] = events["event_type"].apply(lambda x: x if x in top_8 else "other")
    event_type_dummies = pd.get_dummies(events["event_type_clean"], prefix="event_type").astype(int)
    events = pd.concat([events, event_type_dummies], axis=1)
    
    events["response_lag_minutes"] = events["response_lag_minutes"].fillna(events["response_lag_minutes"].median())
    
    # 3. Spatial / Historical Features
    print("Building spatial/historical features...")
    
    print(" -> violation_density_7d")
    violations_clean = violations.dropna(subset=['junction_name']).copy()
    violations_clean = violations_clean.sort_values("created_datetime")
    
    def count_violations(row):
        junc = row["junction"]
        if pd.isna(junc):
            return 0
        end_time = row["start_datetime"]
        start_time = end_time - pd.Timedelta(days=7)
        
        subset = violations_clean[violations_clean["junction_name"] == junc]
        mask = (subset["created_datetime"] >= start_time) & (subset["created_datetime"] <= end_time)
        return mask.sum()
    
    events["violation_density_7d"] = events.apply(count_violations, axis=1)
    
    print(" -> historical_avg_duration")
    hist_avg = events.groupby(["event_type", "zone_id"])["event_duration_minutes"].mean().reset_index()
    hist_avg.rename(columns={"event_duration_minutes": "historical_avg_duration"}, inplace=True)
    events = events.merge(hist_avg, on=["event_type", "zone_id"], how="left")
    events["historical_avg_duration"] = events["historical_avg_duration"].fillna(events["event_duration_minutes"].mean())
    
    print(" -> concurrent_events_in_zone")
    events_sorted = events.sort_values("start_datetime").reset_index(drop=True)
    concurrent_counts = []
    
    for idx, row in events_sorted.iterrows():
        zone = row["zone_id"]
        if pd.isna(zone):
            concurrent_counts.append(0)
            continue
        start = row["start_datetime"]
        end = row["end_datetime"]
        
        subset = events_sorted[events_sorted["zone_id"] == zone]
        overlap = (subset["start_datetime"] < end) & (subset["end_datetime"] > start)
        count = overlap.sum() - 1
        concurrent_counts.append(max(0, count))
        
    events_sorted["concurrent_events_in_zone"] = concurrent_counts
    events = events_sorted
    
    # 4. Targets
    print("Building targets...")
    events["congestion_score"] = np.clip(events["event_duration_minutes"] / 120 * 100, 0, 100).fillna(0)
    events["high_impact"] = (events["congestion_score"] >= 75).astype(int)
    
    # 5. Export
    print("Exporting feature_matrix.csv...")
    events = events.rename(columns={"id": "event_id"})
    
    feature_cols = [
        "event_id", "zone_id",
        "hour_of_day", "day_of_week", "month", "is_peak_hour",
        "requires_road_closure", "priority_encoded", "response_lag_minutes",
        "violation_density_7d", "historical_avg_duration", "concurrent_events_in_zone",
        "congestion_score", "high_impact"
    ]
    one_hot_cols = [c for c in events.columns if c.startswith("event_type_") and c != "event_type_clean"]
    feature_cols.extend(one_hot_cols)
    
    final_df = events[feature_cols].copy()
    
    # Fill remaining numerical NaNs explicitly with 0 or mean
    for col in ["hour_of_day", "day_of_week", "month", "violation_density_7d", "concurrent_events_in_zone"]:
        final_df[col] = final_df[col].fillna(0)
        
    print("Running Validations...")
    assert final_df["event_id"].duplicated().sum() == 0, "Duplicate event_id found"
    assert len(final_df) == len(events), f"Row count mismatch, expected {len(events)}, got {len(final_df)}"
    assert (final_df["congestion_score"] < 0).sum() == 0, "Negative congestion_score found"
    assert (final_df["congestion_score"] > 100).sum() == 0, "congestion_score > 100 found"
    assert set(final_df["high_impact"].unique()).issubset({0, 1}), "high_impact has values other than 0, 1"
    
    # Check nulls
    null_counts = final_df.isna().sum()
    print("Null counts:\n", null_counts[null_counts > 0])
    
    final_df.to_csv(output_path, index=False)
    print(f"Feature matrix successfully generated at {output_path} with shape {final_df.shape}")

if __name__ == '__main__':
    main()
