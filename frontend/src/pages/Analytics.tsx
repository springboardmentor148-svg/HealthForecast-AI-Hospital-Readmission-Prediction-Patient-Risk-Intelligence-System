import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';

const COLORS = { low: '#10B981', moderate: '#F59E0B', high: '#F97316', critical: '#EF4444' };

const ChartCard: React.FC<{ title: string; desc: string; children: React.ReactNode; isLoading?: boolean }> = ({ title, desc, children, isLoading }) => (
  <div className="card">
    <div className="card-header">
      <div>
        <h3 className="card-title">{title}</h3>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{desc}</p>
      </div>
    </div>
    <div className="card-body" style={{ height: 280 }}>
      {isLoading ? <div className="skeleton" style={{ height: '100%', borderRadius: 8 }} /> : children}
    </div>
  </div>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: 8, padding: '10px 14px', fontSize: 13 }}>
      {label && <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>}
      {payload.map((p: any) => <div key={p.name} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' && p.value % 1 !== 0 ? p.value.toFixed(1) : p.value}</div>)}
    </div>
  );
};

const Analytics: React.FC = () => {
  const { data: distribution, isLoading: l1 } = useQuery({ queryKey: ['analytics-distribution'], queryFn: analyticsApi.getReadmissionDistribution, staleTime: 60000 });
  const { data: monthly, isLoading: l2 } = useQuery({ queryKey: ['analytics-monthly'], queryFn: analyticsApi.getMonthlyAnalytics, staleTime: 60000 });
  const { data: ageData, isLoading: l3 } = useQuery({ queryKey: ['analytics-age'], queryFn: analyticsApi.getAgeDistribution, staleTime: 60000 });
  const { data: trends, isLoading: l4 } = useQuery({ queryKey: ['analytics-trends'], queryFn: analyticsApi.getPatientTrends, staleTime: 60000 });

  const pieColors = ['#10B981', '#F59E0B', '#F97316', '#EF4444'];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Healthcare Analytics</h1>
          <p className="page-subtitle">Population-level insights from prediction data</p>
        </div>
      </div>

      <div className="grid-2">
        {/* Risk Distribution Pie */}
        <ChartCard title="Risk Level Distribution" desc="Proportion of patients by readmission risk category" isLoading={l1}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={distribution ?? []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={3}>
                {(distribution ?? []).map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Monthly Volume */}
        <ChartCard title="Monthly Prediction Volume" desc="Predictions run per month and high-risk counts" isLoading={l2}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly ?? []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="total_predictions" name="Total" fill="var(--color-primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="high_risk_count" name="High Risk" fill="#EF4444" radius={[4, 4, 0, 0]} />
              <Legend formatter={(v) => <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{v}</span>} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Age Distribution */}
        <ChartCard title="Patient Age Distribution" desc="Number of patients grouped by age band" isLoading={l3}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={ageData ?? []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="age_group" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Patients" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Patient Trends */}
        <ChartCard title="Patient Volume Trends" desc="New patient registrations over time" isLoading={l4}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trends ?? []} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="value" name="Patients" stroke="var(--color-accent)" strokeWidth={2.5} dot={{ fill: 'var(--color-accent)', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Analytics;
