import React from 'react';
import { ShieldCheck } from 'lucide-react';

export const SyntheticBanner: React.FC = () => {
  return (
    <div className="synthetic-banner-bar">
      <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
        <span className="synthetic-pill-badge">
          [SYNTHETIC DEMO DATA]
        </span>
        <span style={{ fontSize: 13, color: 'var(--ink-body)' }}>
          Modelled incident dataset - Not real infrastructure. Scores prioritize physical field testing, never medical or contamination diagnosis.
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        <ShieldCheck size={15} style={{ color: 'var(--brand-text)' }} />
        <span>AWS Cedar Default-Deny Active</span>
      </div>
    </div>
  );
};
