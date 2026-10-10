import React from 'react';
import { ExternalLink, ArrowRight, ShieldCheck, Zap, Layers, MapPin, Database, Award, BookOpen, CheckCircle } from 'lucide-react';
import { ActiveNavTab } from './Header';

interface WeMakeDevsSectionsProps {
  onNavigateTab: (tab: ActiveNavTab) => void;
}

export const WeMakeDevsSections: React.FC<WeMakeDevsSectionsProps> = ({ onNavigateTab }) => {
  return (
    <div className="wemakedevs-sections-container">
      {/* ========================================================================= */}
      {/* SECTION 01 / ALGORITHMIC TRIAGE TRACKS */}
      {/* ========================================================================= */}
      <section className="section-paper-block">
        <div className="section-header-split">
          <div className="section-header-left">
            <div className="section-tag-mono">01 / TRIAGE PIPELINE</div>
            <h2 className="section-main-heading">Multi-Factor Vulnerability Modeling</h2>
          </div>
          <div className="section-header-right">
            <p className="section-lead-paragraph">
              Real-time ingestion of multispectral inundation indices, drainage buffer topology, and population density grids across disaster corridors to optimize critical field testing allocations.
            </p>
          </div>
        </div>

        {/* AWS Feature Blue Banner */}
        <div className="aws-feature-blue-banner">
          {/* Pixel clouds & steps decoration */}
          <div className="pixel-cloud-art"></div>
          <div className="pixel-steps-art"></div>

          <div className="blue-banner-left">
            <h3 className="blue-banner-title">
              Real-Time Optimization with <span className="amazon-pill-badge">AWS</span> Cedar.
            </h3>

            <div className="blue-banner-badges-row">
              <div className="track-square-dots">
                <span className="sq-dot sq-orange"></span>
                <span className="sq-dot sq-white"></span>
                <span className="sq-dot sq-amber"></span>
              </div>
              <span className="blue-badge-text">
                SUB-MODULAR GREEDY COVERAGE: R = 500M
              </span>
            </div>

            <div className="blue-banner-pill-btn">
              <span className="pill-calendar-icon">⚡</span>
              <span>PROVABLE (1 - 1/e) APPROXIMATION GUARANTEE</span>
            </div>
          </div>

          <div className="blue-banner-right">
            <p className="blue-banner-desc">
              Field testing allocation maximizes unique population coverage with zero double-counting across overlapping geodesic catchment areas, yielding <strong>+177.8% higher efficiency</strong> over naive top-K ranking.
            </p>
            <button
              className="blue-banner-action-link"
              onClick={() => onNavigateTab('benchmark')}
            >
              <span>EXPLORE OPTIMIZER BENCHMARKS</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </div>

        {/* Three Algorithmic Pipeline Cards with Pixel Art */}
        <div className="track-cards-grid">
          {/* Card 1: Hydrology & Elevation */}
          <div className="track-card-item">
            <div className="track-card-image-wrap">
              <img
                src="/track-windmills.jpg"
                alt="Track 01: Hydrology & DEM"
                className="track-card-image"
              />
              <span className="track-badge-overlay">DIMENSION 01</span>
            </div>
            <div className="track-card-body">
              <div className="track-card-mono-tag">01 / HYDROLOGICAL EXPOSURE</div>
              <h4 className="track-card-title">Spatial Flood Inundation & Slope</h4>
              <p className="track-card-desc">
                Continuous surface water pooling depth (NDWI), drainage channel proximity, and digital elevation model runoff velocity vectors across the basin.
              </p>
              <div className="track-card-footer">
                <span className="track-metric-tag">NDWI + SRTM DEM</span>
                <span className="track-weight-tag">WEIGHT: 35%</span>
              </div>
            </div>
          </div>

          {/* Card 2: Sub-Modular Greedy Coverage */}
          <div className="track-card-item">
            <div className="track-card-image-wrap">
              <img
                src="/track-reservoir.jpg"
                alt="Track 02: Greedy Max Coverage"
                className="track-card-image"
              />
              <span className="track-badge-overlay">DIMENSION 02</span>
            </div>
            <div className="track-card-body">
              <div className="track-card-mono-tag">02 / LOGISTICAL COVERAGE</div>
              <h4 className="track-card-title">Greedy Max-Coverage Allocation</h4>
              <p className="track-card-desc">
                Sub-modular greedy algorithm selecting optimal water monitoring points within budget K to protect the largest unique population without overlap.
              </p>
              <div className="track-card-footer">
                <span className="track-metric-tag">R = 500M GEODESIC</span>
                <span className="track-weight-tag">WEIGHT: 25%</span>
              </div>
            </div>
          </div>

          {/* Card 3: Security & Policy Governance */}
          <div className="track-card-item">
            <div className="track-card-image-wrap">
              <img
                src="/track-solar.jpg"
                alt="Track 03: Cedar Safety Governance"
                className="track-card-image"
              />
              <span className="track-badge-overlay">DIMENSION 03</span>
            </div>
            <div className="track-card-body">
              <div className="track-card-mono-tag">03 / AWS CEDAR GOVERNANCE</div>
              <h4 className="track-card-title">Cryptographic Policy Boundaries</h4>
              <p className="track-card-desc">
                AWS Cedar authorization engine enforcing strict default-deny boundaries, preventing simulated telemetry corruption, and forbidding unverified advisory issue.
              </p>
              <div className="track-card-footer">
                <span className="track-metric-tag">AWS CEDAR V3</span>
                <span className="track-weight-tag">STRICT FORBID</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 03 / TECHNICAL GUIDES & SPECIFICATIONS */}
      {/* ========================================================================= */}
      <section className="section-paper-block">
        <div className="section-header-split">
          <div className="section-header-left">
            <div className="section-tag-mono">03 / TECHNICAL SPECIFICATIONS</div>
            <h2 className="section-main-heading">Formulations & Architecture Notes</h2>
          </div>
          <div className="section-header-right">
            <p className="section-lead-paragraph">
              Mathematical proofs, explainability decompositions, and policy rules governing the water vulnerability triage engine.
            </p>
          </div>
        </div>

        {/* 3 Hairline Link Cards */}
        <div className="hairline-links-grid">
          <div
            className="hairline-link-card"
            onClick={() => onNavigateTab('queue')}
          >
            <div className="link-card-top">
              <h4 className="link-card-title">Vulnerability Priority Formulation</h4>
              <ExternalLink size={16} className="link-card-arrow" />
            </div>
            <p className="link-card-desc">
              Weighted composite of 5 factors with neutral 0.5 imputation and data penalty flags.
            </p>
          </div>

          <div
            className="hairline-link-card"
            onClick={() => onNavigateTab('benchmark')}
          >
            <div className="link-card-top">
              <h4 className="link-card-title">Submodular Greedy Coverage Guarantees</h4>
              <ExternalLink size={16} className="link-card-arrow" />
            </div>
            <p className="link-card-desc">
              Why naive top-K ranking clusters testing teams and wastes disaster field capacity.
            </p>
          </div>

          <div
            className="hairline-link-card"
            onClick={() => onNavigateTab('cedar')}
          >
            <div className="link-card-top">
              <h4 className="link-card-title">Cedar Authorization & Safety Policies</h4>
              <ExternalLink size={16} className="link-card-arrow" />
            </div>
            <p className="link-card-desc">
              Default-deny principal evaluation and strict forbid rules for public health advisories.
            </p>
          </div>
        </div>

        {/* Tour / Spec Action Bar */}
        <div className="tour-action-bar">
          <span className="tour-mono-label">DISASTER OPERATIONS REFERENCE SPECIFICATION</span>
          <button
            className="tour-read-btn"
            onClick={() => onNavigateTab('rules')}
          >
            <span>VIEW STANDING RULES & SAFETY BOUNDARIES</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 04 / AUDIT & EVALUATION CRITERIA */}
      {/* ========================================================================= */}
      <section className="section-paper-block" style={{ borderBottom: 'none' }}>
        <div className="section-header-split">
          <div className="section-header-left">
            <div className="section-tag-mono">04 / SYSTEM VERIFICATION</div>
            <h2 className="section-main-heading">Operational Integrity & Audit Standards</h2>
          </div>
          <div className="section-header-right">
            <p className="section-lead-paragraph">
              Standards enforced across all algorithmic models, API response schemas, and dispatch workflows during disaster operations.
            </p>
          </div>
        </div>

        <div className="judging-criteria-grid">
          <div className="judging-card">
            <div className="judging-num">01</div>
            <h4 className="judging-title">Non-Overlapping Spatial Coverage</h4>
            <p className="judging-text">
              Zero double-counting of population within overlapping 500m geodesic circles, delivering +177.8% higher unique coverage over baseline top-K ranking.
            </p>
          </div>

          <div className="judging-card">
            <div className="judging-num">02</div>
            <h4 className="judging-title">Transparent Explainability</h4>
            <p className="judging-text">
              Every scored source reveals exact weighted component contributions (Inundation, Drainage, Historical, Population, Type) that sum exactly to the final priority score.
            </p>
          </div>

          <div className="judging-card">
            <div className="judging-num">03</div>
            <h4 className="judging-title">Zero Silent Defaults</h4>
            <p className="judging-text">
              Missing satellite or telemetry features are never set to 0.0 or hidden; they are imputed at neutral 0.5 with visible data quality penalty flags.
            </p>
          </div>

          <div className="judging-card">
            <div className="judging-num">04</div>
            <h4 className="judging-title">Cedar Strict Default-Deny</h4>
            <p className="judging-text">
              Role-based access enforced via Amazon Cedar policies. Public health advisories are strictly forbidden for all roles, and verified results require Admin clearance.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
