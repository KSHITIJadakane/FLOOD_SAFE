import React, { useState } from 'react';
import {
  Search,
  FileText,
  Download,
  FlaskConical,
  ArrowRight,
  Printer,
} from 'lucide-react';
import { QueueItem, ScoredSource, TestingPlan } from '../types';
import { generatePDFReport } from '../services/pdfReport';

interface TestingQueueProps {
  queue: QueueItem[];
  plan?: TestingPlan | null;
  sources?: ScoredSource[];
  onSelectSource: (source: ScoredSource) => void;
  onOpenFeedback: (sourceId: string, sourceCode: string) => void;
}

export const TestingQueue: React.FC<TestingQueueProps> = ({
  queue,
  plan = null,
  sources = [],
  onSelectSource,
  onOpenFeedback,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBand, setFilterBand] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSelectedOnly, setFilterSelectedOnly] = useState<boolean>(false);

  const filteredQueue = queue.filter((item) => {
    if (searchTerm) {
      const matchCode = item.source_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchWard = item.ward_id?.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchCode && !matchWard) return false;
    }
    if (filterBand !== 'all' && item.band !== filterBand) return false;
    if (filterType !== 'all' && item.source_type !== filterType) return false;
    if (filterSelectedOnly && !item.is_selected_by_optimizer) return false;
    return true;
  });

  const handleExportPDF = () => {
    generatePDFReport(plan, filteredQueue, sources);
  };

  const exportCSV = () => {
    const headers = [
      'Rank',
      'Selection_Order',
      'Source_Code',
      'Source_Type',
      'Ward',
      'Relative_Vulnerability_Score',
      'Band',
      'Population_Served',
      'Quality_Score',
      'Is_Selected_By_Optimizer',
      'Is_Synthetic',
    ];
    const rows = filteredQueue.map((item) => [
      item.rank,
      item.selection_order || '',
      item.source_code,
      item.source_type,
      item.ward_id || '',
      item.relative_vulnerability_score.toFixed(4),
      item.band,
      item.population_served,
      item.quality_score,
      item.is_selected_by_optimizer,
      true,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `floodsafe_plan_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="panel-paper animate-fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <div className="mono-eyebrow">
            <span className="dot" />
            <span>ALLOCATION ROSTER</span>
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 600, color: 'var(--ink)' }}>Testing Queue ({filteredQueue.length} Sources)</h3>
        </div>

        {/* PDF & Export Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-primary btn-compact"
            onClick={handleExportPDF}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontWeight: 700 }}
            title="Generate and Download Detailed Emergency Field Testing Directive PDF"
          >
            <Printer size={14} />
            <span>Export Detailed PDF Dossier</span>
          </button>
          <button
            className="btn btn-secondary btn-compact"
            onClick={exportCSV}
            title="Download CSV SpreadSheet"
          >
            <Download size={13} />
            <span>CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: 220 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: 11, color: 'var(--ink-label)' }} />
          <input
            type="text"
            placeholder="Search source code or ward..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '8px 12px 8px 36px',
              fontSize: 14,
            }}
          />
        </div>

        <select
          value={filterBand}
          onChange={(e) => setFilterBand(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: 13,
            fontFamily: 'var(--mono)',
            textTransform: 'uppercase',
          }}
        >
          <option value="all">ALL PRIORITY BANDS</option>
          <option value="very_high">VERY HIGH BAND</option>
          <option value="high">HIGH BAND</option>
          <option value="moderate">MODERATE BAND</option>
          <option value="low">LOW BAND</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{
            padding: '8px 12px',
            fontSize: 13,
            fontFamily: 'var(--mono)',
            textTransform: 'uppercase',
          }}
        >
          <option value="all">ALL SOURCE TYPES</option>
          <option value="well">WELLS</option>
          <option value="public_tap">PUBLIC TAPS</option>
          <option value="storage_point">STORAGE POINTS</option>
        </select>

        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, cursor: 'pointer', color: 'var(--ink-label)', fontFamily: 'var(--mono)', textTransform: 'uppercase', fontWeight: 500 }}>
          <input
            type="checkbox"
            checked={filterSelectedOnly}
            onChange={(e) => setFilterSelectedOnly(e.target.checked)}
          />
          <span>OPTIMIZER SELECTED (K)</span>
        </label>
      </div>

      {/* Table */}
      <div className="table-scroll-frame" style={{ maxHeight: 540 }}>
        <table className="table-paper">
          <thead>
            <tr>
              <th>RANK</th>
              <th>SOURCE CODE</th>
              <th>TYPE</th>
              <th>WARD</th>
              <th>SCORE</th>
              <th>BAND</th>
              <th>SERVED POP</th>
              <th>QUALITY</th>
              <th>OPTIMIZER PICK</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {filteredQueue.map((item) => (
              <tr key={item.source_id}>
                <td style={{ color: 'var(--ink-label)', fontFamily: 'var(--mono)' }}>
                  #{item.rank}
                </td>
                <td>
                  <span style={{ fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--mono)' }}>
                    {item.source_code}
                  </span>
                </td>
                <td style={{ textTransform: 'capitalize', color: 'var(--ink-body)' }}>
                  {item.source_type.replace('_', ' ')}
                </td>
                <td style={{ color: 'var(--ink-body)' }}>{item.ward_id || '—'}</td>
                <td>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--mono)', color: 'var(--ink)', fontSize: 14 }}>
                    {item.relative_vulnerability_score.toFixed(2)}
                  </span>
                </td>
                <td>
                  <span className={`band-pill ${item.band}`}>
                    {item.band.replace('_', ' ')}
                  </span>
                </td>
                <td style={{ fontFamily: 'var(--mono)', color: 'var(--ink-body)' }}>
                  {item.population_served.toLocaleString()}
                </td>
                <td>
                  <span style={{ fontSize: 12, fontWeight: 600, fontFamily: 'var(--mono)', color: item.quality_score === 1 ? 'var(--success)' : 'var(--warning)' }}>
                    {(item.quality_score * 100).toFixed(0)}%
                  </span>
                </td>
                <td>
                  {item.is_selected_by_optimizer ? (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      background: 'var(--brand-tint)',
                      border: '1px solid var(--brand-ring-soft)',
                      color: 'var(--brand-text)',
                      borderRadius: 'var(--radius-control)',
                      padding: '2px 6px',
                      fontSize: 11,
                      fontWeight: 600,
                      fontFamily: 'var(--mono)',
                    }}>
                      ★ PICK #{item.selection_order}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--ink-muted)', fontSize: 12, fontFamily: 'var(--mono)' }}>—</span>
                  )}
                </td>
                <td>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <button
                      className="btn btn-secondary btn-compact"
                      style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                      title="Inspect Explainability WHY? Breakdown"
                      onClick={() => {
                        onSelectSource({
                          source_id: item.source_id,
                          source_code: item.source_code,
                          source_type: item.source_type,
                          latitude: item.latitude,
                          longitude: item.longitude,
                          ward_id: item.ward_id,
                          population_served: item.population_served,
                          relative_vulnerability_score: item.relative_vulnerability_score,
                          band: item.band,
                          feature_values: {},
                          feature_contributions: {},
                          missing_features: item.missing_features,
                          data_quality: item.data_quality,
                          quality_score: item.quality_score,
                          explanation: '',
                          disclaimer: 'Prioritization signal for field verification, not a contamination diagnosis.',
                          config_version: 'risk-v1',
                          data_version: 'synthetic-v1',
                          is_synthetic: true,
                        });
                      }}
                    >
                      <span>WHY?</span>
                      <ArrowRight size={12} />
                    </button>

                    <button
                      className="btn btn-primary btn-compact"
                      style={{ height: 28, padding: '0 8px', fontSize: 12 }}
                      title="Simulate rapid test result"
                      onClick={() => onOpenFeedback(item.source_id, item.source_code)}
                    >
                      <FlaskConical size={12} />
                      <span>Simulate</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
