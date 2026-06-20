import os
from fastapi import APIRouter, HTTPException
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
    """Return cached alternate routes for the given event_id.

    Returns a GeoJSON FeatureCollection with LineString features representing
    diversion routes.  Each feature includes route_label and
    estimated_delay_minutes in its properties.

    Raises HTTP 404 if no routes exist for the requested event_id.
    """
    try:
        geojson = get_route_for_event(G, event_id)
        # get_route_for_event returns an empty FeatureCollection when the
        # event cannot be resolved.  Treat that as "not found".
        if not geojson.get("features"):
            raise HTTPException(status_code=404, detail="Route not found")
        return geojson
    except HTTPException:
        # Re-raise explicit HTTP errors (404 above).
        raise
    except Exception as e:
        print(f"Error in get_routes_for_event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
