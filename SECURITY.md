# Security Policy

## Supported Versions
| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Security Architecture & Invariants
1. **Default-Deny Access Control**: All authorization is governed by AWS Cedar (`policies/floodsafe.cedar`). Unauthenticated or unauthorized callers receive `403 FORBIDDEN`.
2. **Mandatory Safety Boundary**: The action `IssueAdvisory` is unconditionally `FORBID` across all user roles (including Admin) to eliminate the possibility of automated public panic advisories.
3. **Data Integrity**: All synthetic resources are strictly isolated with `is_synthetic=True`.

## Reporting a Vulnerability
If you discover a security vulnerability in FloodSafe, please submit a report to `security@floodsafe.dev` rather than opening a public GitHub issue.
