from fastapi import APIRouter

from ml.api.schemas import SimulateRequest, SimulateResponse, RecommendRequest, RecommendResponse
from ml.src.event_simulator import run_simulation, recommend_interventions

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
        "start_time_offset_minutes": req.start_time_offset_minutes,
        "signal_optimized": req.signal_optimized,
        "vms_active": req.vms_active,
        "clearway_enforced": req.clearway_enforced,
        "heavy_vehicle_restricted": req.heavy_vehicle_restricted,
        "weather": req.weather
    }
    res = run_simulation(event_dict_req, params)
    return res


@router.post("/recommend", response_model=RecommendResponse, tags=["simulate"])
async def recommend(req: RecommendRequest):
    """Get recommendations based on historical similar events and baseline predictions."""
    event_dict_req = {
        "event_type": req.event_type,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "start_datetime": req.start_datetime
    }
    res = recommend_interventions(event_dict_req)
    return res
