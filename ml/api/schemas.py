from __future__ import annotations

from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field
from datetime import datetime


class EventResponse(BaseModel):
	id: str
	event_type: str
	lat: float
	lon: float
	zone_id: Optional[str]
	start_datetime: datetime
	end_datetime: Optional[datetime]
	duration_minutes: Optional[float]
	priority: Optional[str]
	status: Optional[str]


class GeoJSONGeometry(BaseModel):
	type: str
	coordinates: Any


class ZoneProperties(BaseModel):
	zone_id: str
	zone_name: str
	baseline_score: float


class ZoneResponse(BaseModel):
	type: Literal["Feature"] = "Feature"
	geometry: GeoJSONGeometry
	properties: ZoneProperties


class SimulateRequest(BaseModel):
	event_type: str
	latitude: float
	longitude: float
	start_datetime: str
	manpower: int = Field(..., ge=0, le=50)
	barricades: int = Field(..., ge=0, le=20)
	diversion_active: bool
	start_time_offset_minutes: int = Field(..., ge=-120, le=120)


class ResourceAllocationItem(BaseModel):
	police: int
	barricades: int


class SimulateResponse(BaseModel):
	zone_scores: Dict[str, float]
	predicted_duration_minutes: int
	high_impact: bool
	delay_saved_minutes: int
	alternate_routes: List[ZoneResponse]
	resource_allocation: Dict[str, ResourceAllocationItem]


class ViolationPoint(BaseModel):
	lat: float
	lon: float
	count: int


class ReplaySnapshot(BaseModel):
	timestamp: datetime
	zone_scores: Dict[str, float]
	progress_percent: float
