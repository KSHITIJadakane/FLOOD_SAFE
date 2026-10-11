"""IoT Ground Sensors & Telemetry API Router for FloodSafe."""
from __future__ import annotations
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Query, Body
from pydantic import BaseModel, Field

from backend.app.models import IoTSensorNode, IoTSensorStatus
from backend.app.storage import storage


router = APIRouter(prefix="/api/v1/iot-sensors", tags=["IoT Ground Sensors"])


class IoTTelemetryUpdate(BaseModel):
    current_water_level_m: float = Field(..., ge=0.0, description="Updated water level in meters")
    rate_of_rise_m_per_hr: Optional[float] = Field(None, description="Water rise rate")
    status: Optional[IoTSensorStatus] = Field(None, description="Updated sensor operating status")


@router.get("", response_model=List[IoTSensorNode], summary="List all in-situ IoT ground sensors")
def list_iot_sensors(ward_id: Optional[str] = Query(None, description="Filter by ward ID")) -> List[IoTSensorNode]:
    """Returns all deployed IoT hydrometric stations across municipal wards."""
    nodes = storage.get_iot_nodes()
    if ward_id:
        nodes = [n for n in nodes if n.ward_id == ward_id]
    return nodes


@router.get("/{node_id}", response_model=IoTSensorNode, summary="Get details for an IoT sensor")
def get_iot_sensor(node_id: str) -> IoTSensorNode:
    """Returns real-time telemetry for a specific IoT sensor node."""
    node = storage.get_iot_node_by_id(node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"IoT Sensor node '{node_id}' not found")
    return node


@router.patch("/{node_id}/telemetry", response_model=IoTSensorNode, summary="Simulate or update IoT telemetry reading")
def update_iot_telemetry(node_id: str, payload: IoTTelemetryUpdate) -> IoTSensorNode:
    """Updates telemetry reading for an IoT sensor station and refreshes timestamp."""
    node = storage.get_iot_node_by_id(node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"IoT Sensor node '{node_id}' not found")

    new_level = payload.current_water_level_m
    new_rise = payload.rate_of_rise_m_per_hr if payload.rate_of_rise_m_per_hr is not None else node.rate_of_rise_m_per_hr

    if payload.status:
        new_status = payload.status
    else:
        if new_level >= node.flood_threshold_m:
            new_status = IoTSensorStatus.FLOODED
        elif new_level >= node.alert_threshold_m:
            new_status = IoTSensorStatus.ALERT
        else:
            new_status = IoTSensorStatus.NORMAL

    updated_node = node.model_copy(
        update={
            "current_water_level_m": round(new_level, 2),
            "rate_of_rise_m_per_hr": round(new_rise, 2),
            "status": new_status,
            "last_heartbeat": datetime.now(timezone.utc),
        }
    )

    with storage._lock:
        storage.iot_nodes[node_id] = updated_node
        # Also update associated water sources
        for s_id, src in list(storage.sources.items()):
            if src.nearest_iot_node_id == node_id:
                up_lvl = new_level if new_status != IoTSensorStatus.OFFLINE else None
                storage.sources[s_id] = src.model_copy(
                    update={"iot_water_level_m": up_lvl, "iot_status": new_status.value}
                )

    return updated_node
