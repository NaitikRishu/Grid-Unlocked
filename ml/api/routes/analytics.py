from fastapi import APIRouter
from typing import Any

router = APIRouter()


@router.get("/post-event", tags=["analytics"])
async def post_event_analytics() -> Any:
    """Return post-event analytics summary (dummy)."""
    return {}


@router.get("/zone-summary", tags=["analytics"])
async def zone_summary() -> Any:
    """Return zone-level analytics summary (dummy)."""
    return {}
