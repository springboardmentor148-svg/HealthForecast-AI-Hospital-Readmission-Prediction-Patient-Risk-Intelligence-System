import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  AlertTriangle, 
  Activity, 
  Clock, 
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAnalytics } from '../contexts/AnalyticsContext';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import DonutChart from '../components/DonutChart';
import BarChart from '../components/BarChart';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { dashboardSummary, modelSummary, isAnalyticsLoading } = useAnalytics();

  const dashboardStats = dashboardSummary?.stats || {};
  const currentModel = modelSummary?.current_model || null;

  const getModelStatusText = () => {
    if (!modelSummary) return 'No active model available';
    if (modelSummary.error) {
      if (modelSummary.status === 403) return 'Access Denied';
      return 'Error loading model';
    }
    if (modelSummary.model_loaded === false) return 'No active model available';
    return null;
  };

  const modelStatus = getModelStatusText();
  const dashboardPatients = (dashboardSummary?.recent_high_risk_patients || []).map((patient) => ({
    id: patient.id,
    name: patient.full_name || patient.patient_identifier || 'Unknown Patient',
    avatarInitials: (patient.full_name || patient.patient_identifier || 'UP')
      .split(' ')
      .filter(Boolean)
      .map((part) => part.replace(/[^\w]/g, ''))
      .map((part) => part[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || 'UP',
    primaryDiagnosis: patient.primary_diagnosis || 'No diagnosis recorded',
    readmissionProbability: Number.isFinite(Number(patient.readmission_probability))
      ? Math.round(Number(patient.readmission_probability))
      : 0,
    riskBand: patient.risk_band || 'low',
    lastAdmissionDate: patient.last_prediction_at || patient.admission_date || '',
  }));

  const alertPatients = dashboardPatients.slice(0, 5);
  const riskDistribution = dashboardSummary?.risk_distribution || [];
  const specialtyDistribution = dashboardSummary?.specialty_distribution || [];

  const formatPercent = (value) => {
    if (value === null || value === undefined || value === '') return '0.00%';
    if (typeof value === 'number') return `${value.toFixed(2)}%`;
    return String(value);
  };

  const formatCount = (value) => Number(value || 0).toLocaleString('en-US');

  const handleSelectPatient = (patient) => {
    navigate(`/patients/${patient.id}`);
  };

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-info-bg text-info font-bold text-[12px] flex items-center justify-center border border-info/10 flex-shrink-0">
            {row.avatarInitials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-semibold text-txt-primary leading-none mb-0.5">{row.name}</span>
            <span className="text-[11px] font-medium text-txt-muted">ID: #{row.id} | {row.primaryDiagnosis}</span>
          </div>
        </div>
      )
    },
    {
      key: 'probability',
      label: 'Readmission Probability',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-txt-primary font-mono">{row.readmissionProbability}%</span>
          <Badge tone={row.riskBand === 'high' ? 'danger' : 'warning'} className="text-[10px] uppercase font-bold py-0.5">
            {row.riskBand}
          </Badge>
        </div>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <Button
          variant="ghost"
          onClick={() => handleSelectPatient(row)}
          className="text-[12px] py-1 px-3 border border-borderColor rounded-xl hover:bg-bg-app"
        >
          View Record
        </Button>
      )
    }
  ];

  if (isAnalyticsLoading && !dashboardSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">Clinical Forecasts Dashboard</h1>
          <p className="text-[14px] text-txt-muted mt-1">Real-time prediction model results for patient readmissions.</p>
        </div>
        <LoadingSkeleton type="stat" count={3} />
        <LoadingSkeleton type="card" count={2} />
        <LoadingSkeleton type="table" count={1} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-txt-primary">Clinical Forecasts Dashboard</h1>
        <p className="text-[14px] text-txt-muted mt-1">Real-time prediction model results for patient readmissions.</p>
      </div>

      {/* Main Grid: Left side (2/3 width) for KPIs and charts, Right side (1/3 width) for alerts feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Top Row: 3 StatCards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <StatCard
              icon={Users}
              title="Patients Monitored Today"
              value={formatCount(dashboardStats.total_patients)}
              subtitle={dashboardStats.total_patients ? 'Total diabetic patient files parsed' : 'No patient records available yet'}
              trend={{ value: dashboardStats.total_patients ? 'Live data' : 'No data', isPositive: true }}
              tone="info"
            />
            <StatCard
              icon={AlertTriangle}
              title="High-Probability Alerts"
              value={formatCount(dashboardStats.high_risk_patients)}
              subtitle={dashboardStats.high_risk_patients ? 'Flagged for readmission risk' : 'No alerts yet'}
              trend={{ value: dashboardStats.high_risk_patients ? 'Live data' : 'No data', isPositive: false }}
              tone="danger"
            />
            <StatCard
              icon={Activity}
              title="ROC-AUC Score"
              value={modelStatus ? modelStatus : formatPercent(currentModel.roc_auc)}
              subtitle={modelStatus ? (modelSummary?.error ? 'Failed to fetch model metadata' : 'Model artifact not loaded at startup') : 'Discriminative performance of active model'}
              trend={{ value: modelStatus ? 'No model' : 'Live model', isPositive: !modelStatus }}
              tone="success"
            />
          </div>

          {/* Second Row: Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left Card: Readmission Risk Overview */}
            <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-txt-primary">Readmission Risk Overview</h3>
                <p className="text-[12px] text-txt-muted">Binary classification — probability of 30-day readmission</p>
              </div>

              <div className="h-40">
                {riskDistribution.length > 0 ? (
                  <DonutChart data={riskDistribution} />
                ) : (
                  <EmptyState
                    title="No risk distribution yet"
                    description="Once patient predictions are available, the readmission split will appear here."
                    className="max-w-none h-full"
                  />
                )}
              </div>

              {/* Probability Band Statistics */}
              <div className="space-y-2.5 border-t border-borderColor pt-3 text-[12px] font-semibold">
                <div className="flex items-center justify-between pb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-danger" />
                    <span className="text-txt-primary">High (&gt;60%)</span>
                  </div>
                  <span className="text-txt-primary">{formatCount(dashboardStats.high_risk_patients)} Patients</span>
                </div>
                
                <div className="flex items-center justify-between pb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-warning" />
                    <span className="text-txt-primary">Moderate (30-60%)</span>
                  </div>
                  <span className="text-txt-primary">{formatCount(dashboardSummary?.stats?.recent_predictions)} Recent predictions</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-success" />
                    <span className="text-txt-primary">Low (&lt;30%)</span>
                  </div>
                  <span className="text-txt-primary">{formatCount(dashboardStats.total_patients - dashboardStats.high_risk_patients)} Patients</span>
                </div>
              </div>

              {/* AI Clinical Insights Panel (Soft green background tint) */}
              <div className="bg-[#EAF9F1] border border-[#D1FADF]/60 rounded-xl p-4 space-y-2 text-[12px] text-txt-primary font-semibold leading-relaxed">
                <div className="flex items-center gap-1.5 text-success">
                  <Sparkles className="w-4 h-4" />
                  <span className="font-bold">AI Clinical Insights</span>
                </div>
                <ul className="space-y-1.5 list-disc list-inside">
                  <li>{formatCount(dashboardStats.high_risk_patients)} elevated readmission alerts are currently active.</li>
                  <li>
                    Active model: {modelStatus ? modelStatus : (currentModel?.version || 'No active model available')}
                    {!modelStatus && currentModel ? ` — ROC-AUC ${formatPercent(currentModel.roc_auc)}` : ''}
                  </li>
                </ul>
              </div>

            </div>

            {/* Right Card: Prediction Distribution */}
            <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-txt-primary">Prediction Distribution</h3>
                <p className="text-[12px] text-txt-muted">Comparative predicted class ratios across clinical specialties</p>
              </div>

              <div className="h-60 flex-1">
                {specialtyDistribution.length > 0 ? (
                  <BarChart 
                    data={specialtyDistribution} 
                    dataKeys={['positive', 'negative']} 
                    colors={['#7A5AF8', '#F670C7']}
                    xAxisKey="name" 
                  />
                ) : (
                  <EmptyState
                    title="No specialty distribution yet"
                    description="Patient prediction data by specialty will appear here once records are available."
                    className="max-w-none h-full"
                  />
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Right Side Column: High-Risk Alerts Widget */}
        <div className="lg:col-span-1">
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4 h-full flex flex-col">
            <div>
              <h3 className="text-[15px] font-semibold text-txt-primary">High-Risk Alerts</h3>
              <p className="text-[12px] text-txt-muted">Real-time alerts flagged for immediate clinical attention.</p>
            </div>

            {/* Scrollable feed list */}
            <div className="space-y-3 overflow-y-auto max-h-[500px] flex-1 pr-1">
              {isAnalyticsLoading ? (
                <LoadingSkeleton type="card" count={3} />
              ) : alertPatients.length === 0 ? (
                <EmptyState
                  title="No High-Risk Alerts"
                  description="Once predictions are available, high-risk alerts will appear here."
                  className="bg-bg-app border border-borderColor"
                />
              ) : (
                alertPatients.map((patient) => (
                  <div
                    key={patient.id}
                    className="bg-bg-app border border-borderColor p-3.5 rounded-xl flex items-center justify-between gap-3 hover:border-info/30 transition-all duration-150"
                  >
                    <div className="min-w-0">
                      <span className="text-[13px] font-bold text-txt-primary block truncate mb-1">{patient.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge tone={patient.riskBand === 'high' ? 'danger' : patient.riskBand === 'moderate' ? 'warning' : 'success'} className="text-[9px] font-bold">
                          {patient.readmissionProbability}% Risk
                        </Badge>
                        <span className="text-[10px] text-txt-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {patient.lastAdmissionDate ? new Date(patient.lastAdmissionDate).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSelectPatient(patient)}
                      className="text-[12px] font-bold text-info hover:text-info/80 hover:underline bg-transparent border-none cursor-pointer flex-shrink-0 inline-flex items-center gap-0.5"
                    >
                      <span>View Patient</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Third Row: Recent High-Risk Patients Table */}
      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-[15px] font-semibold text-txt-primary">Recent High-Risk Patients</h3>
          <p className="text-[12px] text-txt-muted">Detailed list of highest score readmission likelihood records.</p>
        </div>
        
        {isAnalyticsLoading ? (
          <LoadingSkeleton type="table" count={1} />
        ) : dashboardPatients.length === 0 ? (
          <EmptyState
            title="No Recent High-Risk Patients"
            description="The dashboard will surface live patient records here once they are available."
            className="bg-bg-app border border-borderColor"
          />
        ) : (
          <DataTable columns={columns} rows={dashboardPatients} />
        )}
      </div>
    </div>
  );
}
