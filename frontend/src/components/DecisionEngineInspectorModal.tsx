import React, { useState } from 'react';
import { X, Cpu, Compass, ShieldCheck, Sigma, Layers, CheckCircle2, ArrowDownRight, Activity, Terminal } from 'lucide-react';

interface DecisionEngineInspectorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DecisionEngineInspectorModal: React.FC<DecisionEngineInspectorModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'mcda' | 'spatial' | 'optimizer' | 'cedar'>('mcda');

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-backdrop" onClick={onClose} style={{ zIndex: 1200 }}>
      <div
        className="modal-dialog-panel custom-modal-scroll animate-fade-in"
        style={{
          maxWidth: 880,
          width: '95vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 34px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        {/* Top Eyebrow */}
        <div className="mono-eyebrow">
          <span className="dot" />
          <span>ALGORITHMIC ARCHITECTURE &amp; MATHEMATICAL PROOFS</span>
        </div>

        <div style={{ margin: '6px 0 20px 0' }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: 'var(--ink)' }}>
            AI &amp; Decision Engine Deep-Dive Inspector
          </h2>
          <p style={{ fontSize: 13.5, color: 'var(--ink-body)', marginTop: 4, lineHeight: 1.5 }}>
            Interactive verification trace of the 4-stage pipeline: Geospatial Satellite CV, Transparent Linear MCDA, Graph-Aware Spatial Contamination Decay, Submodular Greedy Optimization, and AWS Cedar Safety Guardrails.
          </p>
        </div>

        {/* Segmented Tab Navigation */}
        <div className="inspector-tab-nav">
          <button
            type="button"
            className={`inspector-tab-pill ${activeTab === 'mcda' ? 'active' : ''}`}
            onClick={() => setActiveTab('mcda')}
          >
            <Sigma size={15} />
            <span>1. Explainable MCDA</span>
          </button>
          <button
            type="button"
            className={`inspector-tab-pill ${activeTab === 'spatial' ? 'active' : ''}`}
            onClick={() => setActiveTab('spatial')}
          >
            <Compass size={15} />
            <span>2. Spatial Uplift Decay</span>
          </button>
          <button
            type="button"
            className={`inspector-tab-pill ${activeTab === 'optimizer' ? 'active' : ''}`}
            onClick={() => setActiveTab('optimizer')}
          >
            <Cpu size={15} />
            <span>3. Greedy (1-1/e) Proof</span>
          </button>
          <button
            type="button"
            className={`inspector-tab-pill ${activeTab === 'cedar' ? 'active' : ''}`}
            onClick={() => setActiveTab('cedar')}
          >
            <ShieldCheck size={15} />
            <span>4. Cedar Boundaries</span>
          </button>
        </div>

        {/* Tab 1: Explainable MCDA & Imputation */}
        {activeTab === 'mcda' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Formula Hero Card */}
            <div className="formula-callout-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brand-text)', textTransform: 'uppercase' }}>
                  CORE COMPOSITE RISK FORMULA
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)' }}>
                  LINEAR ATTRIBUTION ENGINE
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  background: 'var(--tint)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line-card)',
                  margin: '8px 0',
                  overflowX: 'auto',
                }}
              >
                S(x) = min(1.0, Σ [ w_i · f_i(x) ] + U_spatial(x))
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.5, margin: 0 }}>
                Every scored water source is represented as an exact linear sum of its standardized feature signals <code style={{ fontFamily: 'var(--mono)' }}>f_i(x) ∈ [0, 1]</code> multiplied by calibrated weights <code style={{ fontFamily: 'var(--mono)' }}>w_i</code> (Σ w_i = 1.0).
              </p>
            </div>

            {/* Feature Table */}
            <div>
              <div style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase', marginBottom: 10 }}>
                CRITERIA WEIGHTS &amp; SATELLITE DERIVATION
              </div>
              <div style={{ border: '1px solid var(--line-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                <table className="table-paper" style={{ width: '100%', margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Dimension</th>
                      <th>Weight</th>
                      <th>Satellite / GIS Extraction</th>
                      <th>Missing Policy</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><strong style={{ color: 'var(--ink)' }}>Flood Exposure</strong></td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brand-text)' }}>30% (0.30)</span></td>
                      <td>Sentinel-2 NDWI (Green - NIR) / (Green + NIR) raster</td>
                      <td><span className="band-pill moderate">Neutral (0.50)</span></td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: 'var(--ink)' }}>Drain Proximity</strong></td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brand-text)' }}>25% (0.25)</span></td>
                      <td>Euclidean &amp; hydrological distance to open stormwater canals</td>
                      <td><span className="band-pill moderate">Neutral (0.50)</span></td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: 'var(--ink)' }}>Historical Water Risk</strong></td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brand-text)' }}>15% (0.15)</span></td>
                      <td>Ward-level 3-year historical contamination incidence rates</td>
                      <td><span className="band-pill moderate">Neutral (0.50)</span></td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: 'var(--ink)' }}>Infrastructure Fragility</strong></td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brand-text)' }}>15% (0.15)</span></td>
                      <td>Well depth, surface casing seal, and mechanical pump vulnerability</td>
                      <td><span className="band-pill moderate">Neutral (0.50)</span></td>
                    </tr>
                    <tr>
                      <td><strong style={{ color: 'var(--ink)' }}>Population Density</strong></td>
                      <td><span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brand-text)' }}>15% (0.15)</span></td>
                      <td>Normalized census headcount within 500m catchment</td>
                      <td><span className="band-pill moderate">Neutral (0.50)</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Non-Negotiable Guardrails */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-sm)', padding: 18, display: 'flex', gap: 14 }}>
              <CheckCircle2 size={20} style={{ color: 'var(--brand)', flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong style={{ fontSize: 13.5, color: 'var(--ink)' }}>Strict "No Silent Zeroes" Integrity Standard</strong>
                <p style={{ fontSize: 12.5, color: 'var(--ink-body)', lineHeight: 1.55, marginTop: 4 }}>
                  If a sensor or GIS record is missing, the engine never falsely assigns 0.0 (which would bias emergency response away from a hazardous flooded site). Instead, a neutral 0.50 prior is imputed with an explicit data-quality penalty flag visible in both UI and JSON payloads.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Spatial Uplift & Hydrology */}
        {activeTab === 'spatial' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Dynamic Graph Propagation Formula Card */}
            <div className="formula-callout-card" style={{ borderLeftColor: 'var(--danger)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--danger)', textTransform: 'uppercase' }}>
                  HYDROLOGICAL DISTANCE DECAY &amp; DRAINAGE GRADIENT
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)' }}>
                  FEEDBACK LOOP
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 15,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  background: 'var(--tint)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line-card)',
                  margin: '8px 0',
                  overflowX: 'auto',
                }}
              >
                U_i(d) = U_0 · exp(-d / σ) · γ_drainage
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.5, margin: 0 }}>
                When rapid testing confirms an abnormal reading at source A, neighboring unverified sources within distance <code style={{ fontFamily: 'var(--mono)' }}>d ≤ 1200m</code> receive dynamic spatial vulnerability uplift.
              </p>
            </div>

            {/* Grid of 3 Mechanism Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 14 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-sm)', padding: 18 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase' }}>
                  CONTINUOUS DISTANCE DECAY
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--ink)', margin: '6px 0' }}>
                  σ = 400 meters
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-body)', lineHeight: 1.45 }}>
                  Exponential decay prevents sharp radius boundaries, modeling physical contaminant dilution across groundwater tables.
                </p>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-sm)', padding: 18 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase' }}>
                  DRAINAGE RUNOFF GRADIENT (γ)
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--brand-text)', margin: '6px 0' }}>
                  1.35x Downstream
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-body)', lineHeight: 1.45 }}>
                  Downstream sites in the stormwater slope receive 1.35x amplification, while upstream sites receive 0.85x attenuation.
                </p>
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-sm)', padding: 18 }}>
                <div style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase' }}>
                  SUPERPOSITION EQUATION
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--danger)', margin: '6px 0' }}>
                  U = 1 - ∏(1 - U_i)
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-body)', lineHeight: 1.45 }}>
                  Compound superposition allows multiple clustered abnormal detections to accumulate safely up to a maximum 0.40 ceiling.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Greedy Max Coverage Proof */}
        {activeTab === 'optimizer' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="formula-callout-card" style={{ borderLeftColor: 'var(--brand)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--brand-text)', textTransform: 'uppercase' }}>
                  NEMHAUSER SUBMODULAR APPROXIMATION THEOREM
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)' }}>
                  FORMAL PROOF
                </span>
              </div>
              <div
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 16,
                  fontWeight: 600,
                  color: 'var(--ink)',
                  background: 'var(--tint)',
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--line-card)',
                  margin: '8px 0',
                  overflowX: 'auto',
                }}
              >
                f(S_greedy) ≥ (1 - 1/e) · OPT ≈ 63.2% of Theoretical Optimum
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.5, margin: 0 }}>
                Maximum Coverage with non-overlapping radii (<code style={{ fontFamily: 'var(--mono)' }}>R = 500m</code>) is NP-hard. Because marginal coverage exhibits submodular diminishing returns, greedy selection is mathematically guaranteed to achieve at least 63.2% of the global optimum.
              </p>
            </div>

            {/* Comparison Callout */}
            <div style={{ background: 'var(--tint)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-md)', padding: 20 }}>
              <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 8 }}>
                Why Naive Top-K Ranking Causes Fatal Blindspots
              </h4>
              <p style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.6 }}>
                Under severe floods, the 10 most vulnerable wells often cluster in the same flooded low-lying slum block. Naive ranking dispatches all 10 rapid testing teams to adjacent pumps 50 meters apart—redundantly testing the same 2,000 residents 10 times while leaving 40,000 residents across remaining flooded wards with zero testing coverage.
              </p>
              <div style={{ marginTop: 12, padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Activity size={16} style={{ color: 'var(--brand-text)' }} />
                <span style={{ fontSize: 12.5, color: 'var(--ink)', fontWeight: 500 }}>
                  FloodSafe's dynamic max-coverage ensures <strong>+170% to +210% greater unique population protection</strong> evaluated against 1,000 Monte Carlo baseline trials.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Cedar Safety Boundaries */}
        {activeTab === 'cedar' && (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div className="formula-callout-card" style={{ borderLeftColor: '#7C3AED' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600, color: '#7C3AED', textTransform: 'uppercase' }}>
                  AWS CEDAR DEFAULT-DENY AUTHORIZATION
                </span>
                <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)' }}>
                  FORMAL SPECIFICATION
                </span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.5, margin: 0 }}>
                All sensitive actions (creating events, running assessments, generating testing plans, and recording laboratory verified results) are strictly authorized via AWS Cedar policies evaluated with the Rust-based <code style={{ fontFamily: 'var(--mono)' }}>cedarpy</code> engine.
              </p>
            </div>

            {/* Cedar Forbid Policy Code Box */}
            <div style={{ border: '1px solid var(--line-card)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <div style={{ background: 'var(--tint)', padding: '8px 14px', borderBottom: '1px solid var(--line-card)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={14} style={{ color: 'var(--ink-label)' }} />
                <span style={{ fontSize: 11.5, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--ink)' }}>
                  policies/floodsafe.cedar — STATUTORY GUARDRAIL
                </span>
              </div>
              <pre
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 12.5,
                  background: 'var(--surface)',
                  padding: 16,
                  margin: 0,
                  color: 'var(--ink)',
                  lineHeight: 1.6,
                  overflowX: 'auto',
                }}
              >
{`// Human statutory authority guardrail:
// Machine decision engine NEVER automatically issues public water advisories.
@id("no-automatic-advisory")
forbid (
  principal,
  action == FloodSafe::Action::"IssueAdvisory",
  resource
);`}
              </pre>
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-sm)', padding: 16 }}>
              <p style={{ fontSize: 12.5, color: 'var(--ink-body)', lineHeight: 1.5, margin: 0 }}>
                <strong>Statutory Principle:</strong> The AI engine calculates relative vulnerability priority to deploy physical testing kits efficiently. It is mathematically forbidden from declaring medical contamination or diagnosing drinking water safety without physical human public health officer verification.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
