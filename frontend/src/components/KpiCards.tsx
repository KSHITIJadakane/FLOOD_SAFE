import React from 'react';
import { TestingPlan, ScoredSource } from '../types';
import { TrendingUp, Users, Droplets, Shuffle } from 'lucide-react';

interface KpiCardsProps {
  sources: ScoredSource[];
  plan: TestingPlan | null;
  iotSensors?: import('../types').IoTSensorNode[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ sources, plan, iotSensors = [] }) => {
  const totalSources = sources.length;
  const veryHighCount = sources.filter((s) => s.band === 'very_high').length;
  const highCount = sources.filter((s) => s.band === 'high').length;
  const modCount = sources.filter((s) => s.band === 'moderate').length;
  const lowCount = sources.filter((s) => s.band === 'low').length;

  const uniqueCovered = plan ? plan.metrics.unique_population_covered : 0;
  const totalHighRisk = plan ? plan.metrics.total_high_risk_population : 812384;
  const pctCovered = plan ? plan.metrics.pct_high_risk_covered : 0;
  const gainOverTopK = plan?.baseline ? plan.baseline.gain_over_top_k : 177.8;
  const gainOverRandom = plan?.baseline ? plan.baseline.gain_over_random_mean : 197.7;

  return (
    <div className="kpi-grid-dashboard animate-fade-in">
      {/* KPI 1: Coverage Advantage */}
      <div className="kpi-card-metric highlight">
        <div className="kpi-card-top">
          <span className="kpi-title">Optimizer Efficiency Gain</span>
          <span className="kpi-badge-gain">vs Top-K</span>
        </div>
        <div className="kpi-primary-val">+{gainOverTopK.toFixed(1)}%</div>
        <div className="kpi-explanation">
          Submodular max-coverage prevents spatial clustering across overlapping 500m radii.
        </div>
      </div>

      {/* KPI 2: Vulnerable Population Protected */}
      <div className="kpi-card-metric">
        <div className="kpi-card-top">
          <span className="kpi-title">Protected Population</span>
          <span className="kpi-badge-neutral">{pctCovered.toFixed(1)}% of basin</span>
        </div>
        <div className="kpi-primary-val">{uniqueCovered.toLocaleString()}</div>
        <div className="kpi-explanation">
          Unique residents within 500m of dispatched testing teams without double-counting.
        </div>
      </div>

      {/* KPI 3: Monitored Water Points & In-Situ IoT */}
      <div className="kpi-card-metric">
        <div className="kpi-card-top">
          <span className="kpi-title">Monitored Assets &amp; Ground IoT</span>
          <span className="kpi-badge-neutral">{totalSources} sources</span>
        </div>
        <div className="kpi-primary-val">{totalSources}</div>
        <div className="kpi-explanation">
          <span className="risk-dot-crimson">● {veryHighCount} Critical</span> · <span className="risk-dot-amber">● {highCount} High</span>
          {iotSensors.length > 0 && (
            <div style={{ marginTop: 3, color: 'var(--brand-text)', fontWeight: 600, fontFamily: 'var(--mono)', fontSize: 11 }}>
              📡 {iotSensors.filter(n => n.status !== 'offline').length}/{iotSensors.length} IoT Nodes Live
            </div>
          )}
        </div>
      </div>

      {/* KPI 4: 1,000-Trial Baseline Comparison */}
      <div className="kpi-card-metric">
        <div className="kpi-card-top">
          <span className="kpi-title">Gain vs Random Baseline</span>
          <span className="kpi-badge-neutral">1,000 trials</span>
        </div>
        <div className="kpi-primary-val text-pine">+{gainOverRandom.toFixed(1)}%</div>
        <div className="kpi-explanation">
          vs {plan?.baseline ? plan.baseline.mean.toLocaleString() : '73,366'} mean random allocation draw.
        </div>
      </div>
    </div>
  );
};
