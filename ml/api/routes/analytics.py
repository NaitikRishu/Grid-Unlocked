import os
import json
import pandas as pd
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
import math

from ml.src import inference

router = APIRouter()
replay_router = APIRouter()

src_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.dirname(os.path.dirname(src_dir))
events_path = os.path.join(ml_dir, "data", "processed", "events_clean.csv")
fm_path = os.path.join(ml_dir, "data", "processed", "feature_matrix.csv")
replay_path = os.path.join(ml_dir, "data", "processed", "replay_data.json")

_events_df = None
_fm_df = None
_replay_data = None

def load_data():
    global _events_df, _fm_df
    if _events_df is None:
        if os.path.exists(events_path):
            _events_df = pd.read_csv(events_path)
        else:
            _events_df = pd.DataFrame()
            
    if _fm_df is None:
        if os.path.exists(fm_path):
            _fm_df = pd.read_csv(fm_path)
        else:
            _fm_df = pd.DataFrame()
            
    return _events_df, _fm_df

def load_replay_data():
    global _replay_data
    if _replay_data is None:
        if not os.path.exists(replay_path):
            raise FileNotFoundError("Replay data not generated")
        try:
            with open(replay_path, "r") as f:
                _replay_data = json.load(f)
        except Exception as e:
            raise ValueError(f"Malformed JSON: {str(e)}")
    return _replay_data


@replay_router.get("/{event_id}", tags=["replay"])
async def get_replay(event_id: str) -> List[Dict[str, Any]]:
    """Return replay snapshots for a given event ID."""
    try:
        try:
            data = load_replay_data()
        except FileNotFoundError:
            raise HTTPException(status_code=404, detail="Replay data not generated")
        except ValueError as e:
            raise HTTPException(status_code=500, detail=str(e))
            
        if event_id in data:
            return data[event_id]
        return []
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/post-event", tags=["analytics"])
async def post_event_analytics() -> List[Dict[str, Any]]:
    """Return post-event analytics summary."""
    try:
        events_df, fm_df = load_data()
        if events_df.empty:
            return []
            
        valid_events = events_df.dropna(subset=["id", "event_duration_minutes", "event_type", "zone_id"])
        
        if valid_events.empty:
            return []
            
        inference_list = []
        event_meta = []
        
        for _, row in valid_events.iterrows():
            event_id = str(row["id"])
            e_dict = row.to_dict()
            e_dict["event_id"] = event_id
            
            if not fm_df.empty and event_id in fm_df["event_id"].values:
                fm_row = fm_df[fm_df["event_id"] == event_id]
                if not fm_row.empty:
                    e_dict.update(fm_row.iloc[0].to_dict())
            
            inference_list.append(e_dict)
            event_meta.append({
                "event_id": event_id,
                "event_type": str(row["event_type"]),
                "zone_id": str(row["zone_id"]),
                "actual_duration": float(row["event_duration_minutes"])
            })
            
        predictions = inference.predict_batch(inference_list)
        
        results = []
        for i in range(len(event_meta)):
            meta = event_meta[i]
            pred = predictions[i]
            score = pred["congestion_score"]
            predicted_duration = (score / 100.0) * 120.0
            actual_duration = meta["actual_duration"]
            
            error_percent = abs(predicted_duration - actual_duration) / max(actual_duration, 1.0) * 100.0
            
            if math.isnan(error_percent) or math.isinf(error_percent):
                error_percent = 0.0
                
            results.append({
                "event_id": meta["event_id"],
                "event_type": meta["event_type"],
                "zone_id": meta["zone_id"],
                "predicted_duration": round(predicted_duration, 2),
                "actual_duration": round(actual_duration, 2),
                "error_percent": round(error_percent, 2)
            })
            
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/zone-summary", tags=["analytics"])
async def zone_summary() -> List[Dict[str, Any]]:
    """Return zone-level analytics summary."""
    try:
        events_df, _ = load_data()
        if events_df.empty:
            return []
            
        valid_zones = events_df.dropna(subset=["zone_id", "event_type"])
        if valid_zones.empty:
            return []
            
        results = []
        grouped = valid_zones.groupby("zone_id")
        
        for zone_id, group in grouped:
            event_count = len(group)
            top_event_type = group["event_type"].mode().iloc[0] if not group["event_type"].mode().empty else "Unknown"
            
            durations = group["event_duration_minutes"].dropna()
            avg_duration = durations.mean() if not durations.empty else 0.0
            
            if math.isnan(avg_duration) or math.isinf(avg_duration):
                avg_duration = 0.0
                
            avg_violations_7d = 0.0
            
            results.append({
                "zone_id": str(zone_id),
                "avg_duration": round(avg_duration, 2),
                "event_count": int(event_count),
                "top_event_type": str(top_event_type),
                "avg_violations_7d": float(avg_violations_7d)
            })
            
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
