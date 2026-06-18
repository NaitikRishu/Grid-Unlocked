from fastapi import APIRouter
from typing import List

from ml.api.schemas import ViolationPoint

router = APIRouter()


@router.get("/heatmap", response_model=List[ViolationPoint], tags=["violations"])
async def violations_heatmap():
    """Return heatmap points for violations (dummy response)."""
    return []
