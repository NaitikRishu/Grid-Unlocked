import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from ml.api.schemas import EventResponse
from ml.src.inference import predict_event

router = APIRouter()

src_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.dirname(os.path.dirname(src_dir))
events_path = os.path.join(ml_dir, "data", "processed", "events_clean.csv")
fm_path = os.path.join(ml_dir, "data", "processed", "feature_matrix.csv")

events_df = pd.DataFrame()
fm_df = pd.DataFrame()

if os.path.exists(events_path):
    events_df = pd.read_csv(events_path)

if os.path.exists(fm_path):
    fm_df = pd.read_csv(fm_path)

@router.get("/", response_model=List[EventResponse], tags=["events"])
async def list_events():
    """Return a list of events."""
    if events_df.empty:
        return []
    
    records = events_df.head(200).to_dict(orient="records")
    resp = []
    for r in records:
        resp.append({
            "id": str(r["id"]),
            "event_type": str(r["event_type"]),
            "lat": float(r["latitude"]),
            "lon": float(r["longitude"]),
            "zone_id": str(r["zone_id"]) if pd.notna(r["zone_id"]) else None,
            "start_datetime": str(r["start_datetime"]),
            "end_datetime": str(r["end_datetime"]) if pd.notna(r["end_datetime"]) else None,
            "duration_minutes": float(r["event_duration_minutes"]) if pd.notna(r["event_duration_minutes"]) else None,
            "priority": str(r["priority"]) if pd.notna(r["priority"]) else None,
            "status": str(r["status"]) if pd.notna(r["status"]) else None,
        })
    return resp

@router.get("/{event_id}", response_model=Dict[str, Any], tags=["events"])
async def get_event(event_id: str):
    """Return a single event by id and its prediction."""
    if events_df.empty or fm_df.empty:
        raise HTTPException(status_code=500, detail="Data not loaded")
        
    event_row = events_df[events_df["id"] == event_id]
    if event_row.empty:
        raise HTTPException(status_code=404, detail="Event not found")
        
    e = event_row.iloc[0]
    
    fm_row = fm_df[fm_df["event_id"] == event_id]
    if fm_row.empty:
        raise HTTPException(status_code=404, detail="Features not found for event")
        
    f = fm_row.iloc[0].to_dict()
    prediction = predict_event(f)
    
    event_obj = {
        "id": str(e["id"]),
        "event_type": str(e["event_type"]),
        "lat": float(e["latitude"]),
        "lon": float(e["longitude"]),
        "zone_id": str(e["zone_id"]) if pd.notna(e["zone_id"]) else None,
        "start_datetime": str(e["start_datetime"]),
        "duration_minutes": float(e["event_duration_minutes"]) if pd.notna(e["event_duration_minutes"]) else None,
    }
    
    return {
        "event": event_obj,
        "prediction": prediction,
        "predicted_score": prediction["congestion_score"],
        "actual_duration": event_obj["duration_minutes"]
    }
