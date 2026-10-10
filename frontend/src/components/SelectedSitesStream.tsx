import React from 'react';
import { ArrowRight, FlaskConical } from 'lucide-react';
import { TestingPlan, ScoredSource } from '../types';

interface SelectedSitesStreamProps {
  plan: TestingPlan | null;
  sources: ScoredSource[];
  onSelectSource: (source: ScoredSource) => void;
  onOpenFeedback: (sourceId: string, sourceCode: string) => void;
}

export const SelectedSitesStream: React.FC<SelectedSitesStreamProps> = ({
  plan,
  sources,
  onSelectSource,
  onOpenFeedback,
}) => {
  const sourcesMap = new Map<string, ScoredSource>();
  sources.forEach((s) => sourcesMap.set(s.source_id, s));

  const selectedList = plan ? plan.selected : [];

  return (
    <div className="stream-container-card animate-fade-in">
      <div className="stream-card-header">
        <div>
          <div className="mono-eyebrow">
            <span className="dot" />
            <span>DISPATCH SELECTION STREAM</span>
          </div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', marginTop: 2 }}>
            Selected Sites ({selectedList.length} / K={plan?.capacity_k || 15})
          </h3>
        </div>
      </div>

      <div className="stream-list-scroll">
        {selectedList.length > 0 ? (
          selectedList.map((site) => {
            const fullSource = sourcesMap.get(site.source_id);
            return (
              <div key={site.source_id} className="stream-item-row">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                  <span style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    color: 'var(--brand-text)',
                    background: 'var(--brand-tint)',
                    padding: '3px 7px',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--brand-ring-soft)',
                    flexShrink: 0,
                  }}>
                    #{site.order}
                  </span>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink)' }}>
                        {site.source_code}
                      </span>
                      <span className={`band-pill ${site.band}`}>
                        {site.band.replace('_', ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-body)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ textTransform: 'capitalize' }}>{site.source_type.replace('_', ' ')}</span>
                      <span>·</span>
                      <span>Marginal Reach: </span>
                      <strong style={{ color: 'var(--brand-text)', fontFamily: 'var(--mono)' }}>+{site.marginal_coverage.toLocaleString()}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary btn-compact"
                    style={{ height: 32, padding: '0 10px', fontSize: 12 }}
                    title="Inspect WHY? Explainability Breakdown"
                    onClick={() => {
                      if (fullSource) onSelectSource(fullSource);
                    }}
                  >
                    <span>WHY?</span>
                    <ArrowRight size={13} />
                  </button>
                  <button
                    className="btn btn-primary btn-compact"
                    style={{ height: 32, padding: '0 10px', fontSize: 12 }}
                    title="Simulate Field Test"
                    onClick={() => onOpenFeedback(site.source_id, site.source_code)}
                  >
                    <FlaskConical size={13} />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--ink-label)', fontSize: 13 }}>
            No testing plan generated yet. Click "Run Greedy Optimizer" above.
          </div>
        )}
      </div>
    </div>
  );
};
