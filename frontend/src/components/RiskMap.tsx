import React, { useState } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Polygon,
  Tooltip,
} from 'react-leaflet';
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

  const center: [number, number] = [13.045, 80.225];

  const basemapUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    satellite: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    streets: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
  };

  const selectedMap = new Map<string, number>();
  if (plan) {
    plan.selected.forEach((s) => {
      selectedMap.set(s.source_id, s.order);
    });
  }

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div className="mono-eyebrow">
            <span className="dot" />
            <span>SPATIAL GIS ALLOCATION</span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}>Geographic Allocation Map</h3>
        </div>

        {/* Layer & Basemap Toggles */}
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', fontSize: 12, fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '0.06em', flexWrap: 'wrap' }}>
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
              🛰️ Google Satellite
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

          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'var(--ink-label)' }}>
            <input
              type="checkbox"
              checked={showFlood}
              onChange={(e) => setShowFlood(e.target.checked)}
            />
            <span>Flood Inundation</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'var(--ink-label)' }}>
            <input
              type="checkbox"
              checked={showSources}
              onChange={(e) => setShowSources(e.target.checked)}
            />
            <span>Sources ({sources.length})</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: 'var(--ink-label)' }}>
            <input
              type="checkbox"
              checked={showCoverageCircles}
              onChange={(e) => setShowCoverageCircles(e.target.checked)}
            />
            <span>500m Radii (K={plan?.selected.length || 0})</span>
          </label>
        </div>
      </div>

      <div className="map-container-frame">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%', background: '#111827' }}
        >
          {/* Dynamic Basemap Layer */}
          <TileLayer
            key={basemapStyle}
            attribution='&copy; Google Maps / OpenStreetMap / CARTO'
            url={basemapUrls[basemapStyle]}
            maxZoom={20}
          />

          {/* Flood Inundation Polygons (Data Blue #0060A4) */}
          {showFlood &&
            floodPolygons.map((poly, idx) => (
              <Polygon
                key={`flood-${idx}`}
                positions={poly}
                pathOptions={{
                  color: '#0060A4',
                  fillColor: '#0060A4',
                  fillOpacity: 0.18,
                  weight: 1.5,
                  dashArray: '3, 3',
                }}
              >
                <Tooltip sticky>Simulated Inundation Corridor</Tooltip>
              </Polygon>
            ))}

          {/* Optimizer 500m Coverage Circles (Pine Green #116C3A) */}
          {showCoverageCircles &&
            plan &&
            plan.selected.map((site) => (
              <Circle
                key={`circle-${site.source_id}`}
                center={[site.latitude, site.longitude]}
                radius={500}
                pathOptions={{
                  color: '#116C3A',
                  fillColor: '#116C3A',
                  fillOpacity: 0.12,
                  weight: 1.5,
                  dashArray: '4, 4',
                }}
              />
            ))}

          {/* Water Sources Markers */}
          {showSources &&
            sources.map((src) => {
              const selOrder = selectedMap.get(src.source_id);
              const isSelected = selOrder !== undefined;
              const color = getBandColor(src.band);

              return (
                <CircleMarker
                  key={src.source_id}
                  center={[src.latitude, src.longitude]}
                  radius={isSelected ? 8.5 : 5}
                  pathOptions={{
                    color: isSelected ? '#17130E' : color,
                    fillColor: isSelected ? '#116C3A' : color,
                    fillOpacity: isSelected ? 1 : 0.85,
                    weight: isSelected ? 2.5 : 1,
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
                          ★ Optimizer Selected Pick #{selOrder}
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
            Very High (0.75 - 1.00)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: 'var(--warning)' }} />
            High (0.50 - 0.75)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: 'var(--band-moderate)' }} />
            Moderate (0.25 - 0.50)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 8, height: 8, background: 'var(--success)' }} />
            Low (0.00 - 0.25)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 6 }}>
            <span style={{ width: 10, height: 10, border: '2px solid #17130E', background: 'var(--brand)' }} />
            Selected Site (K)
          </span>
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink-muted)' }}>
          EPSG:4326 / Metric Geodesic R=500m
        </div>
      </div>
    </div>
  );
};
