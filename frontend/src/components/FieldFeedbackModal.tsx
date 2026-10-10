import React, { useState } from 'react';
import { X, FlaskConical, CheckCircle2, ArrowRight } from 'lucide-react';
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
      setSuccessMsg(`Simulated ${resultCategory} result recorded! Applied +0.10 neighbor uplift within 300m.`);
      setTimeout(() => {
        onTestRecorded();
        onClose();
      }, 1500);
    } catch (err: any) {
      alert(`Error submitting field test: ${err?.response?.data?.detail?.message || err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay-editorial" onClick={onClose}>
      <div className="modal-stadium-dialog animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn-circle" onClick={onClose} title="Close">
          <X size={18} />
        </button>

        <div className="eyebrow-tag">
          <span className="eyebrow-bullet" />
          <span>Feedback Loop & Neighbor Uplift</span>
        </div>

        <h2 style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink-primary)', margin: '6px 0 16px 0' }}>
          Simulate Field Test for <span style={{ fontFamily: 'JetBrains Mono', color: 'var(--signal-rust)' }}>{sourceCode}</span>
        </h2>

        {successMsg ? (
          <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid var(--band-low)', borderRadius: 20, padding: 24, color: 'var(--band-low)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <CheckCircle2 size={24} />
            <span style={{ fontSize: 15, fontWeight: 600 }}>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ background: 'var(--surface-nested)', padding: 18, borderRadius: 20, marginBottom: 20, border: '1px solid var(--border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 13, fontWeight: 700, color: 'var(--signal-rust)' }}>
                <span className="synthetic-pill-badge" style={{ margin: 0 }}>SIMULATED</span>
                <span>Hydrological Feedback Rule</span>
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                Simulating an <strong>Abnormal</strong> rapid test applies a bounded <strong>+0.10 uplift</strong> on neighboring sources within 300m without declaring them contaminated.
              </p>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-muted)', marginBottom: 8 }}>
                Test Result Category:
              </label>
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  className={resultCategory === 'abnormal' ? 'btn-rust-pill' : 'btn-white-pill'}
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
                  onClick={() => setResultCategory('abnormal')}
                >
                  Abnormal Result (+0.10 Neighbor Uplift)
                </button>
                <button
                  type="button"
                  className={resultCategory === 'normal' ? 'btn-ink-pill' : 'btn-white-pill'}
                  style={{ flex: 1, justifyContent: 'center', padding: '10px 16px' }}
                  onClick={() => setResultCategory('normal')}
                >
                  Normal Result (No Uplift)
                </button>
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-muted)', marginBottom: 8 }}>
                Field Observation Notes:
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  background: 'var(--surface-nested)',
                  border: '1px solid var(--border-medium)',
                  color: 'var(--ink-primary)',
                  padding: '10px 16px',
                  borderRadius: 'var(--r-pill)',
                  fontSize: 14,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
              <button type="button" className="btn-white-pill" onClick={onClose} disabled={submitting}>
                Cancel
              </button>
              <button type="submit" className="btn-rust-pill" disabled={submitting}>
                <FlaskConical size={15} />
                <span>{submitting ? 'Submitting...' : 'Record Simulated Result & Re-score'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
