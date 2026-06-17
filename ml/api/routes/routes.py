from fastapi import APIRouter
from typing import Any

router = APIRouter()


@router.get("/{event_id}", tags=["routes"])
async def get_routes_for_event(event_id: str) -> Any:
    """Return candidate diversion or alternate routes for an event (dummy)."""
    return []
