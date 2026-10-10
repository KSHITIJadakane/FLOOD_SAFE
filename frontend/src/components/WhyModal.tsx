import React, { useEffect, useState } from 'react';
import { X, HelpCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { ScoredSource } from '../types';
import { fetchSourceDetail } from '../services/api';

interface WhyModalProps {
  source: ScoredSource | null;
  onClose: () => void;
}

export const WhyModal: React.FC<WhyModalProps> = ({ source, onClose }) => {
  const [detail, setDetail] = useState<ScoredSource | null>(source);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (source) {
      setLoading(true);
      fetchSourceDetail(source.source_id)
        .then((data) => setDetail(data))
        .catch(() => setDetail(source))
        .finally(() => setLoading(false));
    }
  }, [source]);

  if (!source) return null;

  const current = detail || source;
  const contribEntries = Object.entries(current.feature_contributions || {});

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-dialog-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        {/* Eyebrow & Title */}
        <div className="mono-eyebrow">
          <span className="dot" />
          <span>VULNERABILITY EXPLAINABILITY BREAKDOWN</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '6px 0 18px 0' }}>
          <h2 style={{ fontSize: 26, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
            {current.source_code}
          </h2>
          <span className={`band-pill ${current.band}`}>
            {current.band.replace('_', ' ')}
          </span>
          <span style={{ fontSize: 13, color: 'var(--ink-body)', textTransform: 'capitalize' }}>
            ({current.source_type.replace('_', ' ')})
          </span>
        </div>

        {/* Score Card */}
        <div style={{ background: 'var(--tint)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-container)', padding: 18, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              RELATIVE VULNERABILITY SCORE
            </div>
            <div style={{ fontSize: 36, fontWeight: 600, color: 'var(--brand-text)', fontFamily: 'var(--mono)', lineHeight: 1.1, marginTop: 4 }}>
              {current.relative_vulnerability_score.toFixed(2)}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase' }}>Data Quality Rating</div>
            <div style={{ fontSize: 16, fontWeight: 600, fontFamily: 'var(--mono)', color: current.quality_score === 1 ? 'var(--success)' : 'var(--warning)', marginTop: 4 }}>
              {(current.quality_score * 100).toFixed(0)}% ({current.data_quality})
            </div>
          </div>
        </div>

        {/* Automated Explanation Narrative */}
        <div style={{ marginBottom: 20 }}>
          <div className="mono-eyebrow">
            <span className="dot" />
            <span>TRIAGE REASONING NARRATIVE</span>
          </div>
          <p style={{ fontSize: 14, color: 'var(--ink-body)', lineHeight: 1.55, background: 'var(--surface)', padding: 16, border: '1px solid var(--line-card)', borderRadius: 'var(--radius-container)' }}>
            {current.explanation || 'Calculating exact feature breakdown...'}
          </p>
        </div>

        {/* Component Contributions Breakdown */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div className="mono-eyebrow" style={{ margin: 0 }}>
              <span className="dot" />
              <span>EXACT COMPONENT CONTRIBUTIONS</span>
            </div>
            <span style={{ fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink-label)' }}>
              SUM: <strong>{current.relative_vulnerability_score.toFixed(2)}</strong>
            </span>
          </div>

          {contribEntries.length > 0 ? (
            contribEntries.map(([name, val]) => {
              const isMissing = current.missing_features?.includes(name);
              const pct = (val / 0.35) * 100;
              return (
                <div key={name} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--ink)', marginBottom: 4 }}>
                    <span style={{ textTransform: 'capitalize', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {name.replace(/_/g, ' ')}
                      {isMissing && (
                        <span style={{ background: 'var(--tint)', border: '1px solid var(--line-card)', color: 'var(--warning)', fontSize: 10, fontFamily: 'var(--mono)', padding: '1px 6px', textTransform: 'uppercase' }}>
                          NEUTRAL (0.5)
                        </span>
                      )}
                    </span>
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--ink)' }}>
                      +{val.toFixed(3)}
                    </span>
                  </div>
                  <div style={{ height: 6, background: 'var(--tint)', border: '1px solid var(--line-card)', borderRadius: 2, overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(pct, 100)}%`,
                        background: isMissing ? 'var(--warning)' : 'var(--brand)',
                      }}
                    />
                  </div>
                </div>
              );
            })
          ) : (
            <div style={{ fontSize: 13, color: 'var(--ink-muted)' }}>No contribution data.</div>
          )}
        </div>

        {/* Dynamic Spatial Contamination Uplift Propagation Section (Option A) */}
        {((current.spatial_uplift && current.spatial_uplift > 0) || (current.uplift_sources && current.uplift_sources.length > 0)) && (
          <div style={{ marginBottom: 20, background: 'var(--tint)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-container)', padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div className="mono-eyebrow" style={{ margin: 0, color: 'var(--danger)' }}>
                <span className="dot" style={{ background: 'var(--danger)' }} />
                <span>DYNAMIC SPATIAL CONTAMINATION UPLIFT</span>
              </div>
              <span style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 700, color: 'var(--danger)' }}>
                +{(current.spatial_uplift || 0).toFixed(3)}
              </span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--ink-body)', marginBottom: 8 }}>
              Exponential distance decay (<code style={{ fontFamily: 'var(--mono)' }}>σ=400m</code>) &amp; hydrological drainage gradient (<code style={{ fontFamily: 'var(--mono)' }}>1.35x downstream</code>) superposed from verified abnormal field tests:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {current.uplift_sources?.map((up, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5, fontFamily: 'var(--mono)', background: 'var(--surface)', padding: '6px 10px', border: '1px solid var(--line-card)' }}>
                  <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Source {up.source_code}</span>
                  <span style={{ color: 'var(--ink-body)' }}>{Math.round(up.distance_m)}m away ({up.drainage_relation})</span>
                  <span style={{ color: 'var(--danger)', fontWeight: 700 }}>+{up.decayed_uplift.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Non-Negotiable Disclaimer */}
        <div style={{ background: 'var(--tint)', borderLeft: '3px solid var(--warning)', padding: 14, fontSize: 12.5, color: 'var(--ink-body)', lineHeight: 1.45 }}>
          <strong style={{ color: 'var(--ink)', textTransform: 'uppercase', fontFamily: 'var(--mono)', fontSize: 11 }}>Non-Negotiable Disclaimer:</strong> {current.disclaimer || 'Prioritization signal for physical field verification, not a medical or contamination diagnosis.'}
        </div>
      </div>
    </div>
  );
};
