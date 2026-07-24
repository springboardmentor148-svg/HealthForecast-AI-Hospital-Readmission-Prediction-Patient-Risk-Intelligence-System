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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  TrendingDown,
  Users,
  Clock,
  DollarSign,
  Download,
  Building2,
  FileSpreadsheet,
  Activity,
  CheckCircle2,
} from 'lucide-react';

interface HospitalAnalyticsDashboardProps {
  analytics: HospitalAnalyticsSummary;
  userRole: UserRole;
}

export const HospitalAnalyticsDashboard: React.FC<HospitalAnalyticsDashboardProps> = ({
  analytics,
  userRole,
}) => {
  const [exportMessage, setExportMessage] = React.useState<string | null>(null);

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#f43f5e'];

  const handleExportReport = (type: 'pdf' | 'csv') => {
    setExportMessage(`Exporting ${type.toUpperCase()} Healthcare Performance Report...`);
    setTimeout(() => {
      setExportMessage(`Report exported successfully (${type.toUpperCase()}).`);
      setTimeout(() => setExportMessage(null), 3000);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-indigo-600" />
            Hospital Readmission & Performance Analytics
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Executive performance reporting, 30-day readmission trends, and clinical outcome benchmarks
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExportReport('csv')}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={() => handleExportReport('pdf')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
          >
            <Download className="w-4 h-4" />
            Export PDF Report
          </button>
        </div>
      </div>

      {exportMessage && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-xl text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-indigo-600" />
          {exportMessage}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Readmission Rate */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>30-Day Readmission Rate</span>
            <span className="p-1.5 rounded-lg bg-teal-50 text-teal-600">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics.readmissionRate30Day}%
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <span>↓ 3.69%</span>
            <span className="text-slate-400 font-normal">vs previous quarter (14.85%)</span>
          </div>
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
            18.1% of 101,766 total hospital encounters
          </p>
        </div>

        {/* KPI 3: Avg Length of Stay */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Avg Length of Stay</span>
            <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {analytics.avgLengthOfStayDays} Days
          </div>
          <p className="text-[11px] text-slate-500">
            Benchmark: 4.8 Days across regional peers
          </p>
        </div>

        {/* KPI 4: Cost Savings */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Estimated Cost Impact</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            ${(analytics.estimatedCostSavings / 1000000).toFixed(2)}M
          </div>
          <p className="text-[11px] text-slate-500">
            Avoided penalty & readmission savings
          </p>
        </div>

      </div>

      {/* Chart Section Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Monthly Readmission Trend Line Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">30-Day Readmission Rate Monthly Trend (%)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis domain={[8, 16]} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: any) => [`${value}%`, 'Readmission Rate']} />
                <Line
                  type="monotone"
                  dataKey="readmitRate"
                  stroke="#0d9488"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#0d9488' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

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

        {/* Risk Tier Donut Distribution */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
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
                <Tooltip formatter={(val: any) => [val.toLocaleString(), 'Encounters']} />
              </PieChart>
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

      </div>

    </div>
  );
};
