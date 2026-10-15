import React, { useState } from 'react';
import { UserRole } from '../types';
import { ShieldCheck, ChevronDown, Check, Moon, Sun, ExternalLink, Sliders, Sparkles } from 'lucide-react';

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
  const [isDark, setIsDark] = useState(false);

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

  return (
    <>
      {/* 1. Top Bar (WeMakeDevs x AWS Header) */}
      <header className="top-header-bar">
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

        {/* Center Nav Links */}
        <nav className="header-center-nav">
          <button
            className={`nav-link-item ${activeTab === 'command' ? 'active' : ''}`}
            onClick={() => onTabChange('command')}
          >
            OVERVIEW
          </button>
          <button
            className={`nav-link-item ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => onTabChange('queue')}
          >
            ALLOCATION
          </button>
          <button
            className={`nav-link-item ${activeTab === 'benchmark' ? 'active' : ''}`}
            onClick={() => onTabChange('benchmark')}
          >
            BENCHMARKS
          </button>
          <button
            className={`nav-link-item ${activeTab === 'satellite' ? 'active' : ''}`}
            onClick={() => onTabChange('satellite')}
          >
            SATELLITE SAR
          </button>
          <button
            className={`nav-link-item ${activeTab === 'cedar' ? 'active' : ''}`}
            onClick={() => onTabChange('cedar')}
          >
            CEDAR AUTH
          </button>
          <button
            className={`nav-link-item ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => onTabChange('rules')}
          >
            RULES
          </button>
        </nav>

        {/* Right Actions */}
        <div className="header-actions-row">

          {onOpenTuning && (
            <button
              className="btn btn-secondary btn-compact"
              onClick={onOpenTuning}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                background: 'var(--tint)',
                border: '1px solid var(--line-card)',
                color: 'var(--ink)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              title="What-If MCDA Sensitivity Tuning"
            >
              <Sliders size={13} style={{ color: 'var(--brand-text)' }} />
              <span>What-If Tuning</span>
            </button>
          )}

          {onOpenInspector && (
            <button
              className="btn btn-secondary btn-compact"
              onClick={onOpenInspector}
              style={{
                fontSize: 12,
                padding: '6px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600,
                background: 'var(--tint)',
                border: '1px solid var(--line-card)',
                color: 'var(--ink)',
                cursor: 'pointer',
                transition: 'all 120ms ease',
              }}
              title="Inspect Decision Engine & AI Pipelines"
            >
              <Sparkles size={13} style={{ color: 'var(--brand-text)' }} />
              <span>AI Inspector</span>
            </button>
          )}

          <div className="registered-pill">
            <Check size={13} strokeWidth={3} />
            <span>Registered</span>
          </div>

          {/* User Profile Chip with Cedar Role Selector Dropdown */}
          <div className="user-profile-wrapper">
            <button
              className="user-profile-chip"
              onClick={() => setUserDropdownOpen(!userDropdownOpen)}
              aria-expanded={userDropdownOpen}
            >
              <div className="user-avatar-badge">
                <span>🤖</span>
              </div>
              <span className="user-profile-name">SUMEDH NIRWAN</span>
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

      {/* 2. Subheader Tab Bar (56px) */}
      <div className="sub-tab-strip-container">
        <div className="sub-tab-strip">
          <button
            role="tab"
            aria-selected={activeTab === 'command'}
            className={`sub-tab-item ${activeTab === 'command' ? 'active' : ''}`}
            onClick={() => onTabChange('command')}
          >
            <span>OVERVIEW</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'queue'}
            className={`sub-tab-item ${activeTab === 'queue' ? 'active' : ''}`}
            onClick={() => onTabChange('queue')}
          >
            <span>ALLOCATION QUEUE</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'benchmark'}
            className={`sub-tab-item ${activeTab === 'benchmark' ? 'active' : ''}`}
            onClick={() => onTabChange('benchmark')}
          >
            <span>OPTIMIZER LAB</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'cedar'}
            className={`sub-tab-item ${activeTab === 'cedar' ? 'active' : ''}`}
            onClick={() => onTabChange('cedar')}
          >
            <span>CEDAR POLICIES</span>
          </button>
          <button
            role="tab"
            aria-selected={activeTab === 'rules'}
            className={`sub-tab-item ${activeTab === 'rules' ? 'active' : ''}`}
            onClick={() => onTabChange('rules')}
          >
            <span>RULES & SAFETY</span>
          </button>
        </div>
      </div>
    </>
  );
};
