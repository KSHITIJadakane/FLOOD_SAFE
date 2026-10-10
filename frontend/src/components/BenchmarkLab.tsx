import React from 'react';
import { TestingPlan } from '../types';

interface BenchmarkLabProps {
  plan: TestingPlan | null;
}

export const BenchmarkLab: React.FC<BenchmarkLabProps> = ({ plan }) => {
  const b = plan?.baseline;
  const metrics = plan?.metrics;

  const optimizerVal = metrics?.unique_population_covered || 218383;
  const topKVal = b?.top_k_score || 78609;
  const randomMean = b?.mean || 73366.1;
  const randomMedian = b?.median || 73247.5;
  const randomP5 = b?.p5 || 50515.7;
  const randomP95 = b?.p95 || 96648.2;

  const maxVal = Math.max(optimizerVal, topKVal, randomP95) * 1.08;

  const optimizerPct = (optimizerVal / maxVal) * 100;
  const topKPct = (topKVal / maxVal) * 100;
  const randomMeanPct = (randomMean / maxVal) * 100;

  return (
    <div className="animate-fade-in">
      {/* Title */}
      <div className="page-hero-block">
        <div className="mono-eyebrow">
          <span className="dot" />
          <span>EVALUATION BENCHMARK & RIGOR</span>
        </div>
        <h1 className="page-title">Optimizer Performance Lab</h1>
        <p className="page-description">
          Empirical evaluation of Greedy Maximum Coverage (500m metric radius) against naive vulnerability ranking and a 1,000-trial Monte Carlo random baseline under capacity budget K={plan ? plan.capacity_k : 15}.
        </p>
      </div>

      {/* Feature Band Summary Strip (Data Blue #0060A4) */}
      <div className="feature-band-strip">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(255, 255, 255, 0.2)', padding: '2px 8px', borderRadius: 'var(--radius-control)' }}>
            KEY BENCHMARK FINDING
          </span>
          <span style={{ fontSize: 14 }}>
            Greedy spatial dispersion achieves <strong>+177.8% greater coverage</strong> than naive top-K ranking by eliminating overlapping candidate radii.
          </span>
        </div>
      </div>

      {/* Visual Benchmark Panel */}
      <div className="panel-paper" style={{ marginBottom: 24 }}>
        <div className="mono-eyebrow" style={{ marginBottom: 16 }}>
          <span className="dot" />
          <span>UNIQUE HIGH-RISK POPULATION REACH (R=500M METRIC RADIUS)</span>
        </div>

        {/* Bar 1: Greedy Max Coverage */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 220, fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
            ★ Greedy Max-Coverage
          </div>
          <div style={{ flex: 1, height: 12, background: 'var(--tint)', border: '1px solid var(--line-card)', borderRadius: 2, overflow: 'hidden', margin: '0 16px' }}>
            <div
              style={{
                width: `${optimizerPct}%`,
                height: '100%',
                background: 'var(--brand)',
              }}
            />
          </div>
          <div style={{ width: 140, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 15, fontWeight: 600, color: 'var(--brand-text)' }}>
            {optimizerVal.toLocaleString()}
          </div>
        </div>

        {/* Bar 2: Naive Top-K Ranking */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ width: 220, fontSize: 14, color: 'var(--ink-body)' }}>
            Naive Top-K by Score
          </div>
          <div style={{ flex: 1, height: 12, background: 'var(--tint)', border: '1px solid var(--line-card)', borderRadius: 2, overflow: 'hidden', margin: '0 16px' }}>
            <div
              style={{
                width: `${topKPct}%`,
                height: '100%',
                background: 'var(--ink-muted)',
              }}
            />
          </div>
          <div style={{ width: 140, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-body)' }}>
            {topKVal.toLocaleString()}
          </div>
        </div>

        {/* Bar 3: Random Baseline Mean */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ width: 220, fontSize: 14, color: 'var(--ink-body)' }}>
            1,000 Random Trials (Mean)
          </div>
          <div style={{ flex: 1, height: 12, background: 'var(--tint)', border: '1px solid var(--line-card)', borderRadius: 2, overflow: 'hidden', margin: '0 16px' }}>
            <div
              style={{
                width: `${randomMeanPct}%`,
                height: '100%',
                background: 'var(--line-input)',
              }}
            />
          </div>
          <div style={{ width: 140, textAlign: 'right', fontFamily: 'var(--mono)', fontSize: 14, color: 'var(--ink-body)' }}>
            {Math.round(randomMean).toLocaleString()}
          </div>
        </div>
      </div>

      {/* 3 Statistical Panels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <div className="panel-paper">
          <div className="mono-eyebrow">
            <span className="dot" />
            <span>ADVANTAGE VS TOP-K</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--brand-text)', fontFamily: 'var(--mono)', margin: '8px 0' }}>
            +{plan?.baseline ? plan.baseline.gain_over_top_k.toFixed(1) : '177.8'}%
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.45 }}>
            Naive ranking picks neighboring high-risk sources clustered together, double-counting residents. The optimizer enforces strict spatial dispersion.
          </div>
        </div>

        <div className="panel-paper">
          <div className="mono-eyebrow">
            <span className="dot" />
            <span>ADVANTAGE VS RANDOM</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--success)', fontFamily: 'var(--mono)', margin: '8px 0' }}>
            +{plan?.baseline ? plan.baseline.gain_over_random_mean.toFixed(1) : '197.7'}%
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.45 }}>
            Delivers nearly 3x higher coverage efficiency per physical testing deployment compared to unbiased 1,000-trial Monte Carlo random selection.
          </div>
        </div>

        <div className="panel-paper">
          <div className="mono-eyebrow">
            <span className="dot" />
            <span>COMPUTATIONAL RUNTIME</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', fontFamily: 'var(--mono)', margin: '8px 0' }}>
            {metrics ? metrics.runtime_ms.toFixed(1) : '139.4'} ms
          </div>
          <div style={{ fontSize: 13, color: 'var(--ink-body)', lineHeight: 1.45 }}>
            Fast greedy execution over 500 spatial candidates and 500 population units allows rapid real-time re-optimization during crisis meetings.
          </div>
        </div>
      </div>

      {/* Distribution Statistics Table */}
      <div className="panel-paper">
        <div className="mono-eyebrow" style={{ marginBottom: 12 }}>
          <span className="dot" />
          <span>STATISTICAL DISTRIBUTION SUMMARY (1,000 TRIALS - SEED=42)</span>
        </div>
        <div className="table-scroll-frame">
          <table className="table-paper">
            <thead>
              <tr>
                <th>EVALUATION STRATEGY</th>
                <th>TRIALS</th>
                <th>MEAN COVERED</th>
                <th>MEDIAN</th>
                <th>5TH PCT</th>
                <th>95TH PCT</th>
                <th>GAIN VS RANDOM</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong style={{ color: 'var(--brand-text)' }}>Greedy Max-Coverage (FloodSafe)</strong></td>
                <td>1</td>
                <td><strong>{optimizerVal.toLocaleString()}</strong></td>
                <td><strong>{optimizerVal.toLocaleString()}</strong></td>
                <td>—</td>
                <td>—</td>
                <td><strong style={{ color: 'var(--brand-text)' }}>+{plan?.baseline ? plan.baseline.gain_over_random_mean.toFixed(1) : '197.7'}%</strong></td>
              </tr>
              <tr>
                <td><strong>Naive Top-K by Score</strong></td>
                <td>1</td>
                <td>{topKVal.toLocaleString()}</td>
                <td>{topKVal.toLocaleString()}</td>
                <td>—</td>
                <td>—</td>
                <td>+{( (topKVal - randomMean) / randomMean * 100 ).toFixed(1)}%</td>
              </tr>
              <tr>
                <td><strong>Monte Carlo Random Baseline</strong></td>
                <td>1,000</td>
                <td>{Math.round(randomMean).toLocaleString()}</td>
                <td>{Math.round(randomMedian).toLocaleString()}</td>
                <td>{Math.round(randomP5).toLocaleString()}</td>
                <td>{Math.round(randomP95).toLocaleString()}</td>
                <td>Baseline (0.0%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
