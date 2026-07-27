import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Eye, Edit2, Trash2, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { patientsApi } from '../api/patients';
import type { PatientFilters } from '../types/api';
import { useToast } from '../components/Toast';

const getRiskColor = (risk?: string) => {
  if (!risk) return '';
  return `badge badge-${risk}`;
};

const Patients: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { success, error: showError } = useToast();
  const [filters, setFilters] = useState<PatientFilters>({ page: 1, page_size: 20, sort_by: 'created_at', sort_order: 'desc' });
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['patients', filters],
    queryFn: () => patientsApi.list(filters),
    staleTime: 30000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => patientsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patients'] });
      success('Patient deleted successfully');
      setDeleteId(null);
    },
    onError: () => showError('Failed to delete patient'),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search, page: 1 }));
  };

  const totalPages = data ? Math.ceil(data.total / (filters.page_size ?? 20)) : 0;
  const currentPage = filters.page ?? 1;

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="breadcrumb"><span>Dashboard</span><span className="breadcrumb-sep">/</span><span className="breadcrumb-current">Patients</span></div>
          <h1 className="page-title">Patient Management</h1>
          <p className="page-subtitle">{data?.total ?? 0} patients registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/patients/new')}>
          <Plus size={16} /> Add Patient
        </button>
      </div>

      {/* Filters */}
      <div className="card mb-4">
        <div className="card-body" style={{ paddingTop: 16, paddingBottom: 16 }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: '1 1 220px' }}>
              <label className="form-label">Search</label>
              <div style={{ position: 'relative' }}>
                <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input className="form-input" style={{ paddingLeft: 32 }} placeholder="Patient name or doctor..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Gender</label>
              <select className="form-input form-select" value={filters.gender ?? ''} onChange={(e) => setFilters((f) => ({ ...f, gender: e.target.value || undefined, page: 1 }))}>
                <option value="">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group" style={{ width: 100 }}>
              <label className="form-label">Min Age</label>
              <input className="form-input" type="number" min={0} max={130} placeholder="0" value={filters.min_age ?? ''} onChange={(e) => setFilters((f) => ({ ...f, min_age: e.target.value ? +e.target.value : undefined, page: 1 }))} />
            </div>
            <div className="form-group" style={{ width: 100 }}>
              <label className="form-label">Max Age</label>
              <input className="form-input" type="number" min={0} max={130} placeholder="130" value={filters.max_age ?? ''} onChange={(e) => setFilters((f) => ({ ...f, max_age: e.target.value ? +e.target.value : undefined, page: 1 }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Sort</label>
              <select className="form-input form-select" value={`${filters.sort_by}_${filters.sort_order}`} onChange={(e) => { const [by, ord] = e.target.value.split('_'); setFilters((f) => ({ ...f, sort_by: by, sort_order: ord as 'asc' | 'desc', page: 1 })); }}>
                <option value="created_at_desc">Newest First</option>
                <option value="created_at_asc">Oldest First</option>
                <option value="patient_name_asc">Name A-Z</option>
                <option value="age_asc">Age Asc</option>
                <option value="age_desc">Age Desc</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit"><Filter size={14} /> Search</button>
            <button className="btn btn-ghost" type="button" onClick={() => { setSearch(''); setFilters({ page: 1, page_size: 20, sort_by: 'created_at', sort_order: 'desc' }); }}>Reset</button>
          </form>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Patient</th>
              <th>Age / Gender</th>
              <th>Admission Type</th>
              <th>Attending Doctor</th>
              <th>Registered</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}><div className="skeleton skeleton-text" style={{ width: j === 0 ? 140 : 80 }} /></td>
                  ))}
                </tr>
              ))
            ) : !data?.items.length ? (
              <tr><td colSpan={6}>
                <div className="empty-state">
                  <div className="empty-icon"><Search size={40} /></div>
                  <div className="empty-title">No patients found</div>
                  <div className="empty-desc">Try adjusting your search filters or add a new patient.</div>
                  <button className="btn btn-primary mt-4" onClick={() => navigate('/patients/new')}><Plus size={15} /> Add Patient</button>
                </div>
              </td></tr>
            ) : (
              data.items.map((p) => (
                <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/patients/${p.id}`)}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ width: 36, height: 36, fontSize: 14, borderRadius: 10 }}>
                        {p.patient_name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{p.patient_name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.race ?? 'Unknown race'}</div>
                      </div>
                    </div>
                  </td>
                  <td>{p.age}y &middot; <span style={{ textTransform: 'capitalize' }}>{p.gender}</span></td>
                  <td>{p.admission_type ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{p.attending_doctor ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{new Date(p.created_at).toLocaleDateString()}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/patients/${p.id}`)}><Eye size={14} /></button>
                      <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/prediction?patient_id=${p.id}`)} title="Run Prediction">AI</button>
                      <button className="btn btn-danger btn-sm" onClick={() => setDeleteId(p.id)}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Showing {((currentPage - 1) * (filters.page_size ?? 20)) + 1}–{Math.min(currentPage * (filters.page_size ?? 20), data?.total ?? 0)} of {data?.total} patients
          </span>
          <div className="pagination">
            <button className="page-btn" disabled={currentPage <= 1} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}><ChevronLeft size={14} /></button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + Math.max(1, currentPage - 2)).filter(p => p <= totalPages).map((p) => (
              <button key={p} className={`page-btn ${p === currentPage ? 'active' : ''}`} onClick={() => setFilters((f) => ({ ...f, page: p }))}>{p}</button>
            ))}
            <button className="page-btn" disabled={currentPage >= totalPages} onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteId && (
        <div className="modal-backdrop" onClick={() => setDeleteId(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Delete Patient</h3>
              <button className="icon-btn" style={{ border: 'none' }} onClick={() => setDeleteId(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>This action is permanent. All predictions and records for this patient will also be deleted.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => deleteMutation.mutate(deleteId)} disabled={deleteMutation.isPending}>
                {deleteMutation.isPending ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} /> Deleting...</> : 'Delete Patient'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
