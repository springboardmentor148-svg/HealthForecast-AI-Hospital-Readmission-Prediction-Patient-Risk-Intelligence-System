import React from 'react';
import { HospitalAnalyticsSummary, UserRole } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Users,
  Clock,
  Building2,
  Activity,
} from 'lucide-react';

interface HospitalAnalyticsDashboardProps {
  analytics: HospitalAnalyticsSummary;
  userRole: UserRole;
}

export const HospitalAnalyticsDashboard: React.FC<HospitalAnalyticsDashboardProps> = ({
  analytics,
  userRole,
}) => {
  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'];

  const highRiskShare =
    analytics.totalPatients > 0
      ? ((analytics.highRiskPatientsCount / analytics.totalPatients) * 100).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">

      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-indigo-600" />
          Hospital Readmission & Performance Analytics
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          30-day readmission rates, risk-tier breakdown, and length of stay computed from current patient records
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* KPI 1: Readmission Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>30-Day Readmission Rate</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <Activity className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics.readmissionRate30Day}%
          </div>
          <p className="text-[11px] text-slate-500">
            of discharged patients readmitted within 30 days
          </p>
        </div>

        {/* KPI 2: High Risk Patient Cohort */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>High Risk Patients</span>
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics.highRiskPatientsCount.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            {highRiskShare}% of {analytics.totalPatients.toLocaleString()} total patients
          </p>
        </div>

        {/* KPI 3: Total Patient Cohort */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Patient Cohort</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Users className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics.totalPatients.toLocaleString()}
          </div>
          <p className="text-[11px] text-slate-500">
            patients in the current dataset
          </p>
        </div>

        {/* KPI 4: Avg Length of Stay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Length of Stay</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics.avgLengthOfStayDays} Days
          </div>
          <p className="text-[11px] text-slate-500">
            mean inpatient duration per admission
          </p>
        </div>

      </div>

      {/* Chart Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Departmental Readmission Rate Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Readmission Rate by Clinical Department</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.readmissionsByDepartment}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="department" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Readmission Rate']} />
                <Bar dataKey="rate" fill="#4f46e5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Readmission by Age Group */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Readmission Rate by Age Bracket</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.readmissionsByAge}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="ageGroup" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(val: any) => [`${val}%`, 'Readmission Rate']} />
                <Bar dataKey="rate" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Risk Tier Donut Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
          <h3 className="font-bold text-slate-900 text-sm">Population Risk Tier Breakdown</h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.riskDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="tier"
                  label={({ tier, percentage }) => `${tier}: ${percentage}%`}
                >
                  {analytics.riskDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(val: any) => [val.toLocaleString(), 'Patients']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

    </div>
  );
};
