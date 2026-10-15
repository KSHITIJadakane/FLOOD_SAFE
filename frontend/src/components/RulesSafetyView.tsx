import React, { useState } from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, Scale, FileText, ChevronDown, ChevronUp, Filter, Sparkles } from 'lucide-react';

interface RuleItem {
  id: string;
  num: string;
  title: string;
  category: 'algorithmic' | 'governance';
  summary: string;
  spec: string;
  icon: any;
  statusColor: string;
  codeSnippet?: string;
}

const RULES: RuleItem[] = [
  {
    id: 'rule-01',
    num: 'RULE 01',
    title: 'Never Claim Contamination',
    category: 'algorithmic',
    summary: 'The risk engine computes relative vulnerability priority only—never diagnosing medical potability or asserting contamination without lab proof.',
    spec: 'Prevents mass panic and maintains statutory public health boundaries. Outputs are strictly labeled as triage priority metrics for testing kit deployment.',
    icon: ShieldAlert,
    statusColor: 'var(--danger)',
  },
  {
    id: 'rule-02',
    num: 'RULE 02',
    title: 'Transparent Explainability',
    category: 'algorithmic',
    summary: 'Every scored water asset exposes exact linear component contributions that sum strictly to the composite vulnerability score.',
    spec: 'Score = 0.35·Inundation + 0.25·Drainage + 0.15·Historical + 0.15·PopDensity + 0.10·SourceType. 100% auditable with zero black-box weights.',
    icon: Scale,
    statusColor: 'var(--brand-text)',
    codeSnippet: 'Score = w1*Inundation + w2*Drainage + w3*Historical + w4*PopDensity + w5*SourceType',
  },
  {
    id: 'rule-03',
    num: 'RULE 03',
    title: 'No Silent Zeroes (Neutral Imputation)',
    category: 'algorithmic',
    summary: 'Missing remote sensing or sensor telemetry inputs are imputed with neutral 0.5 values with explicit data quality penalty flags.',
    spec: 'Ensures water sources with broken sensors or heavy cloud cover are never falsely classified as zero risk. Data quality penalty (e.g. -0.05) clearly logged.',
    icon: AlertTriangle,
    statusColor: 'var(--warning)',
  },
  {
    id: 'rule-04',
    num: 'RULE 04',
    title: 'Greedy Max Coverage Without Double-Counting',
    category: 'governance',
    summary: 'Testing allocation enforces non-overlapping geodesic radii (R = 500m) to maximize unique population protected under kit budget K.',
    spec: 'Submodular greedy optimization achieves provable (1 - 1/e) ≈ 63.2% theoretical approximation, delivering empirical +194.1% coverage lift over naive Top-K.',
    icon: CheckCircle2,
    statusColor: 'var(--brand-text)',
  },
  {
    id: 'rule-05',
    num: 'RULE 05',
    title: 'Strict Default-Deny Cedar Authorization',
    category: 'governance',
    summary: 'AWS Cedar authorization defaults to deny. Action IssueAdvisory is forbidden across all roles; verified field tests require Admin authority.',
    spec: 'Enforced via cedarpy with cryptographically timestamped records streamed directly to Amazon DynamoDB.',
    icon: Lock,
    statusColor: 'var(--data-blue)',
    codeSnippet: '@id("no-automatic-advisory")\nforbid (principal, action == FloodSafe::Action::"IssueAdvisory", resource);',
  },
  {
    id: 'rule-06',
    num: 'RULE 06',
    title: 'Prominent Synthetic Demo Labeling',
    category: 'governance',
    summary: 'All dashboard views, API response payloads (is_synthetic: true), and exported CSV/JSON files prominently feature synthetic demo data disclosures.',
    spec: 'Prevents accidental misuse in real-world crisis operations by enforcing synthetic labeling across 100% of generated data entities.',
    icon: FileText,
    statusColor: 'var(--ink-label)',
  },
];

export const RulesSafetyView: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'algorithmic' | 'governance'>('all');
  const [expandedRule, setExpandedRule] = useState<string | null>(null);

  const filteredRules = RULES.filter((r) => filter === 'all' || r.category === filter);

  const toggleExpand = (id: string) => {
    setExpandedRule(expandedRule === id ? null : id);
  };

  return (
    <div className="rules-view-container animate-fade-in" style={{ marginTop: 24 }}>
      {/* Header with Category Filter Clubbing */}
      <div className="panel-paper" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div className="mono-eyebrow" style={{ marginBottom: 4 }}>
              <span className="dot" />
              <span>05 / GOVERNANCE & COMPLIANCE ARCHITECTURE</span>
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.02em', margin: 0, color: 'var(--ink)' }}>
              Standing Rules & Safety Boundaries
            </h2>
            <p style={{ fontSize: 13, color: 'var(--ink-body)', marginTop: 4, marginBottom: 0 }}>
              Systemic safeguards and non-negotiables enforced across all algorithmic triage models and AWS Cedar policies.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--tint)', padding: 4, borderRadius: 'var(--radius-pill)', border: '1px solid var(--line-card)' }}>
            <button
              className={`btn btn-compact ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}
              onClick={() => setFilter('all')}
            >
              ALL RULES ({RULES.length})
            </button>
            <button
              className={`btn btn-compact ${filter === 'algorithmic' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}
              onClick={() => setFilter('algorithmic')}
            >
              ALGORITHMIC & MATH (3)
            </button>
            <button
              className={`btn btn-compact ${filter === 'governance' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ fontSize: 12, padding: '4px 12px', borderRadius: 'var(--radius-pill)' }}
              onClick={() => setFilter('governance')}
            >
              GOVERNANCE & CEDAR (3)
            </button>
          </div>
        </div>
      </div>

      {/* Accordion / Clubbed Rule Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filteredRules.map((rule) => {
          const Icon = rule.icon;
          const isExpanded = expandedRule === rule.id;

          return (
            <div
              key={rule.id}
              className="panel-paper"
              style={{
                cursor: 'pointer',
                transition: 'all 140ms ease',
                border: isExpanded ? '1px solid var(--brand-ring-soft)' : '1px solid var(--line-card)',
                background: isExpanded ? 'var(--tint)' : 'var(--panel)',
                padding: '16px 20px',
              }}
              onClick={() => toggleExpand(rule.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--surface)',
                      border: '1px solid var(--line-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: rule.statusColor,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} />
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 700, color: 'var(--brand-text)' }}>
                        {rule.num}
                      </span>
                      <span style={{ fontSize: 11, background: 'var(--tint)', padding: '1px 6px', borderRadius: 4, color: 'var(--ink-label)', textTransform: 'uppercase', fontFamily: 'var(--mono)' }}>
                        {rule.category}
                      </span>
                      <h4 style={{ margin: 0, fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>
                        {rule.title}
                      </h4>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--ink-body)', marginTop: 4 }}>
                      {rule.summary}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-label)' }}>
                  <span style={{ fontSize: 11, fontFamily: 'var(--mono)' }}>
                    {isExpanded ? 'COLLAPSE' : 'DETAILS'}
                  </span>
                  {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>

              {/* Collapsible Detail Drawer */}
              {isExpanded && (
                <div
                  className="animate-fade-in"
                  style={{
                    marginTop: 16,
                    paddingTop: 14,
                    borderTop: '1px solid var(--line-card)',
                    fontSize: 13,
                    color: 'var(--ink-body)',
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                    Formal Technical Specification:
                  </div>
                  <div style={{ lineHeight: 1.6, marginBottom: rule.codeSnippet ? 12 : 0 }}>
                    {rule.spec}
                  </div>

                  {rule.codeSnippet && (
                    <pre
                      style={{
                        background: 'var(--surface)',
                        color: 'var(--ink)',
                        border: '1px solid var(--line-card)',
                        padding: '10px 14px',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 12,
                        fontFamily: 'var(--mono)',
                        margin: 0,
                        overflowX: 'auto',
                      }}
                    >
                      {rule.codeSnippet}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
