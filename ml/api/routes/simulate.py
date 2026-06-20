from fastapi import APIRouter

from ml.api.schemas import SimulateRequest, SimulateResponse
from ml.src.event_simulator import run_simulation

router = APIRouter()


@router.post("/", response_model=SimulateResponse, tags=["simulate"])
async def simulate(req: SimulateRequest):
    """Run a simulation request using the event simulator What-If engine."""
    event_dict_req = {
        "event_type": req.event_type,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "start_datetime": req.start_datetime
    }
    params = {
        "manpower": req.manpower,
        "barricades": req.barricades,
        "diversion_active": req.diversion_active,
        "start_time_offset_minutes": req.start_time_offset_minutes
    }
    res = run_simulation(event_dict_req, params)
    return res
