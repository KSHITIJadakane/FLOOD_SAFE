"""Cedar Policy-Based Authorization for FloodSafe.

Evaluates AWS Cedar policies using cedarpy with strict default-deny semantics.
"""
from __future__ import annotations
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple
from cedarpy import Decision, is_authorized
from fastapi import Header, HTTPException, Request, Depends
from backend.app.config import get_project_root


def load_cedar_policies() -> str:
    """Loads all .cedar policy files from policies/ directory."""
    root = get_project_root()
    policy_dir = root / "policies"
    if not policy_dir.exists():
        return ""
    policies = []
    for p in sorted(policy_dir.glob("*.cedar")):
        policies.append(p.read_text(encoding="utf-8"))
    return "\n\n".join(policies)


# Cache loaded policies
CEDAR_POLICIES = load_cedar_policies()


def build_cedar_entities(user_id: str, roles: List[str]) -> List[Dict[str, Any]]:
    """Builds Cedar entity hierarchy linking User -> Roles."""
    entities = [
        {
            "uid": {"type": "FloodSafe::User", "id": user_id},
            "attrs": {},
            "parents": [{"type": "FloodSafe::Role", "id": r} for r in roles],
        }
    ]
    for r in roles:
        entities.append({
            "uid": {"type": "FloodSafe::Role", "id": r},
            "attrs": {},
            "parents": [],
        })
    return entities


def authorize(
    user_id: str,
    roles: List[str],
    action: str,
    resource: str,
    context: Optional[Dict[str, Any]] = None,
) -> None:
    """
    Evaluates request authorization against Cedar policy set.
    Raises HTTPException 403 with detailed diagnostics if denied.
    """
    policies = CEDAR_POLICIES or load_cedar_policies()
    entities = build_cedar_entities(user_id, roles)

    request_payload = {
        "principal": f'FloodSafe::User::"{user_id}"',
        "action": f'FloodSafe::Action::"{action}"',
        "resource": resource,
        "context": context or {},
    }

    result = is_authorized(request_payload, policies, entities)

    # Log Cedar decision to DynamoDB audit trail if configured
    decision_str = "ALLOW" if result.decision == Decision.Allow else "DENY"
    try:
        from backend.app.dynamodb_storage import get_dynamodb_storage
        dynamo = get_dynamodb_storage()
        if dynamo:
            dynamo.log_cedar_decision(
                user_id=user_id,
                roles=roles,
                action=action,
                resource=resource,
                decision=decision_str,
                diagnostics=str(result.diagnostics) if hasattr(result, 'diagnostics') else None,
            )
    except Exception:
        pass  # Audit logging is best-effort; never block authorization flow

    if result.decision != Decision.Allow:
        raise HTTPException(
            status_code=403,
            detail={
                "code": "FORBIDDEN",
                "message": f"Action '{action}' is denied for role(s) {roles} on {resource} under Cedar authorization policy.",
                "action": action,
                "roles": roles,
                "policy_diagnostics": "Default-Deny or Forbid Policy matched (no matching permit rule found for role)",
            },
        )


def get_current_user_and_role(
    x_demo_user: Optional[str] = Header(default="demo-operator"),
    x_demo_role: Optional[str] = Header(default="operator"),
) -> Tuple[str, List[str]]:
    user = x_demo_user or "demo-operator"
    role = x_demo_role or "operator"
    return user, [role]


def require_auth(action: str, resource_type: str = "FloodEvent"):
    def dependency(
        request: Request,
        user_info: Tuple[str, List[str]] = Depends(get_current_user_and_role),
    ):
        user_id, roles = user_info
        resource_id = "default"
        resource = f'FloodSafe::{resource_type}::"{resource_id}"'

        context = {}
        # If recording field test, evaluate verification status context
        if action == "RecordFieldTest":
            # Context will be checked within the endpoint logic if dynamic
            pass

        authorize(user_id, roles, action, resource, context)
        return user_info

    return dependency
