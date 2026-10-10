import React, { useState, useEffect } from 'react';
import { X, Sliders, RefreshCw, CheckCircle2, RotateCcw, AlertCircle, Sparkles, PieChart, ShieldAlert } from 'lucide-react';
import { RiskConfigData } from '../types';
import { fetchRiskConfig, updateRiskWeights, resetRiskWeights } from '../services/api';

interface WeightTuningDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onWeightsChanged?: () => void;
}

const PRESETS = [
  {
    id: 'baseline',
    name: 'Official Baseline (v1)',
    weights: {
      flood_exposure: 0.30,
      drain_proximity_risk: 0.25,
      historical_risk: 0.15,
      source_vulnerability: 0.15,
      population_exposure: 0.15,
    },
    tag: 'Standard',
    desc: 'Balanced multi-criteria prioritization baseline calibrated against historical ward incidents.',
  },
  {
    id: 'surge',
    name: 'Surge Inundation Focus',
    weights: {
      flood_exposure: 0.50,
      drain_proximity_risk: 0.20,
      historical_risk: 0.10,
      source_vulnerability: 0.10,
      population_exposure: 0.10,
    },
    tag: 'Water Depth',
    desc: 'Elevates satellite NDWI standing water and surface ponding signals during rapid crest surges.',
  },
  {
    id: 'drainage',
    name: 'Drainage Network Breach',
    weights: {
      flood_exposure: 0.20,
      drain_proximity_risk: 0.45,
      historical_risk: 0.15,
      source_vulnerability: 0.10,
      population_exposure: 0.10,
    },
    tag: 'Culverts',
    desc: 'Targets sewage and stormwater culvert overflow paths adjacent to low-lying public taps.',
  },
  {
    id: 'population',
    name: 'High Population Reach',
    weights: {
      flood_exposure: 0.20,
      drain_proximity_risk: 0.15,
      historical_risk: 0.10,
      source_vulnerability: 0.15,
      population_exposure: 0.40,
    },
    tag: 'Census Density',
    desc: 'Prioritizes high-density public community stands to secure clean drinking water for maximum headcounts.',
  },
];

const CRITERIA_META = [
  {
    key: 'flood_exposure' as const,
    label: 'Flood Inundation Exposure',
    color: '#0F766E', // Pine
    subtext: 'Satellite NDWI optical reflectance and synthetic water depth raster',
  },
  {
    key: 'drain_proximity_risk' as const,
    label: 'Stormwater Drainage Proximity',
    color: '#0284C7', // Data Blue
    subtext: 'Hydrological & Euclidean distance to open drainage canals and culverts',
  },
  {
    key: 'historical_risk' as const,
    label: 'Historical Contamination Frequency',
    color: '#D97706', // Amber
    subtext: 'Ward-level 3-year baseline waterborne infection incidence records',
  },
  {
    key: 'source_vulnerability' as const,
    label: 'Infrastructure Vulnerability',
    color: '#7C3AED', // Purple
    subtext: 'Well casing depth, surface seal integrity, and mechanical pump age',
  },
  {
    key: 'population_exposure' as const,
    label: 'Population Catchment Density',
    color: '#E11D48', // Rose
    subtext: 'Census population count served within 500m walking radius',
  },
];

export const WeightTuningDrawer: React.FC<WeightTuningDrawerProps> = ({
  isOpen,
  onClose,
  onWeightsChanged,
}) => {
  const [config, setConfig] = useState<RiskConfigData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [weights, setWeights] = useState({
    flood_exposure: 0.30,
    drain_proximity_risk: 0.25,
    historical_risk: 0.15,
    source_vulnerability: 0.15,
    population_exposure: 0.15,
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await fetchRiskConfig();
      setConfig(data);
      setWeights({
        flood_exposure: data.weights.flood_exposure,
        drain_proximity_risk: data.weights.drain_proximity_risk,
        historical_risk: data.weights.historical_risk,
        source_vulnerability: data.weights.source_vulnerability,
        population_exposure: data.weights.population_exposure,
      });
    } catch (e: any) {
      console.error('Failed to load risk config:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConfig();
      setStatusMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const totalSum = Number(Object.values(weights).reduce((a, b) => a + b, 0).toFixed(3));
  const isNormalized = Math.abs(totalSum - 1.0) < 0.005;

  const handleSliderChange = (key: keyof typeof weights, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  const applyPreset = (presetWeights: typeof weights) => {
    setWeights(presetWeights);
  };

  const handleNormalize = () => {
    if (totalSum <= 0) return;
    const factor = 1.0 / totalSum;
    const normalized = {
      flood_exposure: Number((weights.flood_exposure * factor).toFixed(2)),
      drain_proximity_risk: Number((weights.drain_proximity_risk * factor).toFixed(2)),
      historical_risk: Number((weights.historical_risk * factor).toFixed(2)),
      source_vulnerability: Number((weights.source_vulnerability * factor).toFixed(2)),
      population_exposure: Number((weights.population_exposure * factor).toFixed(2)),
    };
    const diff = Number((1.0 - Object.values(normalized).reduce((a, b) => a + b, 0)).toFixed(2));
    normalized.flood_exposure = Number((normalized.flood_exposure + diff).toFixed(2));
    setWeights(normalized);
  };

  const handleSaveAndReassess = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      const updated = await updateRiskWeights(weights);
      setConfig(updated);
      setWeights(updated.weights as any);
      setStatusMsg({
        type: 'success',
        text: 'What-If weights applied! Live risk triage and testing plan re-calculated in real time.',
      });
      if (onWeightsChanged) {
        onWeightsChanged();
      }
    } catch (err: any) {
      const detail = err.response?.data?.detail?.message || err.message || 'Failed to update weights';
      setStatusMsg({ type: 'error', text: detail });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      setStatusMsg(null);
      const res = await resetRiskWeights();
      setConfig(res);
      setWeights(res.weights as any);
      setStatusMsg({
        type: 'success',
        text: 'Reset to default YAML configuration baseline successfully!',
      });
      if (onWeightsChanged) {
        onWeightsChanged();
      }
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: 'Failed to reset weights.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay-backdrop" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-dialog-panel custom-modal-scroll animate-fade-in"
        style={{
          maxWidth: 720,
          width: '94vw',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '28px 32px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        {/* Top Eyebrow */}
        <div className="mono-eyebrow">
          <span className="dot" />
          <span>WHAT-IF SENSITIVITY SIMULATOR</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', margin: '6px 0 18px 0', gap: 16 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>
              Dynamic Multi-Criteria Weight Tuning
            </h2>
            <p style={{ fontSize: 13.5, color: 'var(--ink-body)', marginTop: 4, lineHeight: 1.5 }}>
              Simulate operational trade-offs by shifting relative weights across inundation, drainage networks, infrastructure, and population exposure.
            </p>
          </div>
          {config?.is_custom_tuned ? (
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--mono)',
                background: 'var(--warning-tint)',
                color: 'var(--warning)',
                border: '1px solid var(--warning)',
                padding: '4px 9px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
              }}
            >
              CUSTOM TUNED
            </span>
          ) : (
            <span
              style={{
                fontSize: 11,
                fontFamily: 'var(--mono)',
                background: 'var(--brand-tint)',
                color: 'var(--brand-text)',
                border: '1px solid var(--brand-border)',
                padding: '4px 9px',
                fontWeight: 600,
                borderRadius: 'var(--radius-sm)',
                whiteSpace: 'nowrap',
              }}
            >
              BASELINE YAML
            </span>
          )}
        </div>

        {/* Real-time Multi-Criteria Distribution Bar */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase' }}>
              WEIGHT ALLOCATION SHARE
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12.5,
                  fontFamily: 'var(--mono)',
                  fontWeight: 600,
                  color: isNormalized ? 'var(--brand-text)' : 'var(--danger)',
                }}
              >
                Sum: {(totalSum * 100).toFixed(0)}%
              </span>
              {!isNormalized && (
                <button
                  type="button"
                  onClick={handleNormalize}
                  className="btn-secondary"
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--mono)',
                    padding: '2px 8px',
                    cursor: 'pointer',
                  }}
                >
                  Auto-Normalize to 100%
                </button>
              )}
            </div>
          </div>

          <div className="weight-dist-bar">
            {CRITERIA_META.map((meta) => {
              const val = weights[meta.key];
              const pct = totalSum > 0 ? (val / totalSum) * 100 : 0;
              return (
                <div
                  key={meta.key}
                  style={{
                    width: `${pct}%`,
                    background: meta.color,
                    transition: 'width 140ms ease',
                  }}
                  title={`${meta.label}: ${(val * 100).toFixed(0)}%`}
                />
              );
            })}
          </div>
        </div>

        {/* Scenario Presets */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontSize: 11.5, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase', marginBottom: 8 }}>
            SCENARIO PRESETS
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {PRESETS.map((p) => {
              const isActive =
                Math.abs(weights.flood_exposure - p.weights.flood_exposure) < 0.01 &&
                Math.abs(weights.drain_proximity_risk - p.weights.drain_proximity_risk) < 0.01 &&
                Math.abs(weights.population_exposure - p.weights.population_exposure) < 0.01;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => applyPreset(p.weights)}
                  className="preset-card-btn"
                  style={{
                    borderColor: isActive ? 'var(--brand)' : 'var(--line-card)',
                    background: isActive ? 'var(--brand-tint)' : 'var(--surface)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <strong style={{ fontSize: 12, color: isActive ? 'var(--brand-text)' : 'var(--ink)' }}>{p.name}</strong>
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--mono)', color: 'var(--ink-label)', background: 'var(--tint)', padding: '1px 5px', borderRadius: 2 }}>
                      {p.tag}
                    </span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--ink-body)', lineHeight: 1.35, marginTop: 2 }}>
                    {p.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sliders Container */}
        <div style={{ background: 'var(--tint)', border: '1px solid var(--line-card)', borderRadius: 'var(--radius-md)', padding: '20px 22px', marginBottom: 22 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {CRITERIA_META.map((meta) => {
              const val = weights[meta.key];
              return (
                <div key={meta.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: meta.color }} />
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                        {meta.label}
                      </span>
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 13,
                        fontWeight: 700,
                        color: meta.color,
                        background: 'var(--surface)',
                        padding: '2px 8px',
                        border: '1px solid var(--line-card)',
                        borderRadius: 'var(--radius-sm)',
                      }}
                    >
                      {(val * 100).toFixed(0)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.0"
                    max="1.0"
                    step="0.05"
                    value={val}
                    onChange={(e) => handleSliderChange(meta.key, parseFloat(e.target.value))}
                    className="whatif-slider"
                  />
                  <div style={{ fontSize: 11.5, color: 'var(--ink-body)', marginTop: 4 }}>
                    {meta.subtext}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Status Notification */}
        {statusMsg && (
          <div
            style={{
              padding: '12px 16px',
              marginBottom: 18,
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              borderRadius: 'var(--radius-sm)',
              border: `1px solid ${statusMsg.type === 'success' ? 'var(--brand-border)' : 'var(--danger)'}`,
              background: statusMsg.type === 'success' ? 'var(--brand-tint)' : 'var(--danger-tint)',
              color: statusMsg.type === 'success' ? 'var(--brand-text)' : 'var(--danger)',
            }}
          >
            {statusMsg.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', alignItems: 'center', paddingTop: 6 }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleReset}
            disabled={saving}
          >
            <RotateCcw size={13} />
            <span>Reset Baseline</span>
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSaveAndReassess}
            disabled={saving || loading}
          >
            {saving ? <RefreshCw className="animate-spin" size={13} /> : <Sparkles size={13} />}
            <span>Apply Weights &amp; Re-Assess</span>
          </button>
        </div>
      </div>
    </div>
  );
};
