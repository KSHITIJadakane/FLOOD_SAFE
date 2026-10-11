import React, { useState } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Lock, AlertTriangle, Play } from 'lucide-react';
import { UserRole } from '../types';
import { api } from '../services/api';

interface CedarStudioProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  eventId?: string;
  sourceId?: string;
}

export const CedarStudio: React.FC<CedarStudioProps> = ({ currentRole, onRoleChange, eventId, sourceId }) => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const getEffectiveEventAndSource = async () => {
    let effectiveEventId = eventId;
    let effectiveSourceId = sourceId;

    if (!effectiveEventId) {
      try {
        const eventsRes = await api.get('/events');
        if (eventsRes.data && eventsRes.data.length > 0) {
          effectiveEventId = eventsRes.data[0].id;
        }
      } catch (e) {
        console.error('Failed to fetch events', e);
      }
    }

    if (effectiveEventId && !effectiveSourceId) {
      try {
        const sourcesRes = await api.get(`/sources?event_id=${effectiveEventId}`);
        if (sourcesRes.data && sourcesRes.data.length > 0) {
          effectiveSourceId = sourcesRes.data[0].source_id;
        }
      } catch (e) {
        console.error('Failed to fetch sources', e);
      }
    }

    return { effectiveEventId: effectiveEventId || 'default-event', effectiveSourceId: effectiveSourceId || 'default-source' };
  };

  const testAction = async (action: string) => {
    setLoading(true);
    setTestResult(null);
    try {
      const { effectiveEventId, effectiveSourceId } = await getEffectiveEventAndSource();

      if (action === 'CreatePlan') {
        await api.post('/testing-plans', {
          event_id: effectiveEventId,
          capacity_k: 5,
        }, {
          headers: { 'X-Demo-Role': currentRole, 'X-Demo-User': `demo-${currentRole}` }
        });
        setTestResult({
          status: 200,
          action,
          allowed: true,
          message: `200 PERMITTED: Action 'CreatePlan' authorized for role '${currentRole.replace('_', ' ')}' under Cedar policy.`,
        });
      } else if (action === 'IssueAdvisory') {
        await api.post('/advisories', {}, {
          headers: { 'X-Demo-Role': currentRole, 'X-Demo-User': `demo-${currentRole}` }
        });
        setTestResult({
          status: 200,
          action,
          allowed: true,
          message: 'Permitted',
        });
      } else if (action === 'VerifiedFieldTest') {
        await api.post('/field-tests', {
          event_id: effectiveEventId,
          source_id: effectiveSourceId,
          test_type: 'lab',
          result_category: 'normal',
          verification_status: 'verified',
          notes: 'Cedar verification boundary demo test',
        }, {
          headers: { 'X-Demo-Role': currentRole, 'X-Demo-User': `demo-${currentRole}` }
        });
        setTestResult({
          status: 200,
          action,
          allowed: true,
          message: `200 PERMITTED: Official verified test recorded. Role '${currentRole}' holds required statutory admin authority.`,
        });
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        const detailMsg = err.response?.data?.detail?.message || 'Request denied by Cedar authorization policy.';
        setTestResult({
          status: 403,
          action,
          allowed: false,
          detail: err.response.data.detail,
          message: `403 FORBIDDEN: Blocked by Cedar Policy Engine (${action})`,
          explanation: detailMsg,
        });
      } else {
        setTestResult({
          status: err.response?.status || 500,
          action,
          allowed: false,
          message: `Error ${err.response?.status || 500}: ${err.response?.data?.detail?.message || err.message}`,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Title */}
      <div className="page-hero-block">
        <div className="mono-eyebrow">
          <span className="dot" />
          <span>AWS OPEN-SOURCE SECURITY ARCHITECTURE</span>
        </div>
        <h1 className="page-title">Cedar Policy Authorization Studio</h1>
        <p className="page-description">
          Declarative policy enforcement with strict default-deny semantics. Non-negotiable safety rules ensure automated systems can never issue public advisories.
        </p>
      </div>

      {/* Role Switcher & Live Evaluator */}
      <div className="panel-paper" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="mono-eyebrow">
              <span className="dot" />
              <span>ACTIVE DEMO IDENTITY</span>
            </div>
            <h3 style={{ fontSize: 20, fontWeight: 500, color: 'var(--ink)' }}>
              Testing as: <span style={{ color: 'var(--brand-text)', textTransform: 'capitalize' }}>{currentRole.replace('_', ' ')}</span>
            </h3>
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(['viewer', 'operator', 'field_recorder', 'admin'] as UserRole[]).map((r) => (
              <button
                key={r}
                className={currentRole === r ? 'btn btn-primary btn-compact' : 'btn btn-secondary btn-compact'}
                onClick={() => onRoleChange(r)}
                style={{ textTransform: 'uppercase', fontFamily: 'var(--mono)', fontSize: 12, letterSpacing: '0.06em' }}
              >
                {r.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Live Action Tests */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
          <div style={{ background: 'var(--tint)', padding: 18, border: '1px solid var(--line-card)', borderRadius: 'var(--radius-container)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink)', marginBottom: 4 }}>Action: CreatePlan</div>
            <div style={{ fontSize: 13, color: 'var(--ink-body)', marginBottom: 14 }}>
              Operator / Admin only. Viewers are blocked.
            </div>
            <button
              className="btn btn-secondary btn-compact"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => testAction('CreatePlan')}
              disabled={loading}
            >
              <Play size={13} />
              <span>TEST CREATEPLAN</span>
            </button>
          </div>

          <div style={{ background: 'var(--tint)', padding: 18, border: '1px solid var(--line-card)', borderRadius: 'var(--radius-container)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink)', marginBottom: 4 }}>Action: Record Verified Test</div>
            <div style={{ fontSize: 13, color: 'var(--ink-body)', marginBottom: 14 }}>
              Admin only. Forbids field recorders and operators.
            </div>
            <button
              className="btn btn-secondary btn-compact"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => testAction('VerifiedFieldTest')}
              disabled={loading}
            >
              <Play size={13} />
              <span>TEST VERIFIED ENTRY</span>
            </button>
          </div>

          <div style={{ background: 'var(--tint)', padding: 18, border: '1px solid var(--line-card)', borderRadius: 'var(--radius-container)' }}>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink)', marginBottom: 4 }}>Action: IssueAdvisory</div>
            <div style={{ fontSize: 13, color: 'var(--ink-body)', marginBottom: 14 }}>
              Strictly FORBIDDEN across all roles (even Admin).
            </div>
            <button
              className="btn btn-primary btn-compact"
              style={{ width: '100%', justifyContent: 'center', background: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => testAction('IssueAdvisory')}
              disabled={loading}
            >
              <Lock size={13} />
              <span>TEST SAFETY FORBID</span>
            </button>
          </div>
        </div>

        {/* Test Result Callout */}
        {testResult && (
          <div
            style={{
              marginTop: 18,
              padding: 16,
              borderRadius: 'var(--radius-control)',
              background: testResult.allowed ? 'var(--brand-tint)' : 'rgba(168, 40, 31, 0.08)',
              border: `1px solid ${testResult.allowed ? 'var(--brand-ring-soft)' : 'var(--danger)'}`,
              color: testResult.allowed ? 'var(--brand-text)' : 'var(--danger)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: 14 }}>
              {testResult.allowed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              <span>{testResult.message}</span>
            </div>
            {testResult.detail && (
              <div style={{ fontSize: 12.5, marginTop: 6, opacity: 0.9, fontFamily: 'var(--mono)' }}>
                Policy Diagnostics: {testResult.detail.policy_diagnostics || 'Default-Deny Rule Evaluated'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Declarative Cedar Policy Code */}
      <div className="panel-paper">
        <div className="mono-eyebrow" style={{ marginBottom: 10 }}>
          <span className="dot" />
          <span>DECLARATIVE CEDAR POLICY SPECIFICATION (POLICIES/FLOODSAFE.CEDAR)</span>
        </div>
        <pre style={{
          background: 'var(--surface)',
          color: 'var(--ink)',
          border: '1px solid var(--line-card)',
          padding: 20,
          borderRadius: 'var(--radius-container)',
          fontSize: 13,
          lineHeight: 1.6,
          overflowX: 'auto',
          fontFamily: 'var(--mono)'
        }}>
{`// ==============================================================================
// FloodSafe AWS Cedar Policy Definitions (Default: DENY)
// ==============================================================================

@id("viewer-read")
permit (
  principal in FloodSafe::Role::"viewer",
  action in [FloodSafe::Action::"ViewQueue", FloodSafe::Action::"ViewSource", FloodSafe::Action::"ViewPlan"],
  resource
);

@id("operator-run")
permit (
  principal in FloodSafe::Role::"operator",
  action in [FloodSafe::Action::"ViewQueue", FloodSafe::Action::"CreatePlan", FloodSafe::Action::"RunAssessment"],
  resource
);

// Safety Boundary: Verified field entries require human health officer admin credentials
@id("verified-admin-only")
forbid (principal, action == FloodSafe::Action::"RecordFieldTest", resource)
when { context.verification_status == "verified" }
unless { principal in FloodSafe::Role::"admin" };

// Human Statutory Authority: The software engine is strictly forbidden from issuing public advisories
@id("no-automatic-advisory")
forbid (principal, action == FloodSafe::Action::"IssueAdvisory", resource);`}
        </pre>
      </div>
    </div>
  );
};
