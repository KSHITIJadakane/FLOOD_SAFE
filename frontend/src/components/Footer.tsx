import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-technical-paper">
      <div className="footer-inner-grid">
        <h2 style={{ fontSize: 24, fontWeight: 500, color: 'var(--ink)', marginBottom: 32, maxWidth: 680, lineHeight: 1.25 }}>
          Responsible post-flood water vulnerability triage and testing allocation.
        </h2>

        <div className="footer-columns-grid">
          {/* Col 1 */}
          <div>
            <div className="footer-mono-heading">SYSTEM ARCHITECTURE</div>
            <div className="footer-nav-row">FastAPI REST Services</div>
            <div className="footer-nav-row">Greedy Max-Coverage Optimizer</div>
            <div className="footer-nav-row">React & Leaflet Spatial GIS</div>
            <div className="footer-nav-row">AWS Cedar Policy Engine</div>
          </div>

          {/* Col 2 */}
          <div>
            <div className="footer-mono-heading">NON-NEGOTIABLES</div>
            <div className="footer-nav-row">Triage priority, not contamination</div>
            <div className="footer-nav-row">Exact component sum explainability</div>
            <div className="footer-nav-row">Neutral imputation (0.5) with penalties</div>
            <div className="footer-nav-row">Strict unique population tracking</div>
          </div>

          {/* Col 3 */}
          <div>
            <div className="footer-mono-heading">AWS CEDAR BOUNDARIES</div>
            <div className="footer-nav-row">Strict default-deny authorization</div>
            <div className="footer-nav-row">Forbid: No automatic advisories</div>
            <div className="footer-nav-row">Forbid: Admin-only verified tests</div>
            <div className="footer-nav-row">Role hierarchy (Viewer / Operator / Admin)</div>
          </div>

          {/* Col 4 */}
          <div>
            <div className="footer-mono-heading">BENCHMARK PERFORMANCE</div>
            <div className="footer-nav-row">+177.8% gain vs naive top-K ranking</div>
            <div className="footer-nav-row">+197.7% gain vs 1,000 random trials</div>
            <div className="footer-nav-row">500m projected metric coverage radius</div>
            <div className="footer-nav-row">Sub-150ms runtime on 500 sources</div>
          </div>
        </div>

        <div className="footer-legal-bar">
          <div>
            &copy; 2026 FloodSafe. Built locally with AWS open-source tools for disaster response.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--mono)', fontSize: 12 }}>
            <span style={{ color: 'var(--warning)', fontWeight: 600 }}>[SYNTHETIC DEMO DATA]</span>
            <span>·</span>
            <span>CartoDB & OpenStreetMap Tiles</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
