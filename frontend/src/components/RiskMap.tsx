import React, { useState, useEffect, useRef } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Polygon,
  Tooltip,
} from 'react-leaflet';
import { Play, Pause, RotateCcw, FastForward, Sparkles } from 'lucide-react';
import { ScoredSource, TestingPlan } from '../types';

interface RiskMapProps {
  sources: ScoredSource[];
  plan: TestingPlan | null;
  floodGeometry: any;
  onSelectSource: (source: ScoredSource) => void;
}

const getBandColor = (band: string) => {
  switch (band) {
    case 'very_high':
      return '#A8281F'; // Danger Red
    case 'high':
      return '#9A6412'; // Warning Amber
    case 'moderate':
      return '#CA8A04'; // Ochre
    case 'low':
      return '#3F7A58'; // Success Pine
    default:
      return '#7A756D';
  }
};

export const RiskMap: React.FC<RiskMapProps> = ({
  sources,
  plan,
  floodGeometry,
  onSelectSource,
}) => {
  const [showFlood, setShowFlood] = useState(true);
  const [showSources, setShowSources] = useState(true);
  const [showCoverageCircles, setShowCoverageCircles] = useState(true);
  const [basemapStyle, setBasemapStyle] = useState<'satellite' | 'dark' | 'streets'>('dark');

  // Interactive Greedy Animation Replay State
  const [animatedStep, setAnimatedStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(900); // ms per step
  const timerRef = useRef<any>(null);

  const totalSteps = plan ? plan.selected.length : 0;

  // Auto-reset animated step when plan changes
  useEffect(() => {
    if (plan && plan.selected.length > 0) {
      setAnimatedStep(plan.selected.length);
    } else {
      setAnimatedStep(0);
    }
  }, [plan]);

  // Animation Loop
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setAnimatedStep((prev) => {
          if (prev >= totalSteps) {
            setIsPlaying(false);
            return totalSteps;
          }
          return prev + 1;
        });
      }, playbackSpeed);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, totalSteps, playbackSpeed]);

  const handlePlayPause = () => {
    if (animatedStep >= totalSteps) {
      setAnimatedStep(1);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setAnimatedStep(totalSteps);
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    setAnimatedStep((prev) => Math.min(prev + 1, totalSteps));
  };

  const center: [number, number] = [13.045, 80.225];

  const basemapUrls = {
    dark: 'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    streets: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  };

  // Build active selected map up to animatedStep
  const visibleSelected = plan ? plan.selected.slice(0, animatedStep) : [];
  const currentActivePick = plan && animatedStep > 0 && animatedStep <= plan.selected.length
    ? plan.selected[animatedStep - 1]
    : null;

  const selectedMap = new Map<string, number>();
  visibleSelected.forEach((s) => {
    selectedMap.set(s.source_id, s.order);
  });

  // Convert GeoJSON MultiPolygon coordinates to Leaflet lat/lng polygons
  const floodPolygons: [number, number][][] = [];
  if (floodGeometry && floodGeometry.coordinates) {
    floodGeometry.coordinates.forEach((poly: any) => {
      const ring = poly[0] || poly;
      const latLngs = ring.map((pt: number[]) => [pt[1], pt[0]] as [number, number]);
      floodPolygons.push(latLngs);
    });
  }

  return (
    <div className="panel-paper animate-fade-in" style={{ height: '100%' }}>
      {/* Top Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div className="mono-eyebrow">
            <span className="dot" />
            <span>GREEDY MAX-COVERAGE GIS ENGINE</span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Geographic Allocation Map</h3>
        </div>

        {/* Greedy Replay Animation Bar */}
        {plan && totalSteps > 0 && (
          <div className="map-replay-controls-bar">
            <span style={{ fontSize: 11, fontFamily: 'var(--mono)', color: 'var(--ink-label)', textTransform: 'uppercase', marginRight: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Sparkles size={12} style={{ color: 'var(--brand)' }} />
              Replay:
            </span>
            <button
              className={`replay-btn ${isPlaying ? 'active' : ''}`}
              onClick={handlePlayPause}
              title={isPlaying ? 'Pause Animation' : 'Play Step-by-Step Greedy Replay'}
            >
              {isPlaying ? <Pause size={12} /> : <Play size={12} />}
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              className="replay-btn"
              onClick={handleStepForward}
              disabled={animatedStep >= totalSteps}
              title="Step Forward"
            >
              <FastForward size={12} />
              <span>Step</span>
            </button>
            <button
              className="replay-btn"
              onClick={handleReset}
              title="Reset to All Sites"
            >
              <RotateCcw size={12} />
              <span>All ({totalSteps})</span>
            </button>
            <span style={{ fontFamily: 'var(--mono)', fontSize: 11.5, fontWeight: 700, color: 'var(--brand-text)', padding: '2px 6px', background: 'var(--tint)', borderRadius: 3 }}>
              Step {animatedStep}/{totalSteps}
            </span>
          </div>
        )}

        {/* Layer & Basemap Toggles */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', fontSize: 11.5, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', flexWrap: 'wrap' }}>
          {/* Basemap Switcher */}
          <div style={{ display: 'flex', background: 'var(--surface)', border: '1px solid var(--line-card)', borderRadius: 4, padding: 2 }}>
            <button
              onClick={() => setBasemapStyle('dark')}
              style={{
                background: basemapStyle === 'dark' ? 'var(--brand)' : 'transparent',
                color: basemapStyle === 'dark' ? '#fff' : 'var(--ink-body)',
                border: 'none',
                padding: '3px 8px',
                fontSize: 10,
                fontFamily: 'var(--mono)',
                cursor: 'pointer',
                borderRadius: 3,
              }}
            >
              Dark
            </button>
            <button
              onClick={() => setBasemapStyle('satellite')}
              style={{
                background: basemapStyle === 'satellite' ? 'var(--brand)' : 'transparent',
                color: basemapStyle === 'satellite' ? '#fff' : 'var(--ink-body)',
                border: 'none',
                padding: '3px 8px',
                fontSize: 10,
                fontFamily: 'var(--mono)',
                cursor: 'pointer',
                borderRadius: 3,
              }}
            >
              🛰️ Satellite
            </button>
            <button
              onClick={() => setBasemapStyle('streets')}
              style={{
                background: basemapStyle === 'streets' ? 'var(--brand)' : 'transparent',
                color: basemapStyle === 'streets' ? '#fff' : 'var(--ink-body)',
                border: 'none',
                padding: '3px 8px',
                fontSize: 10,
                fontFamily: 'var(--mono)',
                cursor: 'pointer',
                borderRadius: 3,
              }}
            >
              Streets
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: 'var(--ink-label)' }}>
            <input
              type="checkbox"
              checked={showFlood}
              onChange={(e) => setShowFlood(e.target.checked)}
            />
            <span>Flood Zone</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: 'var(--ink-label)' }}>
            <input
              type="checkbox"
              checked={showCoverageCircles}
              onChange={(e) => setShowCoverageCircles(e.target.checked)}
            />
            <span>500m Radii ({visibleSelected.length})</span>
          </label>
        </div>
      </div>

      <div className="map-container-frame">
        {/* Live Replay HUD Overlay */}
        {plan && currentActivePick && animatedStep > 0 && (
          <div className="map-replay-hud animate-fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--mono)', letterSpacing: '0.08em', color: '#5EEAD4', textTransform: 'uppercase', fontWeight: 700 }}>
                🎯 GREEDY PICK #{currentActivePick.order} of {totalSteps}
              </span>
              <span className={`band-pill ${currentActivePick.band}`} style={{ fontSize: 9.5, padding: '1px 5px' }}>
                {currentActivePick.band}
              </span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--mono)', color: '#FFFFFF', marginBottom: 4 }}>
              {currentActivePick.source_code} ({currentActivePick.source_type.replace('_', ' ')})
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--mono)', color: '#CBD5E1', marginBottom: 2 }}>
              <span>Marginal Pop Gain:</span>
              <strong style={{ color: '#34D399' }}>+{currentActivePick.marginal_coverage.toLocaleString()}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontFamily: 'var(--mono)', color: '#CBD5E1' }}>
              <span>Cumulative Covered:</span>
              <strong style={{ color: '#FFFFFF' }}>{currentActivePick.cumulative_coverage.toLocaleString()}</strong>
            </div>
            <div style={{ marginTop: 6, paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.15)', fontSize: 10.5, color: '#94A3B8', fontFamily: 'var(--mono)' }}>
              ✦ Zero double-counting verified within R=500m
            </div>
          </div>
        )}

        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#111827' }}
        >
          {/* Dynamic Basemap Layer */}
          <TileLayer
            key={basemapStyle}
            attribution='&copy; OpenStreetMap / CARTO / Esri'
            url={basemapUrls[basemapStyle]}
            maxZoom={20}
          />

          {/* Flood Inundation Polygons */}
          {showFlood &&
            floodPolygons.map((poly, idx) => (
              <Polygon
                key={`flood-${idx}`}
                positions={poly}
                pathOptions={{
                  color: '#0060A4',
                  fillColor: '#0060A4',
                  fillOpacity: 0.20,
                  weight: 1.5,
                  dashArray: '3, 3',
                }}
              >
                <Tooltip sticky>Simulated Inundation Corridor</Tooltip>
              </Polygon>
            ))}

          {/* Optimizer 500m Coverage Circles (Animated up to animatedStep) */}
          {showCoverageCircles &&
            visibleSelected.map((site) => {
              const isCurrentActive = currentActivePick && currentActivePick.source_id === site.source_id;
              return (
                <Circle
                  key={`circle-${site.source_id}-${animatedStep}`}
                  center={[site.latitude, site.longitude]}
                  radius={500}
                  pathOptions={{
                    color: isCurrentActive ? '#2DD4BF' : '#116C3A',
                    fillColor: isCurrentActive ? '#2DD4BF' : '#116C3A',
                    fillOpacity: isCurrentActive ? 0.25 : 0.12,
                    weight: isCurrentActive ? 2.5 : 1.5,
                    dashArray: isCurrentActive ? undefined : '4, 4',
                  }}
                />
              );
            })}

          {/* Water Sources Markers */}
          {showSources &&
            sources.map((src) => {
              const selOrder = selectedMap.get(src.source_id);
              const isSelected = selOrder !== undefined;
              const isCurrentActive = currentActivePick && currentActivePick.source_id === src.source_id;
              const color = getBandColor(src.band);

              return (
                <CircleMarker
                  key={src.source_id}
                  center={[src.latitude, src.longitude]}
                  radius={isCurrentActive ? 11 : (isSelected ? 8.5 : 5)}
                  pathOptions={{
                    color: isCurrentActive ? '#5EEAD4' : (isSelected ? '#17130E' : color),
                    fillColor: isCurrentActive ? '#0D9488' : (isSelected ? '#116C3A' : color),
                    fillOpacity: isSelected ? 1 : 0.85,
                    weight: isCurrentActive ? 3.5 : (isSelected ? 2.5 : 1),
                  }}
                  eventHandlers={{
                    click: () => onSelectSource(src),
                  }}
                >
                  <Tooltip>
                    <div style={{ padding: 4, fontSize: 12.5, fontFamily: 'Inter, sans-serif' }}>
                      <strong style={{ fontSize: 13, fontFamily: 'JetBrains Mono', color: '#17130E' }}>
                        {src.source_code}
                      </strong> ({src.source_type.replace('_', ' ')})
                      <br />
                      Priority Score: <strong>{src.relative_vulnerability_score.toFixed(2)}</strong> ({src.band})
                      <br />
                      Served Pop: ~{src.population_served.toLocaleString()}
                      {isSelected && (
                        <div style={{ color: '#086733', fontWeight: 'bold', marginTop: 4 }}>
                          ★ Greedy Pick #{selOrder} (+{visibleSelected.find(s => s.source_id === src.source_id)?.marginal_coverage.toLocaleString()} pop)
                        </div>
                      )}
                    </div>
                  </Tooltip>
                </CircleMarker>
              );
            })}
        </MapContainer>
      </div>

      {/* Map Legend */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, fontSize: 12, color: 'var(--ink-label)', fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, color: 'var(--ink)' }}>BANDS:</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: 'var(--danger)' }} />
            Very High
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: 'var(--warning)' }} />
            High
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: 'var(--band-moderate)' }} />
            Moderate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: 'var(--success)' }} />
            Low
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
            <span style={{ width: 10, height: 10, border: '2px solid #5EEAD4', background: '#0D9488' }} />
            Greedy Selection ({visibleSelected.length})
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
          Greedy Maximum Coverage (R=500m / Metric Geodesic)
        </div>
      </div>
    </div>
  );
};
