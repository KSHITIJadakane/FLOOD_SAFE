import React, { useState, useEffect, useRef } from 'react';
import { UserRole } from '../types';
import {
  ChevronDown,
  Check,
  Moon,
  Sun,
  Sliders,
  Sparkles,
  Satellite,
  BarChart3,
  ShieldCheck,
  Scale,
} from 'lucide-react';

export type ActiveNavTab = 'command' | 'queue' | 'benchmark' | 'satellite' | 'cedar' | 'rules';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  activeTab: ActiveNavTab;
  onTabChange: (tab: ActiveNavTab) => void;
  onOpenTuning?: () => void;
  onOpenInspector?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onRoleChange,
  activeTab,
  onTabChange,
  onOpenTuning,
  onOpenInspector,
}) => {
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [intelDropdownOpen, setIntelDropdownOpen] = useState(false);
  const [govDropdownOpen, setGovDropdownOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const headerRef = useRef<HTMLElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setIntelDropdownOpen(false);
        setGovDropdownOpen(false);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const roleLabels: Record<UserRole, { title: string; desc: string; badge: string }> = {
    operator: { title: 'Operator', desc: 'Can run triage assessments & create testing plans', badge: 'Active Plan' },
    viewer: { title: 'Viewer', desc: 'Read-only access (403 forbidden on mutations)', badge: 'Read Only' },
    field_recorder: { title: 'Field Recorder', desc: 'Can record simulated field test results', badge: 'Simulated Only' },
    admin: { title: 'Admin', desc: 'Full authority including verified test outcomes', badge: 'Full Admin' },
  };

  const isIntelActive = activeTab === 'satellite' || activeTab === 'benchmark';
  const isGovActive = activeTab === 'cedar' || activeTab === 'rules';

  return (
    <header className="top-header-bar" ref={headerRef}>
      {/* Left: WeMakeDevs < > x aws Brand Lockup */}
      <div className="header-brand-lockup">
        <div className="wmd-logo-box">
          <span className="wmd-brackets">&lt; /&gt;</span>
        </div>
        <span className="brand-cross">×</span>
        <div className="aws-logo-box">
          <span className="aws-brand-text">aws</span>
        </div>
        <div className="brand-divider-hairline"></div>
        <div className="floodsafe-brand-meta">
          <span className="floodsafe-title">FloodSafe</span>
          <span className="floodsafe-tag">WATER TRIAGE</span>
        </div>
      </div>

      {/* Center Nav: Clean, Grouped & Dropdown-Clubbed */}
      <nav className="header-center-nav">
        {/* 1. Core Operation: Overview */}
        <button
          className={`nav-link-item ${activeTab === 'command' ? 'active' : ''}`}
          onClick={() => {
            onTabChange('command');
            setIntelDropdownOpen(false);
            setGovDropdownOpen(false);
          }}
        >
          OVERVIEW
        </button>

        {/* 2. Core Operation: Allocation */}
        <button
          className={`nav-link-item ${activeTab === 'queue' ? 'active' : ''}`}
          onClick={() => {
            onTabChange('queue');
            setIntelDropdownOpen(false);
            setGovDropdownOpen(false);
          }}
        >
          ALLOCATION
        </button>

        {/* 3. Clubbed Dropdown: Intelligence Lab */}
        <div className="nav-dropdown-wrapper">
          <button
            className={`nav-dropdown-trigger ${isIntelActive ? 'active' : ''} ${intelDropdownOpen ? 'open' : ''}`}
            onClick={() => {
              setIntelDropdownOpen(!intelDropdownOpen);
              setGovDropdownOpen(false);
              setUserDropdownOpen(false);
            }}
          >
            <span>INTELLIGENCE</span>
            {isIntelActive && <span className="nav-active-pip" />}
            <ChevronDown size={13} className={`dropdown-chevron ${intelDropdownOpen ? 'open' : ''}`} />
          </button>

          {intelDropdownOpen && (
            <div className="nav-dropdown-menu animate-fade-in">
              <button
                className={`nav-dropdown-item ${activeTab === 'satellite' ? 'active' : ''}`}
                onClick={() => {
                  onTabChange('satellite');
                  setIntelDropdownOpen(false);
                }}
              >
                <div className="nav-dropdown-icon-box">
                  <Satellite size={16} />
                </div>
                <div>
                  <div className="nav-dropdown-item-title">
                    <span>Satellite SAR Explorer</span>
                    {activeTab === 'satellite' && <span className="active-dot">● ACTIVE</span>}
                  </div>
                  <div className="nav-dropdown-item-desc">
                    Copernicus Sentinel-1 C-band radar STAC scene discovery & calibrated backscatter
                  </div>
                </div>
              </button>

              <button
                className={`nav-dropdown-item ${activeTab === 'benchmark' ? 'active' : ''}`}
                onClick={() => {
                  onTabChange('benchmark');
                  setIntelDropdownOpen(false);
                }}
              >
                <div className="nav-dropdown-icon-box">
                  <BarChart3 size={16} />
                </div>
                <div>
                  <div className="nav-dropdown-item-title">
                    <span>Optimizer Benchmarks</span>
                    {activeTab === 'benchmark' && <span className="active-dot">● ACTIVE</span>}
                  </div>
                  <div className="nav-dropdown-item-desc">
                    Empirical +194.1% population coverage lift vs. Naive Top-K & Monte Carlo
                  </div>
                </div>
              </button>

              {(onOpenTuning || onOpenInspector) && <div className="nav-dropdown-divider" />}

              {onOpenTuning && (
                <button
                  className="nav-dropdown-item"
                  onClick={() => {
                    onOpenTuning();
                    setIntelDropdownOpen(false);
                  }}
                >
                  <div className="nav-dropdown-icon-box">
                    <Sliders size={16} />
                  </div>
                  <div>
                    <div className="nav-dropdown-item-title">What-If Sensitivity Sliders</div>
                    <div className="nav-dropdown-item-desc">
                      Dynamically tune the 5 MCDA risk weights with live recalculated rankings
                    </div>
                  </div>
                </button>
              )}

              {onOpenInspector && (
                <button
                  className="nav-dropdown-item"
                  onClick={() => {
                    onOpenInspector();
                    setIntelDropdownOpen(false);
                  }}
                >
                  <div className="nav-dropdown-icon-box">
                    <Sparkles size={16} />
                  </div>
                  <div>
                    <div className="nav-dropdown-item-title">AI & Decision Inspector</div>
                    <div className="nav-dropdown-item-desc">
                      Inspect mathematical proofs, neutral imputation, and Cedar safety boundaries
                    </div>
                  </div>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 4. Clubbed Dropdown: Governance & Safety */}
        <div className="nav-dropdown-wrapper">
          <button
            className={`nav-dropdown-trigger ${isGovActive ? 'active' : ''} ${govDropdownOpen ? 'open' : ''}`}
            onClick={() => {
              setGovDropdownOpen(!govDropdownOpen);
              setIntelDropdownOpen(false);
              setUserDropdownOpen(false);
            }}
          >
            <span>GOVERNANCE</span>
            {isGovActive && <span className="nav-active-pip" />}
            <ChevronDown size={13} className={`dropdown-chevron ${govDropdownOpen ? 'open' : ''}`} />
          </button>

          {govDropdownOpen && (
            <div className="nav-dropdown-menu animate-fade-in">
              <button
                className={`nav-dropdown-item ${activeTab === 'cedar' ? 'active' : ''}`}
                onClick={() => {
                  onTabChange('cedar');
                  setGovDropdownOpen(false);
                }}
              >
                <div className="nav-dropdown-icon-box">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <div className="nav-dropdown-item-title">
                    <span>Cedar Policy Studio</span>
                    {activeTab === 'cedar' && <span className="active-dot">● ACTIVE</span>}
                  </div>
                  <div className="nav-dropdown-item-desc">
                    Declarative RBAC evaluation & live AWS DynamoDB audit stream
                  </div>
                </div>
              </button>

              <button
                className={`nav-dropdown-item ${activeTab === 'rules' ? 'active' : ''}`}
                onClick={() => {
                  onTabChange('rules');
                  setGovDropdownOpen(false);
                }}
              >
                <div className="nav-dropdown-icon-box">
                  <Scale size={16} />
                </div>
                <div>
                  <div className="nav-dropdown-item-title">
                    <span>Standing Rules & Safety</span>
                    {activeTab === 'rules' && <span className="active-dot">● ACTIVE</span>}
                  </div>
                  <div className="nav-dropdown-item-desc">
                    Systemic non-negotiables, non-contamination disclaimers, and ethics
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Right Actions: Clean & Focused */}
      <div className="header-actions-row">
        <div className="registered-pill">
          <Check size={13} strokeWidth={3} />
          <span>Registered</span>
        </div>

        {/* User Profile Chip with Cedar Role Selector Dropdown */}
        <div className="user-profile-wrapper">
          <button
            className="user-profile-chip"
            onClick={() => {
              setUserDropdownOpen(!userDropdownOpen);
              setIntelDropdownOpen(false);
              setGovDropdownOpen(false);
            }}
            aria-expanded={userDropdownOpen}
          >
            <div className="user-avatar-badge">
              <span>🤖</span>
            </div>
            <span className="user-profile-name">ABHAYA DEOGADE</span>
            <span className="user-role-subtag">({currentRole.toUpperCase()})</span>
            <ChevronDown size={14} className={`dropdown-chevron ${userDropdownOpen ? 'open' : ''}`} />
          </button>

          {userDropdownOpen && (
            <div className="user-role-dropdown-menu animate-fade-in">
              <div className="dropdown-header">
                <div className="dropdown-title">CEDAR IDENTITY CONTEXT</div>
                <div className="dropdown-subtitle">Simulate authorization principal</div>
              </div>

              {(['operator', 'viewer', 'field_recorder', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  className={`role-option-item ${currentRole === r ? 'selected' : ''}`}
                  onClick={() => {
                    onRoleChange(r);
                    setUserDropdownOpen(false);
                  }}
                >
                  <div className="role-option-top">
                    <span className="role-name">{roleLabels[r].title}</span>
                    {currentRole === r && <span className="active-dot">● ACTIVE</span>}
                  </div>
                  <div className="role-desc">{roleLabels[r].desc}</div>
                </button>
              ))}

              <div className="dropdown-footer">
                <span style={{ fontSize: 11, color: 'var(--ink-label)', fontFamily: 'var(--mono)' }}>
                  POLICIES: STRICT DEFAULT-DENY
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
};
