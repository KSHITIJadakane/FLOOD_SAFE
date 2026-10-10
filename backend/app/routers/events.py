"""Flood Events API Router."""
from __future__ import annotations
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from backend.app.models import CreateEventRequest, FloodEvent
from backend.app.storage import storage
from backend.app.auth import require_auth

router = APIRouter(prefix="/api/v1/flood-events", tags=["Flood Events"])


@router.get("", response_model=List[FloodEvent])
def list_flood_events() -> List[FloodEvent]:
    """Lists all active and registered flood events."""
    return storage.list_events()


@router.post("", response_model=FloodEvent, dependencies=[Depends(require_auth("CreateEvent", "FloodEvent"))])
def create_flood_event(req: CreateEventRequest) -> FloodEvent:
    """Registers a new flood event."""
    event = FloodEvent(
        name=req.name,
        event_time=req.event_time,
        geometry=req.geometry or {},
        data_version=req.data_version,
        is_synthetic=req.is_synthetic,
    )
    storage.events[event.id] = event
    return event


@router.get("/{event_id}", response_model=FloodEvent)
def get_flood_event(event_id: str) -> FloodEvent:
    """Retrieves a flood event by ID."""
    event = storage.get_event(event_id)
    if not event:
        raise HTTPException(status_code=404, detail={"code": "NOT_FOUND", "message": f"Flood event {event_id} not found."})
    return event
