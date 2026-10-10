// ==============================================================================
// FloodSafe AWS Cedar Policy Definitions
// Default: DENY. Access must be granted by explicit permit rules.
// Forbid rules override permit rules.
// ==============================================================================

// 1. Viewer Role: Read-only access to queue, map, source details, and plans
@id("viewer-read")
permit (
  principal in FloodSafe::Role::"viewer",
  action in [
    FloodSafe::Action::"ViewQueue",
    FloodSafe::Action::"ViewSource",
    FloodSafe::Action::"ViewPlan"
  ],
  resource
);

// 2. Operator Role: Viewer abilities + Event creation, assessments, and planning
@id("operator-run")
permit (
  principal in FloodSafe::Role::"operator",
  action in [
    FloodSafe::Action::"ViewQueue",
    FloodSafe::Action::"ViewSource",
    FloodSafe::Action::"ViewPlan",
    FloodSafe::Action::"CreateEvent",
    FloodSafe::Action::"RunAssessment",
    FloodSafe::Action::"CreatePlan"
  ],
  resource
);

// 3. Field Recorder Role: Record field test results (simulated/unverified)
@id("field-record")
permit (
  principal in FloodSafe::Role::"field_recorder",
  action == FloodSafe::Action::"RecordFieldTest",
  resource
);

// 4. Admin Role: Full administrative access
@id("admin-all")
permit (
  principal in FloodSafe::Role::"admin",
  action in [
    FloodSafe::Action::"ViewAudit",
    FloodSafe::Action::"RecordFieldTest",
    FloodSafe::Action::"RunAssessment",
    FloodSafe::Action::"CreatePlan",
    FloodSafe::Action::"CreateEvent",
    FloodSafe::Action::"ViewQueue",
    FloodSafe::Action::"ViewSource",
    FloodSafe::Action::"ViewPlan"
  ],
  resource
);

// ==============================================================================
// SAFETY BOUNDARIES & FORBID RULES
// ==============================================================================

// Rule A: Verified field results are restricted to administrators only.
@id("verified-admin-only")
forbid (
  principal,
  action == FloodSafe::Action::"RecordFieldTest",
  resource
)
when {
  context.verification_status == "verified"
}
unless {
  principal in FloodSafe::Role::"admin"
};

// Rule B: Human statutory authority — system never issues public water advisories.
@id("no-automatic-advisory")
forbid (
  principal,
  action == FloodSafe::Action::"IssueAdvisory",
  resource
);
