import axios from 'axios';
import {
  FloodEvent,
  ScoredSource,
  QueueItem,
  TestingPlan,
  FieldTest,
  UserRole,
} from '../types';

const API_BASE = '/api/v1';

// Current active demo user role
let currentRole: UserRole = 'operator';

export const setDemoRole = (role: UserRole) => {
  currentRole = role;
};

export const getDemoRole = (): UserRole => currentRole;

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  config.headers['X-Demo-Role'] = currentRole;
  config.headers['X-Demo-User'] = `demo-${currentRole}`;
  return config;
});

export const fetchHealth = async () => {
  const res = await api.get('/health');
  return res.data;
};

export const fetchEvents = async (): Promise<FloodEvent[]> => {
  const res = await api.get('/flood-events');
  return res.data;
};

export const fetchSources = async (params?: {
  event_id?: string;
  ward_id?: string;
  source_type?: string;
  band?: string;
  search?: string;
  limit?: number;
}): Promise<ScoredSource[]> => {
  const res = await api.get('/sources', { params });
  return res.data;
};

export const fetchSourceDetail = async (sourceId: string): Promise<ScoredSource> => {
  const res = await api.get(`/sources/${sourceId}`);
  return res.data;
};

export const runRiskAssessment = async (eventId: string, configVersion: string = 'risk-v1') => {
  const res = await api.post('/risk-assessments/run', {
    event_id: eventId,
    config_version: configVersion,
  });
  return res.data;
};

export const fetchTestingQueue = async (
  eventId?: string,
  planId?: string
): Promise<QueueItem[]> => {
  const res = await api.get('/testing-queue', {
    params: { event_id: eventId, plan_id: planId, limit: 500 },
  });
  return res.data;
};

export const createTestingPlan = async (payload: {
  event_id: string;
  capacity_k: number;
  coverage_radius_m?: number;
  objective?: string;
  seed?: number;
}): Promise<TestingPlan> => {
  const res = await api.post('/testing-plans', {
    coverage_radius_m: 500,
    objective: 'max_unique_high_risk_population',
    seed: 42,
    include_baseline: true,
    baseline_trials: 1000,
    ...payload,
  });
  return res.data;
};

export const fetchRiskMapGeoJSON = async (eventId?: string, planId?: string) => {
  const res = await api.get('/risk-map', {
    params: { event_id: eventId, plan_id: planId },
  });
  return res.data;
};

export const recordFieldTest = async (payload: {
  event_id: string;
  source_id: string;
  test_type?: string;
  result_category?: string;
  verification_status?: string;
  notes?: string;
}): Promise<FieldTest> => {
  const res = await api.post('/field-tests', {
    test_type: 'rapid',
    result_category: 'abnormal',
    verification_status: 'simulated',
    notes: 'Demo simulated test trigger',
    ...payload,
  });
  return res.data;
};

export const fetchFieldTests = async (eventId?: string): Promise<FieldTest[]> => {
  const res = await api.get('/field-tests', { params: { event_id: eventId } });
  return res.data;
};

export const fetchRiskConfig = async (): Promise<import('../types').RiskConfigData> => {
  const res = await api.get('/config/risk');
  return res.data;
};

export const updateRiskWeights = async (weights: {
  flood_exposure: number;
  drain_proximity_risk: number;
  historical_risk: number;
  source_vulnerability: number;
  population_exposure: number;
}): Promise<import('../types').RiskConfigData> => {
  const res = await api.put('/config/risk', weights);
  return res.data;
};

export const resetRiskWeights = async (): Promise<import('../types').RiskConfigData> => {
  const res = await api.post('/config/risk/reset');
  return res.data;
};
