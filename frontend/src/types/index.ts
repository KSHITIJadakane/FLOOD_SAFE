export type SourceType = 'well' | 'public_tap' | 'storage_point';
export type RiskBand = 'low' | 'moderate' | 'high' | 'very_high';
export type VerificationStatus = 'simulated' | 'unverified' | 'verified';
export type UserRole = 'viewer' | 'operator' | 'field_recorder' | 'admin';

export interface FloodEvent {
  id: string;
  name: string;
  event_time: string;
  geometry: any;
  data_version: string;
  is_synthetic: boolean;
  status: string;
  created_at: string;
}

export type IoTSensorType = 'water_level_ultrasonic' | 'submersible_pressure' | 'drain_overflow_gauge';
export type IoTSensorStatus = 'normal' | 'alert' | 'flooded' | 'offline';

export interface IoTSensorNode {
  id: string;
  node_code: string;
  ward_id: string;
  name: string;
  latitude: number;
  longitude: number;
  sensor_type: IoTSensorType;
  current_water_level_m: number;
  alert_threshold_m: number;
  flood_threshold_m: number;
  rate_of_rise_m_per_hr: number;
  status: IoTSensorStatus;
  battery_pct: number;
  last_heartbeat: string;
  is_synthetic: boolean;
}

export interface ScoredSource {
  source_id: string;
  source_code: string;
  source_type: SourceType;
  latitude: number;
  longitude: number;
  ward_id?: string;
  population_served: number;
  relative_vulnerability_score: number;
  band: RiskBand;
  feature_values: {
    flood_exposure?: number | null;
    drain_proximity_risk?: number | null;
    historical_risk?: number | null;
    source_vulnerability?: number | null;
    population_exposure?: number | null;
  };
  feature_contributions: Record<string, number>;
  missing_features: string[];
  data_quality: string;
  quality_score: number;
  elevation_m?: number;
  topographic_wetness_index?: number;
  sar_backscatter_db?: number;
  nearest_iot_node_id?: string;
  iot_water_level_m?: number | null;
  iot_status?: string | null;
  spatial_uplift?: number;
  uplift_sources?: Array<{
    source_id: string;
    source_code: string;
    distance_m: number;
    decayed_uplift: number;
    drainage_relation: string;
  }>;
  explanation: string;
  disclaimer: string;
  config_version: string;
  data_version: string;
  is_synthetic: boolean;
}

export interface RiskConfigData {
  version: string;
  weights: {
    flood_exposure: number;
    drain_proximity_risk: number;
    historical_risk: number;
    source_vulnerability: number;
    population_exposure: number;
  };
  neutral_value: number;
  bands: Record<string, [number, number]>;
  optimizer: Record<string, any>;
  feedback: Record<string, any>;
  is_custom_tuned: boolean;
}

export interface QueueItem {
  rank: number;
  source_id: string;
  source_code: string;
  source_type: SourceType;
  ward_id?: string;
  latitude: number;
  longitude: number;
  relative_vulnerability_score: number;
  band: RiskBand;
  population_served: number;
  top_factors: string[];
  quality_score: number;
  data_quality: string;
  missing_features: string[];
  is_selected_by_optimizer: boolean;
  selection_order?: number;
  is_synthetic: boolean;
}

export interface SelectedSite {
  order: number;
  source_id: string;
  source_code: string;
  source_type: SourceType;
  latitude: number;
  longitude: number;
  marginal_coverage: number;
  cumulative_coverage: number;
  relative_vulnerability_score: number;
  band: RiskBand;
  covered_unit_ids: string[];
}

export interface PlanMetrics {
  unique_population_covered: number;
  total_high_risk_population: number;
  pct_high_risk_covered: number;
  covered_per_test: number;
  overlap: number;
  runtime_ms: number;
}

export interface BaselineStats {
  trials: number;
  seed: number;
  mean: number;
  median: number;
  p5: number;
  p95: number;
  optimizer: number;
  top_k_score: number;
  gain_over_random_mean: number;
  gain_over_top_k: number;
}

export interface TestingPlan {
  plan_id: string;
  event_id: string;
  assessment_run_id: string;
  capacity_k: number;
  coverage_definition: {
    type: string;
    radius_m: number;
  };
  objective: string;
  algorithm_version: string;
  data_version: string;
  random_seed: number;
  selected: SelectedSite[];
  metrics: PlanMetrics;
  baseline?: BaselineStats;
  created_at: string;
  is_synthetic: boolean;
}

export interface FieldTest {
  id: string;
  event_id: string;
  source_id: string;
  observed_at: string;
  recorded_by: string;
  test_type: string;
  result_category: 'normal' | 'abnormal' | 'inconclusive';
  verification_status: VerificationStatus;
  notes?: string;
  created_at: string;
}
