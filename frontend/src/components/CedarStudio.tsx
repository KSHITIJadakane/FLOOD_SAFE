import React, { useState, useEffect } from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Lock, AlertTriangle, Play, RefreshCw, FileText } from 'lucide-react';
import { UserRole } from '../types';
import { api, fetchCedarDecisions } from '../services/api';

interface CedarStudioProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  eventId?: string;
  sourceId?: string;
}

export const CedarStudio: React.FC<CedarStudioProps> = ({ currentRole, onRoleChange, eventId, sourceId }) => {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const loadAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const logs = await fetchCedarDecisions(15);
      setAuditLogs(logs || []);
    } catch (e) {
      console.error('Failed to load Cedar audit logs', e);
    } finally {
      setAuditLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const getEffectiveEventAndSource = async () => {
    let effectiveEventId = eventId;
    let effectiveSourceId = sourceId;

    if (!effectiveEventId) {
      try {
        const eventsRes = await api.get('/flood-events');
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
          effectiveSourceId = sourcesRes.data[0].id || sourcesRes.data[0].source_id;
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
      loadAuditLogs();
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

      {/* Live DynamoDB Cedar Decision Audit Log */}
      <div className="panel-paper" style={{ marginTop: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <div className="mono-eyebrow" style={{ marginBottom: 4 }}>
              <span className="dot" />
              <span>LIVE AWS DYNAMODB AUDIT STREAM (TABLE: FLOODSAFE_CEDAR_DECISIONS)</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-body)' }}>
              Cryptographically timestamped record of every authorization check, role transition, and safety refusal.
            </div>
          </div>
          <button
            className="btn btn-secondary btn-compact"
            onClick={loadAuditLogs}
            disabled={auditLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={13} className={auditLoading ? 'animate-spin' : ''} />
            <span>{auditLoading ? 'Syncing...' : 'Sync Audit Stream'}</span>
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--ink-body)', background: 'var(--tint)', borderRadius: 'var(--radius-container)' }}>
            No authorization decisions recorded yet in this session. Trigger an action above to see live DynamoDB audit logging.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line-card)', textAlign: 'left', color: 'var(--ink-body)', fontFamily: 'var(--mono)' }}>
                  <th style={{ padding: '8px 12px' }}>DECISION</th>
                  <th style={{ padding: '8px 12px' }}>ACTION</th>
                  <th style={{ padding: '8px 12px' }}>PRINCIPAL</th>
                  <th style={{ padding: '8px 12px' }}>RESOURCE</th>
                  <th style={{ padding: '8px 12px' }}>DIAGNOSTICS</th>
                  <th style={{ padding: '8px 12px', textAlign: 'right' }}>TIMESTAMP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log: any, idx: number) => {
                  const isAllow = log.decision === 'ALLOW' || log.decision === 'Permitted';
                  return (
                    <tr
                      key={log.audit_id || idx}
                      style={{
                        borderBottom: '1px solid var(--line-subtle, rgba(255,255,255,0.06))',
                        background: idx % 2 === 0 ? 'transparent' : 'var(--tint)',
                      }}
                    >
                      <td style={{ padding: '10px 12px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontSize: 11,
                            fontWeight: 700,
                            fontFamily: 'var(--mono)',
                            letterSpacing: '0.04em',
                            background: isAllow ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: isAllow ? '#22c55e' : '#ef4444',
                            border: `1px solid ${isAllow ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                          }}
                        >
                          {isAllow ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          {log.decision || 'UNKNOWN'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', fontFamily: 'var(--mono)', fontWeight: 600 }}>
                        {log.action}
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ink-body)' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{log.principal}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ink-body)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        <span style={{ fontFamily: 'var(--mono)', fontSize: 11 }}>{log.resource}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: 'var(--ink-body)', fontSize: 11.5 }}>
                        {log.diagnostics || (isAllow ? 'Permitted by role policy' : 'Safety boundary refusal')}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: 'var(--ink-body)', fontFamily: 'var(--mono)', fontSize: 11 }}>
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
