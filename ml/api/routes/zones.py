from fastapi import APIRouter
from typing import List

from ml.api.schemas import ZoneResponse, GeoJSONGeometry, ZoneProperties

router = APIRouter()


@router.get("/", response_model=List[ZoneResponse], tags=["zones"])
async def list_zones():
    """Return a list of zones as GeoJSON Features (dummy response)."""
    return []
