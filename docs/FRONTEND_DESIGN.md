# Frontend Design

Stack: React, Vite, TypeScript, React-Leaflet, Axios, Lucide, optional Tailwind. Basemap must show required attribution.

## 1. Global rules
- Persistent banner when data is synthetic/simulated: **"SYNTHETIC DEMO DATA — not real infrastructure"**.
- Always say **"relative vulnerability priority"**; never "contaminated".
- Do not rely on color alone — add labels/icons/patterns and ARIA text.
- Show data timestamp, version, and missing/stale indicators.
- Simulated results carry a visible **SIMULATED** badge distinct from **VERIFIED**.
- Handle loading, empty, error, and missing-data states.

## 2. Screens

### Screen 1 — Command Center
Active event + timestamp · total candidate sources · count per priority band · available test capacity (K) · modelled high-risk population coverage for selected plan · map with flood layer, sources, selected sites · synthetic label. **Avoid a "contaminated sources" counter** unless backed by verified results.

### Screen 2 — Risk Map
Layers: flood exposure, sources styled by band, drainage/road context, population clusters/service areas, selected sites. Layer toggles, legend, layer date and provenance. Popups link to the WHY panel.

### Screen 3 — Testing Queue
Columns: source ID · score/band · population served · ward · top contributing indicators · data quality/freshness · **selected by optimizer?** Sort/filter. Keep the **risk-ranked list** visually distinct from the **optimized plan**. Export plan (CSV/JSON).

### Screen 4 — Source "WHY?" panel
Total score · component contribution bars (raw + normalized) · missing data · timestamps · config version · plain-language explanation · warning: *a high score is a prioritization signal, not a contamination diagnosis.*

### Screen 5 — Field Feedback
Authorized user records inspection/test status and metadata. Demo provides a **simulated abnormal result** button (labelled). Triggers re-assessment and shows queue diff (before/after) without implying neighbours are contaminated.

## 3. Component tree
```text
App
├── SyntheticBanner
├── Layout (nav, event selector)
├── CommandCenter
│   ├── KpiCards, BandSummary, BudgetControl, CoverageSummary
│   └── MapView
├── RiskMap
│   ├── LayerToggle, Legend, SourceMarker, FloodLayer, SelectedSiteMarker
├── TestingQueue
│   ├── QueueTable, FilterBar, PlanBadge, ExportButton
├── SourceWhyPanel
│   ├── ContributionBars, MissingDataList, ExplanationText, Disclaimer
└── FieldFeedback
    ├── TestForm, SimulatedBadge, QueueDiff
```

## 4. State & data
- API client wraps Axios; typed with TS interfaces mirroring Pydantic schemas.
- Server state via React Query (or simple hooks); UI state local.
- Map, queue, and WHY panel all read from the same API responses so they agree.

## 5. Styling
Band palette must be color-blind-safe (e.g., sequential with distinct lightness) plus text labels. Markers use shape variation for selected-vs-not selected.

## 6. Wording
Prefer: "Higher relative vulnerability priority", "Prioritize for field verification", "Modelled population coverage", "Simulated result", "Data incomplete / confidence limited".
