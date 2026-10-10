from cedarpy import is_authorized, Decision

policies = """
@id("viewer-read")
permit (
  principal in FloodSafe::Role::"viewer",
  action in [FloodSafe::Action::"ViewQueue", FloodSafe::Action::"ViewSource"],
  resource
);

@id("operator-run")
permit (
  principal in FloodSafe::Role::"operator",
  action in [FloodSafe::Action::"ViewQueue", FloodSafe::Action::"CreatePlan"],
  resource
);

@id("no-automatic-advisory")
forbid (principal, action == FloodSafe::Action::"IssueAdvisory", resource);
"""

entities = [
    {"uid": {"type": "FloodSafe::User", "id": "demo-viewer"}, "attrs": {}, "parents": [{"type": "FloodSafe::Role", "id": "viewer"}]},
    {"uid": {"type": "FloodSafe::Role", "id": "viewer"}, "attrs": {}, "parents": []},
    {"uid": {"type": "FloodSafe::User", "id": "demo-operator"}, "attrs": {}, "parents": [{"type": "FloodSafe::Role", "id": "operator"}]},
    {"uid": {"type": "FloodSafe::Role", "id": "operator"}, "attrs": {}, "parents": []}
]

res1 = is_authorized(
    {"principal": 'FloodSafe::User::"demo-viewer"', "action": 'FloodSafe::Action::"ViewQueue"', "resource": 'FloodSafe::FloodEvent::"ev1"', "context": {}},
    policies,
    entities
)
print("Viewer ViewQueue:", res1.decision == Decision.Allow, res1.diagnostics)

res2 = is_authorized(
    {"principal": 'FloodSafe::User::"demo-viewer"', "action": 'FloodSafe::Action::"CreatePlan"', "resource": 'FloodSafe::FloodEvent::"ev1"', "context": {}},
    policies,
    entities
)
print("Viewer CreatePlan:", res2.decision == Decision.Allow, res2.diagnostics)
