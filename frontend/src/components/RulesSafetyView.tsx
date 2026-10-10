import React from 'react';
import { ShieldAlert, AlertTriangle, CheckCircle2, Lock, Scale, FileText } from 'lucide-react';

export const RulesSafetyView: React.FC = () => {
  return (
    <div className="rules-view-container animate-fade-in" style={{ marginTop: 24 }}>
      {/* Header */}
      <div className="section-paper-block" style={{ borderBottom: '1px solid var(--line)' }}>
        <div className="section-header-split">
          <div className="section-header-left">
            <div className="section-tag-mono">05 / GOVERNANCE & COMPLIANCE</div>
            <h2 className="section-main-heading">Standing Rules & Safety Boundaries</h2>
          </div>
          <div className="section-header-right">
            <p className="section-lead-paragraph">
              Systemic safeguards and non-negotiables enforced across all algorithmic triage models, API endpoints, and AWS Cedar authorization policies.
            </p>
          </div>
        </div>
      </div>

      {/* Rules Grid */}
      <div className="judging-criteria-grid" style={{ marginTop: 24 }}>
        {/* Rule 1 */}
        <div className="judging-card" style={{ borderColor: 'var(--brand-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="judging-num" style={{ color: 'var(--brand-text)' }}>RULE 01</span>
            <ShieldAlert size={18} style={{ color: 'var(--danger)' }} />
          </div>
          <h4 className="judging-title">Never Claim Contamination</h4>
          <p className="judging-text">
            The risk engine computes <strong>relative vulnerability priority</strong> for field testing triage only. It NEVER makes medical claims, diagnoses water potability, or asserts confirmed chemical/biological contamination without physical laboratory verification.
          </p>
        </div>

        {/* Rule 2 */}
        <div className="judging-card" style={{ borderColor: 'var(--brand-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="judging-num" style={{ color: 'var(--brand-text)' }}>RULE 02</span>
            <Scale size={18} style={{ color: 'var(--brand-text)' }} />
          </div>
          <h4 className="judging-title">Transparent Explainability</h4>
          <p className="judging-text">
            Every scored water asset exposes exact component contributions that sum strictly to the composite score:
            <br />
            <code>Score = 0.35·Inundation + 0.25·Drainage + 0.15·Historical + 0.15·PopDensity + 0.10·SourceType</code>.
          </p>
        </div>

        {/* Rule 3 */}
        <div className="judging-card" style={{ borderColor: 'var(--brand-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="judging-num" style={{ color: 'var(--brand-text)' }}>RULE 03</span>
            <AlertTriangle size={18} style={{ color: 'var(--warning)' }} />
          </div>
          <h4 className="judging-title">No Silent Zeroes (Neutral Imputation)</h4>
          <p className="judging-text">
            Missing remote sensing or sensor telemetry inputs are imputed with neutral values ($0.5$) and accompanied by visible data quality penalty flags in the API and UI. No silent zeroes or hidden defaults are permitted.
          </p>
        </div>

        {/* Rule 4 */}
        <div className="judging-card" style={{ borderColor: 'var(--brand-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="judging-num" style={{ color: 'var(--brand-text)' }}>RULE 04</span>
            <CheckCircle2 size={18} style={{ color: 'var(--brand-text)' }} />
          </div>
          <h4 className="judging-title">Greedy Max Coverage Without Double-Counting</h4>
          <p className="judging-text">
            Testing allocation enforces non-overlapping geodesic radii (R = 500m). Population within overlapping radii is counted once. The optimizer achieves a (1 - 1/e) ≈ 63.2% approximation guarantee.
          </p>
        </div>

        {/* Rule 5 */}
        <div className="judging-card" style={{ borderColor: 'var(--brand-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="judging-num" style={{ color: 'var(--brand-text)' }}>RULE 05</span>
            <Lock size={18} style={{ color: 'var(--data-blue)' }} />
          </div>
          <h4 className="judging-title">Strict Default-Deny Cedar Authorization</h4>
          <p className="judging-text">
            AWS Cedar authorization defaults to deny. The action <code>IssueAdvisory</code> is explicitly forbidden for all roles. Recording verified field test results is restricted exclusively to Admin principals.
          </p>
        </div>

        {/* Rule 6 */}
        <div className="judging-card" style={{ borderColor: 'var(--brand-border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span className="judging-num" style={{ color: 'var(--brand-text)' }}>RULE 06</span>
            <FileText size={18} style={{ color: 'var(--ink-label)' }} />
          </div>
          <h4 className="judging-title">Prominent Synthetic Demo Labeling</h4>
          <p className="judging-text">
            All dashboard views, API response payloads (<code>is_synthetic: true</code>), and exported CSV/JSON files prominently feature synthetic demo data disclosures to prevent misuse during live operations.
          </p>
        </div>
      </div>
    </div>
  );
};
