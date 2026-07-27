import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Download, Trash2, FileText, FileSpreadsheet, File } from 'lucide-react';
import { reportsApi } from '../api/reports';
import type { ReportType } from '../types/api';
import { useToast } from '../components/Toast';

const REPORT_ICONS: Record<string, React.ReactNode> = {
  pdf: <FileText size={18} color="#EF4444" />,
  csv: <FileSpreadsheet size={18} color="#10B981" />,
  excel: <FileSpreadsheet size={18} color="#059669" />,
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const cls = status === 'completed' ? 'badge-success' : status === 'failed' ? 'badge-danger' : 'badge-warning';
  return <span className={`badge ${cls}`}>{status}</span>;
};

const Reports: React.FC = () => {
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState<{ report_type: ReportType; title: string; date_from: string; date_to: string }>({
    report_type: 'pdf', title: '', date_from: '', date_to: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => reportsApi.list(),
    staleTime: 30000,
  });

  const generateMutation = useMutation({
    mutationFn: () => reportsApi.generate({ report_type: form.report_type, title: form.title || undefined, date_from: form.date_from || undefined, date_to: form.date_to || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      success('Report generated successfully!');
      setShowModal(false);
      setForm({ report_type: 'pdf', title: '', date_from: '', date_to: '' });
    },
    onError: (e: any) => showError(e?.response?.data?.message ?? 'Failed to generate report'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reportsApi.delete(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['reports'] }); success('Report deleted'); setDeleteId(null); },
    onError: () => showError('Failed to delete report'),
  });

  const REPORT_TYPES: { type: ReportType; label: string; desc: string; icon: React.ReactNode }[] = [
    { type: 'pdf', label: 'PDF Report', desc: 'Formatted clinical report', icon: <FileText size={24} color="#EF4444" /> },
    { type: 'csv', label: 'CSV Export', desc: 'Raw data for analysis', icon: <FileSpreadsheet size={24} color="#10B981" /> },
    { type: 'excel', label: 'Excel Report', desc: 'Spreadsheet with charts', icon: <FileSpreadsheet size={24} color="#059669" /> },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports</h1>
          <p className="page-subtitle">{data?.total ?? 0} reports generated</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Generate Report
        </button>
      </div>

      {/* Reports Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr><th>Report</th><th>Type</th><th>Status</th><th>Created</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>{Array.from({ length: 5 }).map((__, j) => <td key={j}><div className="skeleton skeleton-text" /></td>)}</tr>
              ))
            ) : !data?.items.length ? (
              <tr><td colSpan={5}>
                <div className="empty-state">
                  <div className="empty-icon"><FileText size={40} /></div>
                  <div className="empty-title">No reports yet</div>
                  <div className="empty-desc">Generate your first patient or prediction report.</div>
                  <button className="btn btn-primary mt-4" onClick={() => setShowModal(true)}><Plus size={15} /> Generate Report</button>
                </div>
              </td></tr>
            ) : (
              data.items.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {REPORT_ICONS[r.report_type] ?? <File size={18} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{r.title ?? 'Untitled Report'}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>{r.id.slice(0, 8)}...</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="badge badge-primary">{r.report_type.toUpperCase()}</span></td>
                  <td><StatusBadge status={r.status} /></td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(r.created_at).toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {r.download_url && (
                        <button className="btn btn-ghost btn-sm" onClick={() => window.open(r.download_url!, '_blank')} title="Download">
                          <Download size={14} />
                        </button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(r.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Generate New Report</h3>
              <button className="icon-btn" style={{ border: 'none' }} onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Type Selector */}
              <div>
                <label className="form-label" style={{ display: 'block', marginBottom: 10 }}>Report Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {REPORT_TYPES.map(({ type, label, desc, icon }) => (
                    <div key={type} onClick={() => setForm((f) => ({ ...f, report_type: type }))}
                      style={{ padding: '14px', border: `2px solid ${form.report_type === type ? 'var(--color-primary)' : 'var(--border-color)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', textAlign: 'center', background: form.report_type === type ? 'var(--bg-active)' : 'var(--bg-card)', transition: 'all var(--transition)' }}>
                      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>{icon}</div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{label}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Report Title (optional)</label>
                <input className="form-input" placeholder="e.g., Monthly Risk Analysis Q1" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Date From</label>
                  <input className="form-input" type="date" value={form.date_from} onChange={(e) => setForm((f) => ({ ...f, date_from: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date To</label>
                  <input className="form-input" type="date" value={form.date_to} onChange={(e) => setForm((f) => ({ ...f, date_to: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={() => generateMutation.mutate()} disabled={generateMutation.isPending}>
                {generateMutation.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Generating...</> : 'Generate Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header"><h3 className="modal-title">Delete Report</h3><button className="icon-btn" style={{ border: 'none' }} onClick={() => setDeleteId(null)}>✕</button></div>
            <div className="modal-body"><p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to permanently delete this report?</p></div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteMutation.mutate(deleteId!)} disabled={deleteMutation.isPending}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
