import os
import pandas as pd
from fastapi import APIRouter
from typing import List

from ml.api.schemas import ViolationPoint

router = APIRouter()

# Resolve data path
src_dir = os.path.dirname(os.path.abspath(__file__))
ml_dir = os.path.dirname(os.path.dirname(src_dir))
violations_path = os.path.join(ml_dir, "data", "processed", "violations_clean.csv")

# Pre-load heatmap data on startup
_heatmap_cache = None

def _build_heatmap():
    global _heatmap_cache
    if _heatmap_cache is not None:
        return _heatmap_cache
    if not os.path.exists(violations_path):
        _heatmap_cache = []
        return _heatmap_cache
    df = pd.read_csv(violations_path)
    # Drop rows with missing coordinates
    df = df.dropna(subset=["latitude", "longitude"])
    # Group by rounded latitude and longitude to preserve unique coordinates
    df["lat_r"] = df["latitude"].round(4)
    df["lon_r"] = df["longitude"].round(4)
    grouped = df.groupby(["lat_r", "lon_r"]).size().reset_index(name="count")
    grouped = grouped.rename(columns={"lat_r": "lat", "lon_r": "lon"})
    _heatmap_cache = [
        ViolationPoint(lat=float(r["lat"]), lon=float(r["lon"]), count=int(r["count"]))
        for _, r in grouped.iterrows()
    ]
    print(f"Heatmap cache built: {len(_heatmap_cache)} points")
    return _heatmap_cache


@router.get("/heatmap", response_model=List[ViolationPoint], tags=["violations"])
async def violations_heatmap():
    """Return heatmap points aggregated by junction/location.
    Each point includes latitude, longitude and the number of violations at that location.
    """
    return _build_heatmap()
