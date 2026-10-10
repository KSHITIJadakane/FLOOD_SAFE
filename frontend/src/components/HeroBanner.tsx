import React from 'react';
import { ShieldCheck, MapPin, Activity, Radio, AlertTriangle } from 'lucide-react';

interface HeroBannerProps {
  eventTitle?: string;
  sourceCount: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  eventTitle = 'Chennai Floods Incident Corridor (Cooum & Adyar River Basin)',
  sourceCount,
}) => {
  return (
    <div className="incident-header-panel animate-fade-in">
      <div className="incident-left">
        <div className="incident-status-row">
          <span className="incident-live-indicator">
            <span className="live-dot-pulse"></span>
            LIVE INCIDENT RESPONSE
          </span>
          <span className="incident-badge-basin">
            <MapPin size={12} />
            Chennai Metro Corridor
          </span>
          <span className="incident-badge-auth">
            <ShieldCheck size={12} />
            AWS Cedar Governed
          </span>
        </div>

        <h1 className="incident-title">
          Post-Flood Water Vulnerability Triage & Resource Allocation
        </h1>

        <p className="incident-desc">
          Multispectral spatial flood depth, drainage buffer proximity, and population density modeling across <strong>{sourceCount} monitored water points</strong>. Field teams dispatched via submodular Greedy Maximum Coverage (R = 500m).
        </p>
      </div>

      <div className="incident-right-metrics">
        <div className="incident-metric-item">
          <span className="metric-header-label">ACTIVE INUNDATION AREA</span>
          <span className="metric-header-val">42.6 km²</span>
          <span className="metric-header-sub">Cooum & Adyar Corridors</span>
        </div>
        <div className="incident-metric-item">
          <span className="metric-header-label">DISPATCH CONSTRAINT</span>
          <span className="metric-header-val">R = 500m</span>
          <span className="metric-header-sub">Non-overlapping geodesic</span>
        </div>
      </div>
    </div>
  );
};
