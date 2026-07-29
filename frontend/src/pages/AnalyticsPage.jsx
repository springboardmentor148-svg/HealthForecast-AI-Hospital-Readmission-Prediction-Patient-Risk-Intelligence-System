import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { ROLES } from '../config/rbac';
import {
  LineChart,
  BarChart,
  DonutChart,
  StatCard,
  Badge,
  DataTable,
  Button,
  EmptyState,
  LoadingSkeleton,
  useToast,
} from '../components';
import { FileSpreadsheet, FileText } from 'lucide-react';

const formatCount = (value, suffix = '') => `${Number(value || 0).toLocaleString('en-US')}${suffix}`;

export default function AnalyticsPage() {
  const { currentRole } = useAuth();
  const { analyticsOverview, isAnalyticsLoading, analyticsError } = useAnalytics();
  const { showToast } = useToast();

  const doctor = analyticsOverview?.doctor || {};
  const researcher = analyticsOverview?.researcher || {};
  const executive = analyticsOverview?.executive || {};

  const doctorTrend = doctor.trend || [];
  const doctorRiskDist = doctor.risk_distribution || [];
  const researcherTrend = researcher.trend || [];
  const researcherGlycemicDist = researcher.glycemic_distribution || [];
  const adminTrend = executive.trend || [];
  const adminPieData = executive.admissions_by_department || [];
  const adminDeptBenchmarks = executive.department_benchmarks || [];

  const adminColumns = [
    { key: 'dept', label: 'Department / Clinic Specialty' },
    { key: 'readmit', label: '30-Day Readmit Rate' },
    { key: 'stay', label: 'Mean Length of Stay' },
    {
      key: 'improved',
      label: 'Improvement Index',
      render: (row) => (
        <span className="font-semibold text-txt-primary">{row.improved}</span>
      ),
    },
    { key: 'total', label: 'Total Cohort Size' },
  ];

  if (isAnalyticsLoading && !analyticsOverview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">Healthcare Analytics</h1>
          <p className="text-[14px] text-txt-muted mt-1">Loading live analytics data.</p>
        </div>
        <LoadingSkeleton type="stat" count={3} />
        <LoadingSkeleton type="card" count={2} />
        <LoadingSkeleton type="table" count={1} />
      </div>
    );
  }

  if (analyticsError && !analyticsOverview) {
    return (
      <EmptyState
        title="Analytics unavailable"
        description={analyticsError}
        className="max-w-2xl mx-auto"
      />
    );
  }

  if (currentRole === ROLES.DOCTOR) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold text-txt-primary">Healthcare Analytics</h1>
            <p className="text-[14px] text-txt-muted mt-1">Clinician View — Performance analytics for assigned patient cohorts.</p>
          </div>
          <Badge tone="info" className="self-start sm:self-auto font-bold px-3 py-1 text-[10px] uppercase">
            Limited Access Scoped
          </Badge>
        </div>

        <div className="bg-bg-app border border-borderColor p-4 rounded-xl text-[12px] text-txt-muted leading-relaxed font-semibold">
          💡 <strong>Scope Active:</strong> Your analytics dashboard is filtered strictly to patients assigned under your active clinician dossier (Dr. Sarah Reed). Cross-department databases, hospital-wide trends, and clinical performance indexes are hidden.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="My Cohort Active Files"
            value={formatCount(doctor.stat_cards?.my_cohort_active_files, ' Patients')}
            subtitle="Diabetic patients under Dr. Reed"
            trend={{ value: doctor.stat_cards?.my_cohort_active_files ? 'Live scope' : 'No data', isPositive: true }}
            tone="info"
          />
          <StatCard
            title="My High-Risk Alerts"
            value={formatCount(doctor.stat_cards?.my_high_risk_alerts, ' Flagged')}
            subtitle="Readmission risk forecast >60%"
            trend={{ value: doctor.stat_cards?.my_high_risk_alerts ? 'Live alerts' : 'No data', isPositive: false }}
            tone="danger"
          />
          <StatCard
            title="Active Model F1-score"
            value={doctor.stat_cards?.active_model_f1 || '0.00%'}
            subtitle="Performance within assigned cohort"
            trend={{ value: 'Endpoint data', isPositive: true }}
            tone="success"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4 flex flex-col justify-between md:col-span-1 min-h-[280px]">
            <div>
              <h3 className="text-[15px] font-semibold text-txt-primary">My Cohort Risk Distribution</h3>
              <p className="text-[12px] text-txt-muted">Banded probability counts of assigned patients.</p>
            </div>
            <div className="h-44">
              {doctorRiskDist.length > 0 ? (
                <DonutChart data={doctorRiskDist} />
              ) : (
                <EmptyState
                  title="No cohort data yet"
                  description="Assigned cohort predictions will appear here once patient records are available."
                  className="max-w-none h-full"
                />
              )}
            </div>
          </div>

          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4 flex flex-col justify-between md:col-span-2 min-h-[280px]">
            <div>
              <h3 className="text-[15px] font-semibold text-txt-primary">My Cohort Readmission Trend</h3>
              <p className="text-[12px] text-txt-muted">Monthly readmission percentage trajectory.</p>
            </div>
            <div className="h-44 flex-1">
              {doctorTrend.length > 0 ? (
                <LineChart data={doctorTrend} dataKey="rate" xAxisKey="name" color="#7A5AF8" />
              ) : (
                <EmptyState
                  title="No trend data yet"
                  description="Trend analytics will appear here once predictions have been generated."
                  className="max-w-none h-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (currentRole === ROLES.RESEARCHER) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-[20px] font-semibold text-txt-primary">Healthcare Analytics</h1>
            <p className="text-[14px] text-txt-muted mt-1">Research View — Population health statistics and cohort-level trends.</p>
          </div>
          <Button
            onClick={() => showToast({ message: 'Export Dispatched: Anonymized Research Dataset (.csv) download initiated.', variant: 'success' })}
            variant="primary"
            className="flex items-center gap-1.5 font-bold self-start sm:self-auto"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Research Dataset</span>
          </Button>
        </div>

        <div className="bg-success-bg/20 border border-success/15 p-4 rounded-xl text-[12px] text-success leading-relaxed font-bold">
          🔒 <strong>Data Anonymization Active:</strong> Personal Identifiable Information (PII) filters are applied. Patient names, IDs, addresses, and clinical audit records are removed. All statistics displayed are population-level aggregates.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            title="Total Research Cohort"
            value={formatCount(researcher.stat_cards?.total_research_cohort, ' Files')}
            subtitle="Anonymized diabetic records parsed"
            trend={{ value: researcher.stat_cards?.total_research_cohort ? 'Full Population' : 'No data', isPositive: true }}
            tone="info"
          />
          <StatCard
            title="Population Readmit Rate"
            value={researcher.stat_cards?.population_readmit_rate || '0.00%'}
            subtitle="Aggregated population mean index"
            trend={{ value: 'Endpoint data', isPositive: true }}
            tone="success"
          />
          <StatCard
            title="Trained Models Index"
            value={formatCount(researcher.stat_cards?.trained_models_index, ' Active')}
            subtitle="Vetted models on anonymized dataset"
            trend={{ value: 'Endpoint data', isPositive: true }}
            tone="secondary"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-txt-primary">Population Readmission Trend</h3>
              <p className="text-[12px] text-txt-muted">Yearly readmission percentages in the aggregated research cohort.</p>
            </div>
            <div className="h-60">
              {researcherTrend.length > 0 ? (
                <LineChart data={researcherTrend} dataKey="rate" xAxisKey="name" color="#F670C7" />
              ) : (
                <EmptyState
                  title="No research trend data yet"
                  description="Aggregated research trend data will appear here once patient records are available."
                  className="max-w-none h-full"
                />
              )}
            </div>
          </div>

          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-txt-primary">Glycemic Index Distributions</h3>
              <p className="text-[12px] text-txt-muted">Aggregated patient frequencies categorized by HbA1c test result bands.</p>
            </div>
            <div className="h-60">
              {researcherGlycemicDist.length > 0 ? (
                <BarChart data={researcherGlycemicDist} dataKey="value" xAxisKey="name" color="#7A5AF8" />
              ) : (
                <EmptyState
                  title="No glycemic data yet"
                  description="Research distribution charts will appear once anonymized records are available."
                  className="max-w-none h-full"
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">Healthcare Analytics</h1>
          <p className="text-[14px] text-txt-muted mt-1">Executive View — Hospital-wide operations, admissions trends, and departmental benchmarks.</p>
        </div>

        <Button
          onClick={() => showToast({ message: 'Export Dispatched: Executive Operational Report (.pdf) download initiated.', variant: 'success' })}
          variant="primary"
          className="flex items-center gap-1.5 font-bold self-start sm:self-auto"
        >
          <FileText className="w-4 h-4" />
          <span>Export Analytics Report</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          title="Hospital-Wide Patients"
          value={formatCount(executive.stat_cards?.total_patients, ' Total')}
          subtitle="Active files monitored today"
          trend={{ value: executive.stat_cards?.total_patients ? 'Live data' : 'No data', isPositive: true }}
          tone="info"
        />
        <StatCard
          title="Avg Hospital Stay"
          value={`${Number(executive.stat_cards?.average_stay || 0).toFixed(1)} days`}
          subtitle="Mean duration across all specialties"
          trend={{ value: 'Endpoint data', isPositive: true }}
          tone="success"
        />
        <StatCard
          title="Total Flagged Alerts"
          value={formatCount(executive.stat_cards?.flagged_alerts, ' High Risk')}
          subtitle="Active readmission flags hospital-wide"
          trend={{ value: executive.stat_cards?.flagged_alerts ? 'Live data' : 'No data', isPositive: false }}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-2 bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-txt-primary">Hospital-Wide Readmission Trend</h3>
            <p className="text-[12px] text-txt-muted">Quarterly hospital-wide 30-day readmission performance curve.</p>
          </div>
          <div className="h-60 flex-1">
            {adminTrend.length > 0 ? (
              <LineChart data={adminTrend} dataKey="rate" xAxisKey="name" color="#7A5AF8" />
            ) : (
              <EmptyState
                title="No executive trend data yet"
                description="Trend analytics will appear once hospital operations data is available."
                className="max-w-none h-full"
              />
            )}
          </div>
        </div>

        <div className="lg:col-span-1 bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-txt-primary">Admissions by Department</h3>
            <p className="text-[12px] text-txt-muted">Distribution ratio of clinical admissions.</p>
          </div>
          <div className="h-48">
            {adminPieData.length > 0 ? (
              <DonutChart data={adminPieData} />
            ) : (
              <EmptyState
                title="No admissions data yet"
                description="Department distribution will appear here once admissions are available."
                className="max-w-none h-full"
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-[15px] font-semibold text-txt-primary">Departmental Performance Benchmarks</h3>
          <p className="text-[12px] text-txt-muted">Operational clinical metrics compared across clinical specialties</p>
        </div>
        {adminDeptBenchmarks.length > 0 ? (
          <DataTable columns={adminColumns} rows={adminDeptBenchmarks} />
        ) : (
          <EmptyState
            title="No benchmark data yet"
            description="Departmental benchmarks will appear once live analytics data is available."
            className="bg-bg-app border border-borderColor"
          />
        )}
      </div>
    </div>
  );
}
