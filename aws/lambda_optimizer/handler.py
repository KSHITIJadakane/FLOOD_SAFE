"""AWS Lambda Handler — FloodSafe Greedy Maximum Coverage Optimizer.

Serverless entry point for on-demand test-kit allocation optimization.
Triggered via API Gateway HTTP API (POST /optimize).

Reads scored water sources from DynamoDB, runs the greedy maximum-coverage
algorithm, and writes the resulting testing plan back to DynamoDB.

Request Body:
    {
        "event_id": "string",
        "budget_k": 15,
        "radius_m": 500.0,
        "sources": [...]   // Optional inline sources; if omitted, reads from DynamoDB
    }

Response:
    {
        "plan_id": "string",
        "selected_sites": [...],
        "metrics": {...},
        "budget_k": 15,
        "radius_m": 500.0
    }
"""
from __future__ import annotations
import json
import logging
import os
import uuid
import math
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, Dict, List, Set, Tuple

logger = logging.getLogger()
logger.setLevel(logging.INFO)


# ---------------------------------------------------------------------------
# Haversine Distance (standalone — no dependency on backend.app.geo_utils)
# ---------------------------------------------------------------------------

def haversine_distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance in meters between two WGS84 coordinates."""
    R = 6_371_000.0  # Earth radius in meters
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


# ---------------------------------------------------------------------------
# Greedy Maximum Coverage Optimizer (self-contained for Lambda deployment)
# ---------------------------------------------------------------------------

def greedy_max_coverage(
    sources: List[Dict[str, Any]],
    pop_units: List[Dict[str, Any]],
    budget_k: int,
    radius_m: float = 500.0,
) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
    """Runs the greedy submodular maximum-coverage allocation algorithm.

    At each step, selects the source that maximizes the marginal gain in
    unique population coverage weighted by vulnerability score.

    Args:
        sources: List of scored water source dicts with lat, lon, vulnerability_score.
        pop_units: List of population unit dicts with lat, lon, population, is_high_risk.
        budget_k: Number of testing kits available.
        radius_m: Coverage radius per testing site in meters.

    Returns:
        Tuple of (selected_sites, metrics_dict).
    """
    # Filter to high-risk population units
    hr_units = [u for u in pop_units if u.get("is_high_risk", True)]

    # Precompute: for each source, which population unit IDs are within radius
    source_coverage: Dict[str, Set[str]] = {}
    unit_pop: Dict[str, int] = {}

    for u in hr_units:
        uid = u.get("unit_id", u.get("unit_code", str(uuid.uuid4())))
        unit_pop[uid] = u.get("population", 0)

    for src in sources:
        src_id = src.get("source_id", src.get("source_code", ""))
        src_lat = src.get("latitude", 0.0)
        src_lon = src.get("longitude", 0.0)
        covered = set()
        for u in hr_units:
            uid = u.get("unit_id", u.get("unit_code", ""))
            dist = haversine_distance_m(src_lat, src_lon, u.get("latitude", 0.0), u.get("longitude", 0.0))
            if dist <= radius_m:
                covered.add(uid)
        source_coverage[src_id] = covered

    # Greedy forward selection
    selected: List[Dict[str, Any]] = []
    globally_covered: Set[str] = set()
    total_pop_covered = 0

    for step in range(min(budget_k, len(sources))):
        best_src = None
        best_marginal = -1
        best_new_units: Set[str] = set()

        for src in sources:
            src_id = src.get("source_id", src.get("source_code", ""))
            if any(s.get("source_id") == src_id or s.get("source_code") == src_id for s in selected):
                continue

            new_units = source_coverage.get(src_id, set()) - globally_covered
            marginal_pop = sum(unit_pop.get(uid, 0) for uid in new_units)
            vuln_score = src.get("vulnerability_score", src.get("relative_vulnerability_score", 0.5))
            marginal_gain = marginal_pop * vuln_score

            if marginal_gain > best_marginal:
                best_marginal = marginal_gain
                best_src = src
                best_new_units = new_units

        if best_src is None:
            break

        globally_covered |= best_new_units
        new_pop = sum(unit_pop.get(uid, 0) for uid in best_new_units)
        total_pop_covered += new_pop

        selected.append({
            "step": step + 1,
            "source_id": best_src.get("source_id", best_src.get("source_code", "")),
            "source_code": best_src.get("source_code", ""),
            "latitude": best_src.get("latitude"),
            "longitude": best_src.get("longitude"),
            "vulnerability_score": best_src.get("vulnerability_score",
                                                  best_src.get("relative_vulnerability_score", 0.0)),
            "marginal_population_covered": new_pop,
            "cumulative_population_covered": total_pop_covered,
        })

    metrics = {
        "total_population_covered": total_pop_covered,
        "total_sites_selected": len(selected),
        "budget_k": budget_k,
        "coverage_radius_m": radius_m,
        "population_per_kit": round(total_pop_covered / max(len(selected), 1), 1),
    }

    return selected, metrics


# ---------------------------------------------------------------------------
# Lambda Entry Point
# ---------------------------------------------------------------------------

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """AWS Lambda handler for POST /optimize.

    Accepts inline sources/population or reads from DynamoDB.
    Returns the optimized testing allocation plan.
    """
    logger.info("Lambda invoked: event keys=%s", list(event.keys()))

    # Parse request body
    body = event
    if "body" in event:
        body = json.loads(event["body"]) if isinstance(event["body"], str) else event["body"]

    event_id = body.get("event_id", "lambda-default")
    budget_k = int(body.get("budget_k", 15))
    radius_m = float(body.get("radius_m", 500.0))

    # Sources can be provided inline or fetched from DynamoDB
    sources = body.get("sources")
    pop_units = body.get("population_units")

    if not sources:
        # Attempt to read from DynamoDB
        try:
            import boto3
            dynamodb = boto3.resource(
                "dynamodb",
                region_name=os.getenv("AWS_REGION", "us-east-1"),
            )
            sources_table = dynamodb.Table(
                os.getenv("DYNAMODB_SOURCES_TABLE", "FloodSafe_WaterSources")
            )
            scan_resp = sources_table.scan(
                FilterExpression="event_id = :eid",
                ExpressionAttributeValues={":eid": event_id},
            )
            sources = scan_resp.get("Items", [])
            # Convert Decimal fields
            sources = json.loads(json.dumps(sources, default=str))
            logger.info("Read %d sources from DynamoDB for event %s", len(sources), event_id)
        except Exception as e:
            logger.error("Failed to read sources from DynamoDB: %s", e)
            return {
                "statusCode": 500,
                "body": json.dumps({"error": f"Could not read sources: {str(e)}"}),
            }

    if not pop_units:
        # Generate minimal synthetic population if not provided
        pop_units = _generate_minimal_pop_units(sources, radius_m)

    if not sources:
        return {
            "statusCode": 400,
            "body": json.dumps({"error": "No sources provided or found in DynamoDB"}),
        }

    # Run optimizer
    logger.info(
        "Running greedy optimizer: %d sources, K=%d, R=%.0fm",
        len(sources), budget_k, radius_m,
    )
    selected_sites, metrics = greedy_max_coverage(sources, pop_units, budget_k, radius_m)

    plan_id = f"lambda-plan-{uuid.uuid4().hex[:8]}"

    # Persist plan to DynamoDB
    try:
        import boto3
        dynamodb = boto3.resource(
            "dynamodb",
            region_name=os.getenv("AWS_REGION", "us-east-1"),
        )
        plans_table = dynamodb.Table(
            os.getenv("DYNAMODB_PLANS_TABLE", "FloodSafe_TestingPlans")
        )
        plans_table.put_item(Item={
            "plan_id": plan_id,
            "event_id": event_id,
            "budget_k": budget_k,
            "coverage_radius_m": Decimal(str(radius_m)),
            "total_sites_selected": len(selected_sites),
            "total_population_covered": metrics["total_population_covered"],
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Plan %s saved to DynamoDB", plan_id)
    except Exception as e:
        logger.warning("Could not persist plan to DynamoDB: %s", e)

    response_body = {
        "plan_id": plan_id,
        "event_id": event_id,
        "budget_k": budget_k,
        "radius_m": radius_m,
        "selected_sites": selected_sites,
        "metrics": metrics,
        "timestamp_utc": datetime.now(timezone.utc).isoformat(),
    }

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps(response_body),
    }


def _generate_minimal_pop_units(
    sources: List[Dict[str, Any]], radius_m: float
) -> List[Dict[str, Any]]:
    """Creates synthetic population units around source locations when real data is unavailable."""
    import random
    rng = random.Random(42)
    units = []
    for i, src in enumerate(sources):
        lat = float(src.get("latitude", 0))
        lon = float(src.get("longitude", 0))
        pop = int(src.get("population_served", rng.randint(200, 3000)))
        units.append({
            "unit_code": f"LAMBDA-POP-{i+1:03d}",
            "latitude": lat + rng.gauss(0, 0.003),
            "longitude": lon + rng.gauss(0, 0.003),
            "population": pop,
            "is_high_risk": rng.random() > 0.3,
        })
    return units
