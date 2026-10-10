# Data Model

PostgreSQL + PostGIS. Keep **raw input attributes** separate from **derived feature values** where this helps traceability. The schema may evolve.

## 1. Spatial reference system
- Store geometries in EPSG:4326 (lon/lat) for interchange.
- Compute metric distances/buffers in a **projected CRS suited to the area of interest** (e.g., a UTM zone) or with PostGIS `geography`. **Never** compute metres on raw degrees.
- Document the chosen CRS in `geo_utils.py` and test with known-distance examples.

## 2. Tables

### flood_events
| Field | Type | Purpose |
| --- | --- | --- |
| id | uuid PK | incident id |
| name | text | human-readable |
| event_time | timestamptz | event date/time |
| geometry | geometry(MultiPolygon,4326) | incident / flood boundary |
| data_version | text | input layer version |
| is_synthetic | bool | true for demo |
| status | text | draft / active / closed |
| created_at | timestamptz | |

### water_sources
| Field | Type | Purpose |
| --- | --- | --- |
| id | uuid PK | |
| source_code | text unique | e.g. SYN-047 |
| location | geometry(Point,4326) | |
| source_type | text | well, public_tap, storage_point, ... |
| ward_id | text null | |
| population_served | int null | estimate |
| population_provenance | text | |
| drain_distance_m | float null | |
| flood_exposure | float null | derived/imported indicator |
| historical_risk | float null | with provenance |
| source_vulnerability | float null | rule-based |
| data_quality_status | text | complete / partial / stale |
| is_synthetic | bool | |
| created_at, updated_at | timestamptz | |

### population_units
`id, event_id, geometry (point or polygon), population, is_high_risk, is_synthetic` — the unit that the optimizer marks as covered.

### risk_assessments
| Field | Purpose |
| --- | --- |
| id, event_id, source_id | keys |
| risk_score | relative vulnerability score |
| risk_band | display band |
| feature_values | JSONB normalized values (nullable per feature) |
| feature_contributions | JSONB weighted contributions |
| missing_features | text[] |
| config_version, data_version | provenance |
| confidence_or_quality | data-quality indicator |
| created_at | |

### testing_plans
`id, event_id, capacity_k, coverage_definition (JSONB: type, radius_m), objective, algorithm_version, config (JSONB), assessment_run_id, random_seed, created_at`

### testing_plan_sites
`plan_id, source_id, selection_order, marginal_coverage, covered_unit_ids (int[]/uuid[])`

### field_tests
| Field | Purpose |
| --- | --- |
| id, event_id, source_id | keys |
| observed_at | observation time |
| recorded_by | authorized team reference (restricted) |
| test_type | rapid / lab / inspection |
| result_category, result_status | outcome |
| value, unit | where relevant |
| verification_status | `simulated` / `unverified` / `verified` |
| notes | |

A simulated result is always flagged and kept distinct from verified results.

## 3. Example DDL (excerpt)
```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE water_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_code text UNIQUE NOT NULL,
  location geometry(Point, 4326) NOT NULL,
  source_type text NOT NULL,
  ward_id text,
  population_served integer CHECK (population_served >= 0),
  drain_distance_m double precision CHECK (drain_distance_m >= 0),
  flood_exposure double precision CHECK (flood_exposure BETWEEN 0 AND 1),
  historical_risk double precision CHECK (historical_risk BETWEEN 0 AND 1),
  source_vulnerability double precision CHECK (source_vulnerability BETWEEN 0 AND 1),
  data_quality_status text NOT NULL DEFAULT 'partial',
  is_synthetic boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_sources_location ON water_sources USING GIST (location);
```

## 4. Layer provenance (every imported/derived layer)
Dataset name & provider · source URL/reference · license · retrieval/observation timestamp · CRS & resolution · processing steps & version · known gaps · **real / synthetic / simulated**.

## 5. Rules
- Synthetic IDs and visible labels in UI, API, exports.
- No confidential municipal data, personal data, or credentials in the repo.
- Restrict access to field-worker identifiers and sensitive operational fields.
