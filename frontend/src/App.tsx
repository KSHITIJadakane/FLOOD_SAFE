import React, { useEffect, useState } from 'react';
import {
  Sliders,
  RefreshCw,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  FloodEvent,
  ScoredSource,
  QueueItem,
  TestingPlan,
  UserRole,
} from './types';
import {
  fetchEvents,
  fetchSources,
  fetchTestingQueue,
  fetchRiskMapGeoJSON,
  createTestingPlan,
  runRiskAssessment,
  setDemoRole,
} from './services/api';

import { SyntheticBanner } from './components/SyntheticBanner';
import { Header, ActiveNavTab } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { KpiCards } from './components/KpiCards';
import { RiskMap } from './components/RiskMap';
import { SelectedSitesStream } from './components/SelectedSitesStream';
import { TestingQueue } from './components/TestingQueue';
import { BenchmarkLab } from './components/BenchmarkLab';
import { CedarStudio } from './components/CedarStudio';
import { WhyModal } from './components/WhyModal';
import { FieldFeedbackModal } from './components/FieldFeedbackModal';
import { WeightTuningDrawer } from './components/WeightTuningDrawer';
import { DecisionEngineInspectorModal } from './components/DecisionEngineInspectorModal';
import { WeMakeDevsSections } from './components/WeMakeDevsSections';
import { RulesSafetyView } from './components/RulesSafetyView';
import { Footer } from './components/Footer';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('command');
  const [currentRole, setCurrentRole] = useState<UserRole>('operator');

  const [events, setEvents] = useState<FloodEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<FloodEvent | null>(null);

  const [sources, setSources] = useState<ScoredSource[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [plan, setPlan] = useState<TestingPlan | null>(null);
  const [floodGeometry, setFloodGeometry] = useState<any>(null);

  const [capacityK, setCapacityK] = useState<number>(15);
  const [loading, setLoading] = useState<boolean>(true);
  const [optimizing, setOptimizing] = useState<boolean>(false);

  const [selectedWhySource, setSelectedWhySource] = useState<ScoredSource | null>(null);
  const [feedbackSource, setFeedbackSource] = useState<{ id: string; code: string } | null>(null);
  const [isTuningOpen, setIsTuningOpen] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

  // Load initial data
  const loadInitialData = async () => {
    setLoading(true);
    try {
      const eventList = await fetchEvents();
      setEvents(eventList);
      const ev = eventList[0] || null;
      setActiveEvent(ev);

      if (ev) {
        const [srcs, q, mapGeo] = await Promise.all([
          fetchSources({ event_id: ev.id }),
          fetchTestingQueue(ev.id),
          fetchRiskMapGeoJSON(ev.id),
        ]);
        setSources(srcs);
        setQueue(q);

        const floodFeature = mapGeo.features.find(
          (f: any) => f.properties?.layer_type === 'flood_zone'
        );
        if (floodFeature) {
          setFloodGeometry(floodFeature.geometry);
        }

        // Run default plan
        const initialPlan = await createTestingPlan({
          event_id: ev.id,
          capacity_k: 15,
        });
        setPlan(initialPlan);
      }
    } catch (err: any) {
      console.error('Failed to load initial data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    setDemoRole(role);
  };

  const handleRunOptimizer = async () => {
    let ev = activeEvent;
    if (!ev) {
      const evList = await fetchEvents();
      if (evList.length > 0) {
        ev = evList[0];
        setActiveEvent(ev);
      } else {
        alert("No flood events found to optimize.");
        return;
      }
    }
    setOptimizing(true);
    try {
      const newPlan = await createTestingPlan({
        event_id: ev.id,
        capacity_k: capacityK,
      });
      setPlan(newPlan);

      // Refresh queue and map
      const [srcs, q] = await Promise.all([
        fetchSources({ event_id: ev.id }),
        fetchTestingQueue(ev.id, newPlan.plan_id),
      ]);
      setSources(srcs);
      setQueue(q);
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert(`403 FORBIDDEN: Role '${currentRole}' is not permitted to generate testing plans under Cedar policy.`);
      } else {
        alert(`Error running optimizer: ${err?.response?.data?.detail?.message || err.message}`);
      }
    } finally {
      setOptimizing(false);
    }
  };

  const handleRefreshAssessment = async () => {
    let ev = activeEvent;
    if (!ev) {
      const evList = await fetchEvents();
      if (evList.length > 0) {
        ev = evList[0];
        setActiveEvent(ev);
      } else {
        return;
      }
    }
    setLoading(true);
    try {
      await runRiskAssessment(ev.id);
      const [srcs, q] = await Promise.all([
        fetchSources({ event_id: ev.id }),
        fetchTestingQueue(ev.id),
      ]);
      setSources(srcs);
      setQueue(q);
      if (plan) {
        const newPlan = await createTestingPlan({
          event_id: ev.id,
          capacity_k: capacityK,
        });
        setPlan(newPlan);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        alert(`403 FORBIDDEN: Role '${currentRole}' is not authorized to run assessments under Cedar policy.`);
      } else {
        alert(`Error refreshing assessment: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* 1. Top Persistent Synthetic Demo Banner */}
      <SyntheticBanner />

      {/* 2. Top Header & Navigation Tabs */}
      <Header
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenTuning={() => setIsTuningOpen(true)}
        onOpenInspector={() => setIsInspectorOpen(true)}
      />

      <main className="container-paper">
        {/* TAB 1: Live Command Center & Triage Workspace */}
        {activeTab === 'command' && (
          <div className="animate-fade-in">
            {/* Executive Incident Telemetry Header */}
            <HeroBanner
              eventTitle={activeEvent?.name}
              sourceCount={sources.length}
            />

            {/* High-Density KPI Metric Grid */}
            <KpiCards sources={sources} plan={plan} />

            {/* Interactive Capacity Controls Bar */}
            <div className="panel-paper" style={{ marginBottom: 20, padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 280 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sliders size={16} style={{ color: 'var(--brand-text)' }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>
                    Capacity Budget (K):
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="40"
                  value={capacityK}
                  onChange={(e) => setCapacityK(parseInt(e.target.value))}
                  className="slider-styled"
                  style={{ flex: 1, maxWidth: 220 }}
                />
                <span style={{ fontFamily: 'var(--mono)', fontSize: 12.5, fontWeight: 600, color: 'var(--brand-text)', background: 'var(--brand-tint)', padding: '2px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--brand-ring-soft)' }}>
                  {capacityK} Sites
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-secondary btn-compact"
                  onClick={() => setIsTuningOpen(true)}
                  title="Tune MCDA Weights & Sensitivity"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Sliders size={13} />
                  <span>What-If Weights</span>
                </button>
                <button
                  className="btn btn-secondary btn-compact"
                  onClick={() => setIsInspectorOpen(true)}
                  title="Inspect Mathematical Proofs & Cedar Boundaries"
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>🔬</span>
                  <span>AI Inspector</span>
                </button>
                <button
                  className="btn btn-secondary btn-compact"
                  onClick={handleRefreshAssessment}
                  disabled={loading}
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh Triage</span>
                </button>
                <button
                  className="btn btn-primary btn-compact"
                  onClick={handleRunOptimizer}
                  disabled={optimizing}
                >
                  <Sparkles size={13} />
                  <span>{optimizing ? 'Optimizing...' : 'Run Greedy Optimizer'}</span>
                </button>
              </div>
            </div>

            {/* Split View: Map (Left 60%) + Priority Stream (Right 40%) */}
            <div className="split-dashboard-grid">
              <RiskMap
                sources={sources}
                floodGeometry={floodGeometry}
                plan={plan}
                onSelectSource={(src) => setSelectedWhySource(src)}
              />
              <SelectedSitesStream
                plan={plan}
                sources={sources}
                onSelectSource={(src) => setSelectedWhySource(src)}
                onOpenFeedback={(id, code) => setFeedbackSource({ id, code })}
              />
            </div>
          </div>
        )}

        {/* TAB 2: Testing Queue & Allocation Table */}
        {activeTab === 'queue' && (
          <div className="animate-fade-in" style={{ marginTop: 24 }}>
            <TestingQueue
              queue={queue}
              onSelectSource={(src) => setSelectedWhySource(src)}
              onOpenFeedback={(id, code) => setFeedbackSource({ id, code })}
            />
          </div>
        )}

        {/* TAB 3: Benchmark Lab */}
        {activeTab === 'benchmark' && (
          <div style={{ marginTop: 24 }}>
            <BenchmarkLab plan={plan} />
          </div>
        )}

        {/* TAB 4: Cedar Auth Studio */}
        {activeTab === 'cedar' && (
          <div style={{ marginTop: 24 }}>
            <CedarStudio
              currentRole={currentRole}
              onRoleChange={handleRoleChange}
              eventId={activeEvent?.id}
              sourceId={sources[0]?.source_id}
            />
          </div>
        )}

        {/* TAB 5: Standing Rules & Safety */}
        {activeTab === 'rules' && (
          <RulesSafetyView />
        )}
      </main>

      {/* WHY? Explainability Modal / Drawer */}
      <WhyModal
        source={selectedWhySource}
        onClose={() => setSelectedWhySource(null)}
      />

      {/* What-If Sensitivity Weight Tuning Drawer */}
      <WeightTuningDrawer
        isOpen={isTuningOpen}
        onClose={() => setIsTuningOpen(false)}
        onWeightsChanged={() => handleRefreshAssessment()}
      />

      {/* AI & Decision Engine Inspector Modal */}
      <DecisionEngineInspectorModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
      />

      {/* Simulated Feedback Modal */}
      {feedbackSource && (activeEvent || events[0]) && (
        <FieldFeedbackModal
          sourceId={feedbackSource.id}
          sourceCode={feedbackSource.code}
          eventId={(activeEvent || events[0])!.id}
          onClose={() => setFeedbackSource(null)}
          onTestRecorded={() => handleRefreshAssessment()}
        />
      )}

      {/* Mastercard Dark Editorial Footer */}
      <Footer />
    </div>
  );
};
