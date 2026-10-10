# Authorization with Cedar

FloodSafe uses [Cedar](https://www.cedarpolicy.com/), an AWS open-source policy language, to decide who may do what. Policies live in `backend/policies/`, are versioned in git, and are evaluated by the API on every protected request. Default is **deny**.

## 1. Why Cedar fits
- The project already has roles and a human-authority rule; Cedar expresses them as readable policies.
- `forbid` policies encode safety boundaries ("no automatic advisory") so they cannot be overridden by a `permit`.
- Policies are testable and reviewable by non-programmers (health officers).

## 2. Roles
| Role | Can do |
| --- | --- |
| viewer | view queue, map, source details, plans |
| operator | viewer + create events, run assessments, create plans |
| field_recorder | record **simulated/unverified** field tests |
| admin | everything above + record **verified** results, view audit |

## 3. Actions and resources
Actions: `ViewQueue`, `ViewSource`, `ViewPlan`, `CreateEvent`, `RunAssessment`, `CreatePlan`, `RecordFieldTest`, `ViewAudit`, `IssueAdvisory`.
`IssueAdvisory` exists only so a policy can explicitly forbid it: the system never issues public advisories.

## 4. Schema (excerpt)
```cedar
namespace FloodSafe {
  entity Role;
  entity User in [Role];
  entity FloodEvent;
  entity Plan;
  entity Source;

  action ViewQueue, ViewSource, ViewPlan appliesTo {
    principal: User, resource: [FloodEvent, Source, Plan]
  };
  action CreateEvent, RunAssessment, CreatePlan appliesTo {
    principal: User, resource: FloodEvent
  };
  action RecordFieldTest appliesTo {
    principal: User, resource: Source,
    context: { verification_status: String }
  };
  action ViewAudit appliesTo { principal: User, resource: FloodEvent };
  action IssueAdvisory appliesTo { principal: User, resource: FloodEvent };
}
```

## 5. Policies
```cedar
@id("viewer-read")
permit (
  principal in FloodSafe::Role::"viewer",
  action in [FloodSafe::Action::"ViewQueue", FloodSafe::Action::"ViewSource",
             FloodSafe::Action::"ViewPlan"],
  resource
);

@id("operator-run")
permit (
  principal in FloodSafe::Role::"operator",
  action in [FloodSafe::Action::"ViewQueue", FloodSafe::Action::"ViewSource",
             FloodSafe::Action::"ViewPlan", FloodSafe::Action::"CreateEvent",
             FloodSafe::Action::"RunAssessment", FloodSafe::Action::"CreatePlan"],
  resource
);

@id("field-record")
permit (
  principal in FloodSafe::Role::"field_recorder",
  action == FloodSafe::Action::"RecordFieldTest",
  resource
);

@id("admin-all")
permit (
  principal in FloodSafe::Role::"admin",
  action in [FloodSafe::Action::"ViewAudit", FloodSafe::Action::"RecordFieldTest",
             FloodSafe::Action::"RunAssessment", FloodSafe::Action::"CreatePlan",
             FloodSafe::Action::"CreateEvent", FloodSafe::Action::"ViewQueue",
             FloodSafe::Action::"ViewSource", FloodSafe::Action::"ViewPlan"],
  resource
);

// Only admins may mark a result as verified.
@id("verified-admin-only")
forbid (
  principal,
  action == FloodSafe::Action::"RecordFieldTest",
  resource
)
when { context.verification_status == "verified" }
unless { principal in FloodSafe::Role::"admin" };

// Human authority: the system never issues public advisories.
@id("no-automatic-advisory")
forbid (principal, action == FloodSafe::Action::"IssueAdvisory", resource);
```

## 6. FastAPI integration (sketch)
Verify the exact function signature against the package you install (`cedarpy` shown).
```python
# backend/app/auth.py
from pathlib import Path
from cedarpy import is_authorized, Decision
from fastapi import Depends, HTTPException

POLICIES = "\n".join(p.read_text() for p in Path("policies").glob("*.cedar"))

def authorize(user_id: str, roles: list[str], action: str,
              resource: str, context: dict | None = None) -> None:
    entities = [
        {"uid": {"type": "FloodSafe::User", "id": user_id}, "attrs": {},
         "parents": [{"type": "FloodSafe::Role", "id": r} for r in roles]},
        *({"uid": {"type": "FloodSafe::Role", "id": r}, "attrs": {}, "parents": []}
          for r in roles),
    ]
    result = is_authorized(
        {"principal": f'FloodSafe::User::"{user_id}"',
         "action": f'FloodSafe::Action::"{action}"',
         "resource": resource,
         "context": context or {}},
        POLICIES, entities)
    if result.decision != Decision.Allow:
        raise HTTPException(403, detail={"code": "FORBIDDEN", "action": action})
```
Demo identities can be a fixed set of fake users passed in an `X-Demo-User` header. Label this clearly as **demo auth, not production-secure**.

## 7. Tests (pytest)
- viewer cannot `RunAssessment`
- operator can `CreatePlan`
- field_recorder can record `simulated`, cannot record `verified`
- admin can record `verified`
- `IssueAdvisory` denied for every role, including admin
- unknown role: default deny

## 8. Demo moment (15 seconds)
Switch to the viewer role, click "Run plan", show the 403 and the policy ID that denied it. Then show the `no-automatic-advisory` policy file. This makes "where AWS fits" visible on screen.
