import os
import json
import pandas as pd
from fastapi import APIRouter
from typing import List

from ml.api.schemas import ZoneResponse, GeoJSONGeometry, ZoneProperties
from ml.src.congestion_propagation import clean_zone_id

router = APIRouter()

src_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.dirname(os.path.dirname(src_dir))

zones_geojson_path = os.path.join(ml_dir, "data", "geo", "bengaluru_zones.geojson")
zone_scores_path = os.path.join(ml_dir, "data", "processed", "zone_scores.csv")

# Compute baseline scores on startup
baseline_scores = {}
if os.path.exists(zone_scores_path):
    print("Pre-calculating baseline zone scores from zone_scores.csv...")
    df_scores = pd.read_csv(zone_scores_path)
    avg_scores = df_scores.groupby("zone_id")["score"].mean().to_dict()
    baseline_scores = {clean_zone_id(k): float(v) for k, v in avg_scores.items()}
    print(f"Loaded baseline scores for {len(baseline_scores)} zones.")

@router.get("/", response_model=List[ZoneResponse], tags=["zones"])
async def list_zones():
    """Return a list of zones as GeoJSON Features with baseline scores."""
    if not os.path.exists(zones_geojson_path):
        return []
        
    with open(zones_geojson_path, "r") as f:
        geojson_data = json.load(f)
        
    features = geojson_data.get("features", [])
    response_features = []
    
    for feat in features:
        props = feat.get("properties", {})
        raw_zone_id = props.get("KGISWardNo")
        zone_id = clean_zone_id(raw_zone_id)
        zone_name = props.get("KGISWardName", "Unknown")
        score = baseline_scores.get(zone_id, 0.0)
        
        response_features.append(
            ZoneResponse(
                type="Feature",
                geometry=GeoJSONGeometry(
                    type=feat.get("geometry", {}).get("type", "Polygon"),
                    coordinates=feat.get("geometry", {}).get("coordinates", [])
                ),
                properties=ZoneProperties(
                    zone_id=zone_id,
                    zone_name=zone_name,
                    baseline_score=score
                )
            )
        )
        
    return response_features
