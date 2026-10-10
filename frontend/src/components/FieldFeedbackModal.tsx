import React, { useState } from 'react';
import { X, FlaskConical, CheckCircle2 } from 'lucide-react';
import { recordFieldTest } from '../services/api';

interface FieldFeedbackModalProps {
  sourceId: string | null;
  sourceCode: string | null;
  eventId: string;
  onClose: () => void;
  onTestRecorded: () => void;
}

export const FieldFeedbackModal: React.FC<FieldFeedbackModalProps> = ({
  sourceId,
  sourceCode,
  eventId,
  onClose,
  onTestRecorded,
}) => {
  const [resultCategory, setResultCategory] = useState<'abnormal' | 'normal'>('abnormal');
  const [notes, setNotes] = useState('Demo rapid field test');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!sourceId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await recordFieldTest({
        event_id: eventId,
        source_id: sourceId,
        test_type: 'rapid',
        result_category: resultCategory,
        verification_status: 'simulated',
        notes,
      });
      setSuccessMsg(`Simulated ${resultCategory.toUpperCase()} result recorded! Applied +0.10 neighbor uplift within 300m.`);
      setTimeout(() => {
        onTestRecorded();
        onClose();
      }, 1400);
    } catch (err: any) {
      alert(`Error submitting field test: ${err?.response?.data?.detail?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-backdrop" onClick={onClose}>
      <div className="modal-dialog-panel animate-fade-in" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 540 }}>
        <button className="modal-close-btn" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        {/* Eyebrow */}
        <div className="mono-eyebrow">
          <span className="dot" />
          <span>FIELD FEEDBACK &amp; SPATIAL PROPAGATION</span>
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: '6px 0 16px 0', fontFamily: 'var(--sans)' }}>
          Simulate Field Test for <span style={{ fontFamily: 'var(--mono)', color: 'var(--brand-text)' }}>{sourceCode}</span>
        </h2>

        {successMsg ? (
          <div style={{ background: 'var(--tint)', border: '1px solid var(--success)', borderRadius: 'var(--radius-container)', padding: 20, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={24} />
            <span style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--mono)' }}>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* Rule Notice */}
            <div style={{ background: 'var(--tint)', padding: 14, borderRadius: 'var(--radius-sm)', marginBottom: 18, border: '1px solid var(--line-card)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, fontSize: 12, fontWeight: 700, color: 'var(--brand-text)', fontFamily: 'var(--mono)' }}>
                <span style={{ background: 'var(--warning)', color: '#000', padding: '1px 6px', borderRadius: 2, fontSize: 10 }}>SIMULATED</span>
                <span>Hydrological Feedback Rule</span>
              </div>
              <p style={{ fontSize: 12.5, color: 'var(--ink-body)', lineHeight: 1.5, margin: 0 }}>
                Simulating an <strong>Abnormal</strong> rapid test applies a bounded <strong>+0.10 uplift</strong> on neighboring sources within 300m without declaring them contaminated.
              </p>
            </div>

            {/* Selection Buttons */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-label)', marginBottom: 8, fontFamily: 'var(--mono)' }}>
                Test Result Category:
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => setResultCategory('abnormal')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: 12.5,
                    fontFamily: 'var(--mono)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: resultCategory === 'abnormal' ? '2px solid var(--danger)' : '1px solid var(--line-card)',
                    background: resultCategory === 'abnormal' ? 'rgba(220, 38, 38, 0.15)' : 'var(--surface)',
                    color: resultCategory === 'abnormal' ? 'var(--danger)' : 'var(--ink-body)',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  ⚠️ Abnormal Result (+0.10 Uplift)
                </button>
                <button
                  type="button"
                  onClick={() => setResultCategory('normal')}
                  style={{
                    flex: 1,
                    padding: '10px 12px',
                    fontSize: 12.5,
                    fontFamily: 'var(--mono)',
                    fontWeight: 600,
                    borderRadius: 'var(--radius-sm)',
                    border: resultCategory === 'normal' ? '2px solid var(--success)' : '1px solid var(--line-card)',
                    background: resultCategory === 'normal' ? 'rgba(34, 197, 94, 0.15)' : 'var(--surface)',
                    color: resultCategory === 'normal' ? 'var(--success)' : 'var(--ink-body)',
                    cursor: 'pointer',
                    transition: 'all 120ms ease',
                  }}
                >
                  ✅ Normal Result (No Uplift)
                </button>
              </div>
            </div>

            {/* Notes Input */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--ink-label)', marginBottom: 6, fontFamily: 'var(--mono)' }}>
                Field Observation Notes:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface)',
                  border: '1px solid var(--line-input)',
                  color: 'var(--ink)',
                  padding: '9px 12px',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FlaskConical size={14} />
                <span>{submitting ? 'Recording...' : 'Record Simulated Result & Re-score'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
