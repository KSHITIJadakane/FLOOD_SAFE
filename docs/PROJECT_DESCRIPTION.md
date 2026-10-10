# Project Description

## 1. Executive summary
FloodSafe is a post-flood water-source vulnerability triage and testing-allocation system. It combines flood exposure, source characteristics, drainage proximity, historical indicators, and population served into a transparent relative-priority score, then selects a limited set of sites to test so that as much high-risk population as possible is covered.

It sits between flood information and field verification. It answers:
1. Which sources appear most vulnerable on available evidence?
2. Why was each prioritized?
3. With K tests, which set covers the most high-risk population?
4. How do priorities change when new field evidence arrives?

## 2. Problem
After a flood, authorities may have hundreds of sources to assess with limited field teams, rapid-test kits, lab capacity, transport, and time. Sorting by one factor (or by geography) can send teams to clustered sites that cover the same people repeatedly.

**Problem statement:** *How can a response team use incomplete but explainable geographic and infrastructure evidence to choose which drinking-water sources to physically test first when testing capacity is limited?*

### Decision gap
Relevant inputs are often separate, late, or incomplete: flood extent, rainfall/terrain/drainage, source inventory, population, historical incidents, field results. FloodSafe proposes one workflow to combine them, rank sources, allocate a budget, and record feedback. This is a proposed workflow, not a claim that every authority has the same data or process.

## 3. Capabilities
1. Flood-event context (boundary, exposure layer, data version/time)
2. Water-source inventory
3. Configurable relative vulnerability scoring
4. Explainable priorities
5. Spatial prioritization map
6. Testing-budget optimization (max coverage)
7. Field feedback and re-run
8. Auditability

## 4. Differentiators
- Transparent per-source explanation
- Population-aware coverage, not just a sorted list
- Constrained selection algorithm
- Feedback loop
- Clear boundary between remote estimates and lab/field verification

## 5. Goals and non-goals
**Prototype goals:** full workflow on synthetic data; per-source score + explanation; configurable K; greedy optimizer vs random baseline from real output; map + queue + reasons; field-feedback demo; visible uncertainty and synthetic labels.

**Non-goals (MVP):** remote contamination detection; replacing sampling/lab/authority; automatic advisories; sensor networks; autonomous treatment/shutoff; complex ML without labelled data; multi-agent AI for show; claiming real-world accuracy; solving all hydrology/distribution/surveillance problems.

## 6. Users
- **Primary:** Municipal Health Officer / Public Health Department — needs prioritized list, explanations, outcome review.
- **Secondary:** Water Board / PHE / Municipal Water Department — contributes inventory, infrastructure, maintenance, test status.
- **Coordinating:** disaster management, ward field teams, public-health labs, GIS teams, community representatives.

FloodSafe fits authorized workflows and never overrides statutory responsibilities.

## 7. Core user journey
1. Create incident (date, scope, data sources)
2. Load source inventory (approved or synthetic)
3. Prepare geographic features
4. Calculate priorities
5. Review explanations
6. Set test budget K
7. Optimize selection
8. Dispatch and record field results
9. Update priorities
10. Review audit trail

## 8. MVP scope
**Must:** ~500 clustered synthetic sources; simulated flood layer; scoring with stored components; queue with filter/sort; map; configurable K; greedy optimizer with explicit coverage; 1,000-run baseline; measured metrics; visible synthetic/safety labels; unit tests.

**Should:** WHY? panel; simulated field feedback + reassessment; versioned config; plan export; seeded baseline; error/empty states.

**Could:** LLM incident brief; simple AWS deploy; demo auth; road/travel-time constraints.

## 9. Open decisions
See [Open decisions in IMPLEMENTATION_PHASES.md](IMPLEMENTATION_PHASES.md#open-decisions) — each must be explicit in code and docs.
