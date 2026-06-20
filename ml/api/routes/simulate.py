from fastapi import APIRouter

from ml.api.schemas import SimulateRequest, SimulateResponse

router = APIRouter()


@router.post("/", response_model=SimulateResponse, tags=["simulate"])
async def simulate(req: SimulateRequest):
    """Run a simulation request (Phase 2 scaffold returns dummy results)."""
    # Dummy response matching schema
    resp = SimulateResponse(
        zone_scores={},
        predicted_duration_minutes=0,
        high_impact=False,
        delay_saved_minutes=0,
        alternate_routes=[],
        resource_allocation={},
    )
    return resp
