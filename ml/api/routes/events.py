from fastapi import APIRouter, HTTPException
from typing import List

from ml.api.schemas import EventResponse

router = APIRouter()


@router.get("/", response_model=List[EventResponse], tags=["events"])
async def list_events():
    """Return a list of events (dummy response)."""
    return []


@router.get("/{event_id}", response_model=EventResponse, tags=["events"])
async def get_event(event_id: str):
    """Return a single event by id (dummy response)."""
    # Dummy placeholder
    raise HTTPException(status_code=404, detail="Not implemented in Phase 2 scaffold")
