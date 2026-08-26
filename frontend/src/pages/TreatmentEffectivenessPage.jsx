import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  Activity,
  Stethoscope,
  BarChart2,
} from 'lucide-react';
import {
  BarChart,
  DonutChart,
  Badge,
  Button,
  EmptyState,
  LoadingSkeleton,
  StatCard,
} from '../components';
import { getTreatmentOverview, updateTreatmentRecord } from '../api/treatments';
import TreatmentFormModal from '../components/TreatmentFormModal';
import { useToast } from '../components/Toast';
import { triggerNotificationRefresh } from '../utils/notifications';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns a tone string for Badge based on effectiveness_level value.
 */
function levelTone(level) {
  switch (level?.toLowerCase()) {
    case 'excellent': return 'success';
    case 'good':      return 'info';
    case 'fair':      return 'warning';
    case 'poor':      return 'danger';
    default:          return 'secondary';
  }
}

/**
 * Returns a tone string for Badge based on treatment status.
 */
function statusTone(status) {
  switch (status?.toLowerCase()) {
    case 'active':    return 'info';
    case 'completed': return 'success';
    default:          return 'secondary';
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function TreatmentEffectivenessPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [overview, setOverview]     = useState(null);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [isTreatmentOpen, setIsTreatmentOpen]           = useState(false);
  const [activeTreatmentToEdit, setActiveTreatmentToEdit] = useState(null);

  // ── Data fetching ────────────────────────────────────────────────────────────
  useEffect(() => {
    let isActive = true;

    async function load() {
      setIsLoading(true);
      setError('');
      try {
        const data = await getTreatmentOverview();
        if (isActive) setOverview(data);
      } catch (err) {
        if (isActive) {
          setError(err?.message || 'Unable to load treatment effectiveness data.');
          setOverview(null);
        }
      } finally {
        if (isActive) setIsLoading(false);
      }
    }

    load();
    return () => { isActive = false; };
  }, [refreshTrigger]);

  // ── Treatment update handler ─────────────────────────────────────────────────
  const handleTreatmentSubmit = async (payload) => {
    if (!activeTreatmentToEdit?.id) return;
    try {
      await updateTreatmentRecord(activeTreatmentToEdit.id, payload);
      showToast({ message: 'Treatment updated successfully.', variant: 'success' });
      triggerNotificationRefresh();
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      showToast({ message: err.message || 'Failed to update treatment.', variant: 'error' });
      throw err;
    }
  };

  // ── Loading skeleton ─────────────────────────────────────────────────────────
  if (isLoading && !overview) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <LoadingSkeleton type="stat" count={3} />
        <LoadingSkeleton type="card" count={2} />
        <LoadingSkeleton type="table" count={1} />
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error && !overview) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyState
          title="Treatment data unavailable"
          description={error}
          className="max-w-2xl mx-auto"
        />
      </div>
    );
  }

  // ── Destructure overview ─────────────────────────────────────────────────────
  const stats              = overview?.stats             || {};
  const outcomeDistribution = overview?.outcome_distribution || [];
  const avgScoreByType      = overview?.avg_score_by_type    || [];
  const records             = overview?.records              || [];
  const activeTreatments    = records.filter(r => r.status === 'active');
  const hasRecords          = records.length > 0;

  // ── Empty state (no records at all) ─────────────────────────────────────────
  if (!hasRecords) {
    return (
      <div className="space-y-6">
        <PageHeader />
        <EmptyState
          title="No treatment records yet"
          description="Add a patient and log a treatment outcome to populate this report."
          className="max-w-2xl mx-auto"
        />
        <div className="flex justify-center">
          <Button onClick={() => navigate('/patients')} variant="primary" className="font-bold">
            Go to Patients
          </Button>
        </div>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <PageHeader />

      {/* ── KPI Cards ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">

        {/* KPI 1 — Treatment Success Rate */}
        <StatCard
          icon={CheckCircle2}
          title="Treatment Success Rate"
          value={
            stats.treatment_success_rate !== null && stats.treatment_success_rate !== undefined
              ? `${Number(stats.treatment_success_rate).toFixed(1)}%`
              : '—'
          }
          subtitle={
            stats.completed_count > 0
              ? `${stats.completed_count} completed treatment${stats.completed_count !== 1 ? 's' : ''} evaluated`
              : 'No completed treatments yet'
          }
          tone="success"
        />

        {/* KPI 2 — Average Treatment Duration */}
        <StatCard
          icon={Clock}
          title="Average Treatment Duration"
          value={
            stats.avg_duration_days !== null && stats.avg_duration_days !== undefined
              ? `${Number(stats.avg_duration_days).toFixed(1)} days`
              : '—'
          }
          subtitle="Avg days from start to completion (recorded outcomes only)"
          tone="info"
        />

        {/* KPI 3 — Active Treatments */}
        <StatCard
          icon={Activity}
          title="Active Treatments"
          value={stats.active_count ?? 0}
          subtitle={
            stats.total_count > 0
              ? `${stats.total_count} total treatment record${stats.total_count !== 1 ? 's' : ''}`
              : 'No treatment records'
          }
          tone="secondary"
        />

      </div>

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">

        {/* Chart 1 — Outcome Distribution */}
        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-secondary-brand-bg flex items-center justify-center flex-shrink-0">
                <BarChart2 className="w-4 h-4 text-secondary-brand" />
              </div>
              <h3 className="text-[15px] font-semibold text-txt-primary">
                Treatment Outcome Distribution
              </h3>
            </div>
            <p className="text-[12px] text-txt-muted mt-1 ml-9">
              Count of treatment records by recorded effectiveness level
            </p>
          </div>

          <div className="h-60">
            {outcomeDistribution.length > 0 ? (
              <DonutChart data={outcomeDistribution} />
            ) : (
              <EmptyState
                title="No outcome data yet"
                description="Effectiveness levels will appear once completed treatments are recorded."
                className="max-w-none h-full"
              />
            )}
          </div>

          {/* Legend summary */}
          {outcomeDistribution.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1 border-t border-borderColor/60">
              {outcomeDistribution.map(item => (
                <div key={item.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-[11px] font-semibold text-txt-muted uppercase tracking-wide">
                    {item.name}
                  </span>
                  <span className="text-[11px] font-bold text-txt-primary">{item.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 2 — Avg Outcome Score by Treatment Type */}
        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-info-bg flex items-center justify-center flex-shrink-0">
                <Stethoscope className="w-4 h-4 text-info" />
              </div>
              <h3 className="text-[15px] font-semibold text-txt-primary">
                Avg Outcome Score by Treatment Type
              </h3>
            </div>
            <p className="text-[12px] text-txt-muted mt-1 ml-9">
              Average recorded outcome score (0–100) grouped by treatment type
            </p>
          </div>

          <div className="h-60">
            {avgScoreByType.length > 0 ? (
              <BarChart
                data={avgScoreByType}
                dataKey="avg_score"
                xAxisKey="name"
                color="#7A5AF8"
              />
            ) : (
              <EmptyState
                title="No outcome score data yet"
                description="Scores will appear once treatments with recorded outcomes exist."
                className="max-w-none h-full"
              />
            )}
          </div>
        </div>

      </div>

      {/* ── Active Treatments Table ─────────────────────────────────────────── */}
      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[15px] font-bold text-txt-primary">
              Active Ongoing Treatments
            </h2>
            <p className="text-[12px] text-txt-muted mt-0.5">
              Treatment protocols currently marked active in the database
              {activeTreatments.length > 0 && ` · ${activeTreatments.length} record${activeTreatments.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {activeTreatments.length === 0 ? (
          <EmptyState
            title="No Active Treatments"
            description="There are currently no ongoing treatment protocols logged in the system."
            className="bg-bg-app border border-borderColor/60 py-8"
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[12px]">
              <thead>
                <tr className="border-b border-borderColor/80 bg-sidebar-bg text-[10px] text-txt-muted uppercase tracking-wider font-bold">
                  <th className="px-4 py-2.5">Patient</th>
                  <th className="px-4 py-2.5">Treatment</th>
                  <th className="px-4 py-2.5">Type</th>
                  <th className="px-4 py-2.5">Start Date</th>
                  <th className="px-4 py-2.5">Approver / Doctor</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderColor/60 text-txt-primary font-medium">
                {activeTreatments.map(tr => (
                  <tr key={tr.id} className="hover:bg-bg-app/40 transition-colors">
                    {/* Patient */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-txt-primary leading-snug">
                          {tr.patient_name || 'Unknown Patient'}
                        </span>
                        <span className="text-[10px] text-txt-muted font-mono">
                          {tr.patient_identifier || `ID: ${tr.patient_id}`}
                        </span>
                      </div>
                    </td>
                    {/* Treatment name */}
                    <td className="px-4 py-3 font-semibold">
                      {tr.treatment || '—'}
                    </td>
                    {/* Treatment type */}
                    <td className="px-4 py-3">
                      {tr.treatment_type ? (
                        <span className="text-[11px] font-semibold text-txt-muted bg-bg-app border border-borderColor/60 rounded-lg px-2 py-0.5 capitalize">
                          {tr.treatment_type}
                        </span>
                      ) : (
                        <span className="text-txt-muted">—</span>
                      )}
                    </td>
                    {/* Start date */}
                    <td className="px-4 py-3 font-mono text-[11px] text-txt-muted">
                      {tr.start_date || '—'}
                    </td>
                    {/* Approver */}
                    <td className="px-4 py-3">
                      {tr.approved_by || (
                        <span className="text-txt-muted">—</span>
                      )}
                    </td>
                    {/* Status badge */}
                    <td className="px-4 py-3">
                      <Badge
                        tone={statusTone(tr.status)}
                        className="text-[8px] font-bold py-0.5 uppercase tracking-wider"
                      >
                        {tr.status}
                      </Badge>
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setActiveTreatmentToEdit(tr);
                          setIsTreatmentOpen(true);
                        }}
                        className="text-[11px] py-1 px-3 border border-borderColor rounded-xl hover:bg-bg-app font-bold"
                      >
                        View / Update
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Completed treatments summary table ─────────────────────────────── */}
      {records.filter(r => r.status === 'completed').length > 0 && (
        <CompletedTreatmentsTable
          records={records.filter(r => r.status === 'completed')}
        />
      )}

      {/* ── Treatment update modal ──────────────────────────────────────────── */}
      <TreatmentFormModal
        isOpen={isTreatmentOpen}
        treatment={activeTreatmentToEdit}
        onClose={() => {
          setIsTreatmentOpen(false);
          setActiveTreatmentToEdit(null);
        }}
        onSubmit={handleTreatmentSubmit}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PageHeader() {
  return (
    <div>
      <h1 className="text-[20px] font-semibold text-txt-primary">
        Treatment Effectiveness
      </h1>
      <p className="text-[14px] text-txt-muted mt-1">
        Analytics based on recorded treatment outcomes, durations, and effectiveness levels.
      </p>
    </div>
  );
}

function CompletedTreatmentsTable({ records }) {
  return (
    <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
      <div>
        <h2 className="text-[15px] font-bold text-txt-primary">
          Completed Treatments
        </h2>
        <p className="text-[12px] text-txt-muted mt-0.5">
          Treatments with recorded outcomes · {records.length} record{records.length !== 1 ? 's' : ''}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-borderColor/80 bg-sidebar-bg text-[10px] text-txt-muted uppercase tracking-wider font-bold">
              <th className="px-4 py-2.5">Patient</th>
              <th className="px-4 py-2.5">Treatment</th>
              <th className="px-4 py-2.5">Type</th>
              <th className="px-4 py-2.5">Start Date</th>
              <th className="px-4 py-2.5">End Date</th>
              <th className="px-4 py-2.5">Outcome Score</th>
              <th className="px-4 py-2.5">Effectiveness</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borderColor/60 text-txt-primary font-medium">
            {records.map(tr => (
              <tr key={tr.id} className="hover:bg-bg-app/40 transition-colors">
                {/* Patient */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-bold text-txt-primary leading-snug">
                      {tr.patient_name || 'Unknown Patient'}
                    </span>
                    <span className="text-[10px] text-txt-muted font-mono">
                      {tr.patient_identifier || `ID: ${tr.patient_id}`}
                    </span>
                  </div>
                </td>
                {/* Treatment name */}
                <td className="px-4 py-3 font-semibold">
                  {tr.treatment || '—'}
                </td>
                {/* Treatment type */}
                <td className="px-4 py-3">
                  {tr.treatment_type ? (
                    <span className="text-[11px] font-semibold text-txt-muted bg-bg-app border border-borderColor/60 rounded-lg px-2 py-0.5 capitalize">
                      {tr.treatment_type}
                    </span>
                  ) : (
                    <span className="text-txt-muted">—</span>
                  )}
                </td>
                {/* Dates */}
                <td className="px-4 py-3 font-mono text-[11px] text-txt-muted">
                  {tr.start_date || '—'}
                </td>
                <td className="px-4 py-3 font-mono text-[11px] text-txt-muted">
                  {tr.end_date || '—'}
                </td>
                {/* Outcome score */}
                <td className="px-4 py-3">
                  {tr.outcome_score !== null && tr.outcome_score !== undefined ? (
                    <span className="font-bold text-txt-primary">
                      {Number(tr.outcome_score).toFixed(1)}
                      <span className="text-[10px] text-txt-muted font-normal"> / 100</span>
                    </span>
                  ) : (
                    <span className="text-txt-muted">—</span>
                  )}
                </td>
                {/* Effectiveness level */}
                <td className="px-4 py-3">
                  {tr.effectiveness_level ? (
                    <Badge
                      tone={levelTone(tr.effectiveness_level)}
                      className="text-[8px] font-bold py-0.5 uppercase tracking-wider"
                    >
                      {tr.effectiveness_level}
                    </Badge>
                  ) : (
                    <span className="text-txt-muted">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
