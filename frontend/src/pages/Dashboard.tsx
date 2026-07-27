import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Users,
  Brain,
  AlertTriangle,
  TrendingUp,
  Activity,
  FileText,
  BarChart3,
  Plus,
  ArrowRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { dashboardApi } from '../api/dashboard';
import { useAuth } from '../context/AuthContext';
import type { RiskCategory } from '../types/api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const formatDate = (): string => {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRelativeTime = (isoString: string): string => {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
};

const getRiskBadgeClass = (risk: RiskCategory): string => {
  const map: Record<RiskCategory, string> = {
    low: 'badge-low',
    moderate: 'badge-moderate',
    high: 'badge-high',
    critical: 'badge-critical',
  };
  return map[risk] ?? 'badge-low';
};

const getRiskLabel = (risk: RiskCategory): string =>
  risk.charAt(0).toUpperCase() + risk.slice(1);

// ─── Skeleton helpers ──────────────────────────────────────────────────────────

const SkeletonRow: React.FC = () => (
  <tr>
    {[180, 90, 80, 70].map((w, i) => (
      <td key={i}>
        <div
          className="skeleton skeleton-text"
          style={{ width: w, height: 14 }}
        />
      </td>
    ))}
  </tr>
);

const SkeletonStatCard: React.FC = () => (
  <div className="stat-card">
    <div className="skeleton" style={{ width: 44, height: 44, borderRadius: 12 }} />
    <div className="skeleton skeleton-text mt-2" style={{ width: 80 }} />
    <div className="skeleton" style={{ width: 60, height: 28, borderRadius: 6, marginTop: 4 }} />
  </div>
);

// ─── Pie chart colours ─────────────────────────────────────────────────────────

const PIE_COLORS = {
  readmitted: '#EF4444',
  not_readmitted: '#10B981',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  colorClass: 'primary' | 'success' | 'warning' | 'danger';
  subtext?: string;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon, colorClass, subtext }) => (
  <div className={`stat-card ${colorClass}`}>
    <div className={`stat-icon ${colorClass}`}>{icon}</div>
    <p className="stat-label">{label}</p>
    <p className="stat-value">{value}</p>
    {subtext && <p className="stat-change">{subtext}</p>}
  </div>
);

// ─── Quick Action Card ─────────────────────────────────────────────────────────

interface QuickActionProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
}

const QuickActionCard: React.FC<QuickActionProps> = ({ to, icon, title, description, colorClass }) => (
  <Link to={to} style={{ textDecoration: 'none' }}>
    <div
      className="card"
      style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        cursor: 'pointer',
        transition: 'all var(--transition)',
      }}
    >
      <div
        className={`stat-icon ${colorClass}`}
        style={{ flexShrink: 0 }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 2 }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{description}</p>
      </div>
      <ArrowRight size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
    </div>
  </Link>
);

// ─── Main Dashboard ────────────────────────────────────────────────────────────

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  // ── Data fetching ──────────────────────────────────────────────────────────
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboard', 'summary'],
    queryFn: () => dashboardApi.getSummary(),
    staleTime: 60_000,
  });

  const { data: recentPredictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['dashboard', 'recentPredictions', 10],
    queryFn: () => dashboardApi.getRecentPredictions(10),
    staleTime: 30_000,
  });

  const { data: hospitalOverview, isLoading: overviewLoading } = useQuery({
    queryKey: ['dashboard', 'hospitalOverview'],
    queryFn: () => dashboardApi.getHospitalOverview(),
    staleTime: 60_000,
  });

  const { data: readmissionStats, isLoading: readmissionLoading } = useQuery({
    queryKey: ['dashboard', 'readmissionStats'],
    queryFn: () => dashboardApi.getReadmissionStats(),
    staleTime: 60_000,
  });

  // ── Derived values ─────────────────────────────────────────────────────────
  const pieData = readmissionStats
    ? [
        { name: 'Readmitted', value: readmissionStats.readmitted },
        { name: 'Not Readmitted', value: readmissionStats.not_readmitted },
      ]
    : [];

  const readmissionRateDisplay = summary
    ? `${summary.readmission_rate.toFixed(1)}%`
    : '—';

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">
            Welcome back,{' '}
            <strong>{user?.full_name ?? 'User'}</strong>
          </p>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            {formatDate()}
          </p>
        </div>

        {/* Live indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '8px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(16,185,129,0.1)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: 'var(--color-accent)',
              animation: 'pulse 2s infinite',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 500, color: '#059669' }}>Live</span>
        </div>
      </div>

      {/* ── Stats Grid ──────────────────────────────────────────────────── */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {summaryLoading ? (
          <>
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
            <SkeletonStatCard />
          </>
        ) : (
          <>
            <StatCard
              label="Total Patients"
              value={summary?.total_patients?.toLocaleString() ?? '—'}
              icon={<Users size={22} />}
              colorClass="primary"
              subtext="All registered patients"
            />
            <StatCard
              label="Total Predictions"
              value={summary?.total_predictions?.toLocaleString() ?? '—'}
              icon={<Brain size={22} />}
              colorClass="success"
              subtext="AI analyses run"
            />
            <StatCard
              label="High Risk Patients"
              value={summary?.high_risk_patients?.toLocaleString() ?? '—'}
              icon={<AlertTriangle size={22} />}
              colorClass="danger"
              subtext="Require immediate attention"
            />
            <StatCard
              label="Readmission Rate"
              value={readmissionRateDisplay}
              icon={<TrendingUp size={22} />}
              colorClass="warning"
              subtext={`Avg risk: ${summary ? (summary.average_risk_score * 100).toFixed(1) : '—'}%`}
            />
          </>
        )}
      </div>

      {/* ── Two-column layout ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '60fr 40fr',
          gap: 20,
          marginBottom: 24,
          alignItems: 'start',
        }}
      >
        {/* ── Recent Predictions Table (Left 60%) ────────────────────── */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={18} color="var(--color-primary)" />
              Recent Predictions
            </h2>
            <Link
              to="/prediction"
              className="btn btn-secondary btn-sm"
              style={{ textDecoration: 'none' }}
            >
              View All
            </Link>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            <div className="table-wrapper" style={{ border: 'none', borderRadius: 0, boxShadow: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Patient</th>
                    <th>Risk</th>
                    <th>Probability</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionsLoading ? (
                    Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : recentPredictions && recentPredictions.length > 0 ? (
                    recentPredictions.map((p) => (
                      <tr key={`${p.patient_id}-${p.created_at}`}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background:
                                  'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 12,
                                fontWeight: 600,
                                color: 'white',
                                flexShrink: 0,
                              }}
                            >
                              {p.patient_name
                                .split(' ')
                                .slice(0, 2)
                                .map((n) => n[0])
                                .join('')
                                .toUpperCase()}
                            </div>
                            <span
                              style={{
                                fontWeight: 500,
                                fontSize: 14,
                                color: 'var(--text-primary)',
                                maxWidth: 140,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {p.patient_name}
                            </span>
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getRiskBadgeClass(p.risk_category)}`}>
                            {getRiskLabel(p.risk_category)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Probability bar */}
                            <div
                              style={{
                                width: 60,
                                height: 6,
                                background: 'var(--bg-input)',
                                borderRadius: 3,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${(p.probability * 100).toFixed(0)}%`,
                                  background:
                                    p.risk_category === 'critical'
                                      ? 'var(--color-danger)'
                                      : p.risk_category === 'high'
                                      ? '#F97316'
                                      : p.risk_category === 'moderate'
                                      ? 'var(--color-warning)'
                                      : 'var(--color-accent)',
                                  borderRadius: 3,
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>
                              {(p.probability * 100).toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                          {formatRelativeTime(p.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4}>
                        <div className="empty-state" style={{ padding: '32px 16px' }}>
                          <Brain size={32} className="empty-icon" />
                          <p className="empty-title">No predictions yet</p>
                          <p className="empty-desc">
                            Run your first AI prediction to see results here.
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── Right Column (40%) ──────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Hospital Overview */}
          <div className="card">
            <div className="card-header">
              <h2
                className="card-title"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <Activity size={18} color="var(--color-secondary)" />
                Hospital Overview
              </h2>
            </div>
            <div className="card-body">
              {overviewLoading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="skeleton skeleton-text" style={{ width: 110 }} />
                      <div className="skeleton skeleton-text" style={{ width: 50 }} />
                    </div>
                  ))}
                </div>
              ) : hospitalOverview ? (
                <>
                  {hospitalOverview.hospital_name && (
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {hospitalOverview.hospital_name}
                    </p>
                  )}

                  {[
                    {
                      label: 'Total Patients',
                      value: hospitalOverview.total_patients.toLocaleString(),
                      color: 'var(--color-primary)',
                      bg: 'rgba(37,99,235,0.08)',
                    },
                    {
                      label: 'Total Doctors',
                      value: hospitalOverview.total_doctors.toLocaleString(),
                      color: 'var(--color-secondary)',
                      bg: 'rgba(20,184,166,0.08)',
                    },
                    {
                      label: 'High Risk Patients',
                      value: hospitalOverview.high_risk_patients.toLocaleString(),
                      color: 'var(--color-danger)',
                      bg: 'rgba(239,68,68,0.08)',
                    },
                  ].map(({ label, value, color, bg }) => (
                    <div
                      key={label}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-sm)',
                        background: bg,
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>
                        {label}
                      </span>
                      <span style={{ fontSize: 15, fontWeight: 700, color }}>{value}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p style={{ fontSize: 14, color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                  No overview data available.
                </p>
              )}
            </div>
          </div>

          {/* Readmission Distribution Pie Chart */}
          <div className="card">
            <div className="card-header">
              <h2
                className="card-title"
                style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              >
                <BarChart3 size={18} color="var(--color-warning)" />
                Readmission Distribution
              </h2>
            </div>
            <div className="card-body">
              {readmissionLoading ? (
                <div
                  className="skeleton"
                  style={{ height: 200, borderRadius: 'var(--radius-md)' }}
                />
              ) : readmissionStats && readmissionStats.total > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="value"
                        strokeWidth={0}
                      >
                        <Cell fill={PIE_COLORS.readmitted} />
                        <Cell fill={PIE_COLORS.not_readmitted} />
                      </Pie>
                      <RechartsTooltip
                        formatter={(value: number, name: string) => [
                          `${value.toLocaleString()} patients`,
                          name,
                        ]}
                        contentStyle={{
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 8,
                          fontSize: 13,
                          color: 'var(--text-primary)',
                        }}
                      />
                      <Legend
                        iconType="circle"
                        iconSize={8}
                        formatter={(value) => (
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {value}
                          </span>
                        )}
                      />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Rate summary */}
                  <div
                    style={{
                      textAlign: 'center',
                      marginTop: 4,
                      padding: '10px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-input)',
                    }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Readmission rate:{' '}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-danger)' }}>
                      {readmissionStats.readmission_rate.toFixed(1)}%
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {' '}({readmissionStats.total.toLocaleString()} total)
                    </span>
                  </div>
                </>
              ) : (
                <div className="empty-state" style={{ padding: '24px 0' }}>
                  <BarChart3 size={28} className="empty-icon" />
                  <p className="empty-title">No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick Actions Row ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 8 }}>
        <h2
          style={{
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: 14,
          }}
        >
          Quick Actions
        </h2>
        <div className="grid-4">
          <QuickActionCard
            to="/prediction"
            icon={<Brain size={20} />}
            title="Run AI Prediction"
            description="Analyse patient readmission risk"
            colorClass="primary"
          />
          <QuickActionCard
            to="/patients/new"
            icon={<Plus size={20} />}
            title="Add Patient"
            description="Register a new patient record"
            colorClass="success"
          />
          <QuickActionCard
            to="/reports"
            icon={<FileText size={20} />}
            title="Generate Report"
            description="Export PDF, CSV, or Excel"
            colorClass="warning"
          />
          <QuickActionCard
            to="/analytics"
            icon={<BarChart3 size={20} />}
            title="View Analytics"
            description="Explore trends and insights"
            colorClass="danger"
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
