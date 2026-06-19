import os
from fastapi import APIRouter
from typing import Any

from ml.src.graph_utils import load_graph
from ml.src.route_engine import get_route_for_event

router = APIRouter()

# Load graph on startup
print("Loading road graph in routes router...")
G = load_graph()
print("Road graph loaded in routes router.")


@router.get("/{event_id}", tags=["routes"])
async def get_routes_for_event(event_id: str) -> Any:
    """Return candidate diversion or alternate routes for an event."""
    try:
        geojson = get_route_for_event(G, event_id)
        return geojson
    except Exception as e:
        print(f"Error in get_routes_for_event: {e}")
        return {"type": "FeatureCollection", "features": []}
