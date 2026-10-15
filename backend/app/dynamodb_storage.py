"""AWS DynamoDB Storage Backend for FloodSafe.

Provides persistent storage using Amazon DynamoDB for assessment runs,
testing plans, and Cedar authorization audit logs.

Activated via USE_DYNAMODB=true environment variable.
Falls back gracefully to in-memory storage when DynamoDB is unavailable.
"""
from __future__ import annotations
import json
import os
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# DynamoDB table names (matching aws/template.yaml)
WATER_SOURCES_TABLE = os.getenv("DYNAMODB_SOURCES_TABLE", "FloodSafe_WaterSources")
TESTING_PLANS_TABLE = os.getenv("DYNAMODB_PLANS_TABLE", "FloodSafe_TestingPlans")
AUDIT_LOG_TABLE = os.getenv("DYNAMODB_AUDIT_TABLE", "FloodSafe_AuditLog")


def _get_dynamodb_resource():
    """Lazily initializes boto3 DynamoDB resource."""
    import boto3

    region = os.getenv("AWS_REGION", os.getenv("AWS_DEFAULT_REGION", "us-east-1"))
    return boto3.resource("dynamodb", region_name=region)


def _decimal_default(obj):
    """JSON serializer that handles Decimal types from DynamoDB."""
    if isinstance(obj, Decimal):
        if obj % 1 == 0:
            return int(obj)
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def _convert_floats_to_decimal(data: Any) -> Any:
    """Recursively converts float values to Decimal for DynamoDB compatibility."""
    if isinstance(data, float):
        return Decimal(str(data))
    elif isinstance(data, dict):
        return {k: _convert_floats_to_decimal(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [_convert_floats_to_decimal(item) for item in data]
    return data


class DynamoDBStorage:
    """DynamoDB-backed storage for FloodSafe assessment results and audit logs.

    Connects to real AWS DynamoDB tables defined in aws/template.yaml.
    Requires valid AWS credentials (via environment, IAM role, or AWS CLI profile).
    """

    def __init__(self):
        self._dynamodb = None
        self._tables: Dict[str, Any] = {}
        self._initialized = False

    def _ensure_initialized(self):
        """Lazy initialization of DynamoDB connection."""
        if self._initialized:
            return
        try:
            self._dynamodb = _get_dynamodb_resource()
            self._tables = {
                "sources": self._dynamodb.Table(WATER_SOURCES_TABLE),
                "plans": self._dynamodb.Table(TESTING_PLANS_TABLE),
                "audit": self._dynamodb.Table(AUDIT_LOG_TABLE),
            }
            self._initialized = True
            logger.info(
                "DynamoDB storage initialized: tables=[%s, %s, %s]",
                WATER_SOURCES_TABLE,
                TESTING_PLANS_TABLE,
                AUDIT_LOG_TABLE,
            )
        except Exception as e:
            logger.error("Failed to initialize DynamoDB: %s", e)
            raise

    # -----------------------------------------------------------------------
    # Assessment Results Storage
    # -----------------------------------------------------------------------

    def save_assessment_result(
        self,
        assessment_run_id: str,
        event_id: str,
        scored_sources: List[Dict[str, Any]],
        plan_metrics: Optional[Dict[str, Any]] = None,
    ) -> None:
        """Persists a completed assessment run and its scored sources to DynamoDB.

        Each scored source is written as an individual item to the WaterSources table,
        keyed by source_id, with the assessment_run_id as metadata.
        """
        self._ensure_initialized()
        sources_table = self._tables["sources"]

        with sources_table.batch_writer() as batch:
            for src in scored_sources:
                item = {
                    "source_id": src["source_id"],
                    "assessment_run_id": assessment_run_id,
                    "event_id": event_id,
                    "source_code": src.get("source_code", ""),
                    "vulnerability_score": Decimal(
                        str(src.get("relative_vulnerability_score", 0.0))
                    ),
                    "risk_band": src.get("band", "unknown"),
                    "latitude": Decimal(str(src.get("latitude", 0.0))),
                    "longitude": Decimal(str(src.get("longitude", 0.0))),
                    "population_served": src.get("population_served", 0),
                    "data_quality": src.get("data_quality", "unknown"),
                    "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                }
                # Add feature contributions if present
                contributions = src.get("feature_contributions")
                if contributions:
                    item["feature_contributions"] = _convert_floats_to_decimal(
                        contributions
                    )
                batch.put_item(Item=item)

        logger.info(
            "Saved %d scored sources for assessment %s to DynamoDB",
            len(scored_sources),
            assessment_run_id,
        )

    # -----------------------------------------------------------------------
    # Testing Plan Storage
    # -----------------------------------------------------------------------

    def save_testing_plan(
        self,
        plan_id: str,
        event_id: str,
        budget_k: int,
        radius_m: float,
        selected_sites: List[Dict[str, Any]],
        metrics: Dict[str, Any],
    ) -> None:
        """Writes a completed testing allocation plan to DynamoDB."""
        self._ensure_initialized()
        plans_table = self._tables["plans"]

        item = {
            "plan_id": plan_id,
            "event_id": event_id,
            "budget_k": budget_k,
            "coverage_radius_m": Decimal(str(radius_m)),
            "total_selected_sites": len(selected_sites),
            "total_population_covered": metrics.get("total_population_covered", 0),
            "population_per_kit": Decimal(
                str(metrics.get("population_per_kit", 0.0))
            ),
            "selected_source_ids": [s.get("source_id", "") for s in selected_sites],
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        }

        # Store full plan metrics
        if metrics:
            item["metrics"] = json.loads(
                json.dumps(metrics, default=_decimal_default)
            )
            item["metrics"] = _convert_floats_to_decimal(item["metrics"])

        plans_table.put_item(Item=item)
        logger.info("Saved testing plan %s to DynamoDB", plan_id)

    def get_testing_plan(self, plan_id: str, event_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a testing plan from DynamoDB by composite key."""
        self._ensure_initialized()
        plans_table = self._tables["plans"]

        response = plans_table.get_item(
            Key={"plan_id": plan_id, "event_id": event_id}
        )
        item = response.get("Item")
        if item:
            return json.loads(json.dumps(item, default=_decimal_default))
        return None

    # -----------------------------------------------------------------------
    # Cedar Authorization Audit Log
    # -----------------------------------------------------------------------

    def log_cedar_decision(
        self,
        user_id: str,
        roles: List[str],
        action: str,
        resource: str,
        decision: str,
        diagnostics: Optional[str] = None,
    ) -> None:
        """Records a Cedar policy evaluation decision to the audit log table.

        Every authorization check (permit or deny) is logged for compliance
        and post-incident review.
        """
        self._ensure_initialized()
        audit_table = self._tables["audit"]

        timestamp = datetime.now(timezone.utc).isoformat()
        item = {
            "audit_id": f"cedar-{timestamp}-{user_id}-{action}",
            "timestamp_utc": timestamp,
            "user_id": user_id,
            "roles": roles,
            "action": action,
            "resource": resource,
            "decision": decision,
            "diagnostics": diagnostics or "",
        }
        audit_table.put_item(Item=item)
        logger.info(
            "Cedar audit logged: user=%s action=%s decision=%s",
            user_id,
            action,
            decision,
        )

    def get_recent_audit_entries(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Scans recent Cedar audit log entries (most recent first)."""
        self._ensure_initialized()
        audit_table = self._tables["audit"]

        response = audit_table.scan(Limit=limit)
        items = response.get("Items", [])
        # Convert Decimals for JSON serialization
        return json.loads(json.dumps(items, default=_decimal_default))


# ---------------------------------------------------------------------------
# Factory: Choose storage backend based on environment
# ---------------------------------------------------------------------------

_dynamodb_instance: Optional[DynamoDBStorage] = None


def get_dynamodb_storage() -> Optional[DynamoDBStorage]:
    """Returns a DynamoDB storage instance if USE_DYNAMODB is enabled.

    Returns None if DynamoDB is not configured, allowing the caller
    to fall back to in-memory storage.
    """
    global _dynamodb_instance
    if not os.getenv("USE_DYNAMODB", "").lower() in ("true", "1", "yes"):
        return None

    if _dynamodb_instance is None:
        _dynamodb_instance = DynamoDBStorage()
    return _dynamodb_instance
