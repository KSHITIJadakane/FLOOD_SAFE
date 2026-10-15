# 🛡️ AI Engineering Rules & Operational Boundaries — FloodSafe

> **Purpose**: This document establishes non-negotiable boundaries, coding invariants, library constraints, and ethical policies for any AI agent or software engineer working on FloodSafe.

---

## 1. Ethical & Statutory Boundaries (DO NOT VIOLATE)

### 1.1 Non-Diagnostic Principle
* **Rule**: FloodSafe is a **decision-support prioritization engine**, NOT a clinical medical diagnosis system.
* **Prohibited**: Never generate text, UI labels, or API outputs that claim a water source is "diagnosed contaminated", "medically safe", or "certified potable" without physical laboratory verification.
* **Mandatory**: Always label scores as **"Relative Vulnerability Priority Signal"** and include the statutory disclaimer:
  > *"Prioritization signal for field verification, not a laboratory contamination diagnosis."*

### 1.2 The Non-Negotiable Safety Invariant
* **Rule**: Automated software systems are strictly **FORBIDDEN** from issuing public contamination advisories or evacuation warnings.
* **Implementation**: The action `IssueAdvisory` is unconditionally `forbid` in Cedar policy for **ALL** roles, including `Admin`.
* **Prohibited**: Never bypass, mock, or remove the `@id("no-automatic-advisory")` Cedar policy rule.

### 1.3 Prominent Synthetic Labeling
* **Rule**: All procedurally generated demo data must carry the flag `is_synthetic: true`.
* **Prohibited**: Never claim synthetic cluster data or simulated field results are real municipal sensor feeds.

---

## 2. Technical Stack & Library Boundaries

### 2.1 Backend (Python)
* **Allowed Frameworks**: FastAPI (async), Pydantic v2, Uvicorn.
* **Allowed Math & Geospatial**: `numpy`, `shapely`, `pandas`, `math`.
* **Allowed Security**: `cedarpy` (AWS Cedar engine). Never replace Cedar with ad-hoc Python `if/else` checks for authorization.
* **Allowed AWS Client**: `boto3`. Use DynamoDB pay-per-request tables matching `aws/template.yaml`.
* **Allowed HTTP Client**: `httpx` (async).
* **Prohibited**:
  * Do NOT add heavyweight GIS servers (e.g., GeoServer, ArcGIS server) or spatial databases (PostGIS). The app uses an optimized in-memory spatial index with DynamoDB persistence.
  * Do NOT use global mutable state without thread-safe reentrant locks (`threading.RLock`).

### 2.2 Frontend (React & TypeScript)
* **Allowed Stack**: React 18, TypeScript 5, Vite 6, Leaflet 1.9, `react-leaflet`, `lucide-react`, Axios.
* **Allowed Styling**: **Vanilla CSS Design System** using custom CSS variables (tokens) defined in `frontend/src/index.css`.
* **Strict Rule on Tailwind**: **DO NOT introduce Tailwind CSS**. The project uses a handcrafted, high-contrast modern dark/light CSS design system.
* **Prohibited**:
  * Do NOT install heavy UI component kits (e.g., MUI, Ant Design, Chakra UI).
  * Do NOT hardcode colors; always use CSS variables (e.g., `var(--brand-text)`, `var(--surface)`).

---

## 3. Data Integrity & Algorithmic Invariants

### 3.1 "No Silent Zeroes" Imputation Rule
* **Rule**: If a water source has missing sensor features (e.g., IoT node offline, missing drainage distance), the system MUST:
  1. Impute the neutral value $0.5$ (neither penalizing nor artificially clearing the source).
  2. Record the missing feature key in `missing_features`.
  3. Apply an explicit data quality confidence penalty.
  4. Tag the data quality status as `partial` or `stale` (never silently mark as `complete`).

### 3.2 Exact Weight Normalization
* **Rule**: Risk engine feature weights must strictly sum to $1.0$:
  $$\sum_{i=1}^5 w_i = 1.0 \pm 0.001$$
* Any update via `PUT /api/v1/config/risk` that fails this constraint MUST be rejected with HTTP 422.

### 3.3 Strict Submodular Coverage (No Double-Counting)
* **Rule**: When selecting testing kit sites, population units covered by a previously selected site must NOT contribute to the marginal gain of subsequent picks:
  $$\text{Gain}(s \mid S) = \sum_{u \in \text{Covered}(s) \setminus \text{Covered}(S)} \text{Pop}(u) \cdot \text{Vuln}(s)$$
* **Invariant**: The total covered population must equal the exact sum of individual marginal coverage increments.

---

## 4. Error Handling & Security Guidelines

### 4.1 Cedar Policy Evaluation
* Every authenticated endpoint must pass through `require_auth(action, resource)`.
* Denied requests must raise `HTTPException(403)` containing structured diagnostic detail:
  ```json
  {
    "code": "FORBIDDEN",
    "message": "Action 'CreatePlan' is denied for role(s) ['viewer']...",
    "action": "CreatePlan",
    "roles": ["viewer"],
    "policy_diagnostics": "Default-Deny or Forbid Policy matched"
  }
  ```

### 4.2 Graceful Offline & Cloud Fallback
* When running locally without active AWS credentials, DynamoDB calls must gracefully catch exceptions and retain state in the thread-safe in-memory repository without crashing the application.
* When Copernicus STAC API is unreachable or offline, the satellite router must seamlessly return cached verified orbital metadata.

---

## 5. Testing & Verification Requirements

* Any new feature or bugfix MUST be validated against:
  1. **Full Pytest Suite**: `python -m pytest backend/tests/ -v` (Must maintain 100% pass rate).
  2. **Specification Drift Check**: `python scripts/drift_check.py` (Must pass all 10 integrity checks).
  3. **Optimizer Empirical Test**: `python scripts/evaluate_optimizer.py` (Must verify lift over Top-K and Random baselines).
  4. **Frontend TypeScript Check**: `cd frontend && npm run build` (Must compile cleanly with zero TypeScript errors).
