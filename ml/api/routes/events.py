import os
import pandas as pd
from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any

from ml.api.schemas import EventResponse, CreateEventRequest
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

@router.get("", response_model=List[EventResponse], tags=["events"])
async def list_events():
    """Return a list of events."""
    if events_df.empty:
        return []
    
    # Drop rows with missing critical fields before parsing
    valid_events = events_df.dropna(subset=["id", "start_datetime", "latitude", "longitude"]).head(200)
    records = valid_events.to_dict(orient="records")
    
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
    if events_df.empty:
        raise HTTPException(status_code=500, detail="Events data not loaded")
        
    event_row = events_df[events_df["id"] == event_id]
    if event_row.empty:
        raise HTTPException(status_code=404, detail="Event not found")
        
    e = event_row.iloc[0]
    
    if fm_df.empty or event_id not in fm_df["event_id"].values:
        f = e.to_dict()
        f["event_id"] = f.get("id")
    else:
        fm_row = fm_df[fm_df["event_id"] == event_id]
        if fm_row.empty:
            f = e.to_dict()
            f["event_id"] = f.get("id")
        else:
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


import time

@router.post("", response_model=EventResponse, tags=["events"])
async def create_event(req: CreateEventRequest):
    global events_df
    # generate a unique id
    new_id = f"CUSTOM{int(time.time())}"
    
    # Estimate ward/zone of the event
    zone_id = None
    # Let's import event simulator resources to find the closest zone
    from ml.src.event_simulator import load_resources
    import math
    from ml.src import congestion_propagation
    _, zones_gdf, _, _ = load_resources()
    if zones_gdf is not None and not zones_gdf.empty:
        min_dist = float('inf')
        for idx, row in zones_gdf.iterrows():
            centroid = row.geometry.centroid
            dist = math.hypot(centroid.y - req.latitude, centroid.x - req.longitude)
            if dist < min_dist:
                min_dist = dist
                zone_id = congestion_propagation.clean_zone_id(row['KGISWardNo'])
                
    # append row
    new_row = {
        "id": new_id,
        "event_type": req.event_type,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "start_datetime": req.start_datetime,
        "priority": req.priority,
        "event_cause": req.event_cause,
        "status": "active",
        "event_duration_minutes": 180.0, # default 3 hours for planned match/events
        "zone_id": zone_id
    }
    # Append using pandas
    new_df = pd.DataFrame([new_row])
    events_df = pd.concat([events_df, new_df], ignore_index=True)
    events_df.to_csv(events_path, index=False)
    
    # Reload from disk
    events_df = pd.read_csv(events_path)
    
    return {
        "id": new_row["id"],
        "event_type": new_row["event_type"],
        "lat": new_row["latitude"],
        "lon": new_row["longitude"],
        "zone_id": str(new_row["zone_id"]) if new_row["zone_id"] else None,
        "start_datetime": new_row["start_datetime"],
        "end_datetime": None,
        "duration_minutes": new_row["event_duration_minutes"],
        "priority": new_row["priority"],
        "status": new_row["status"]
    }
