import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock, ThumbsUp } from 'lucide-react';
import {
  StatCard,
  DataTable,
  LineChart,
  BarChart,
  Badge,
  Button,
  EmptyState,
  LoadingSkeleton,
} from '../components';
import { getTreatmentOverview } from '../api/treatments';

export default function TreatmentEffectivenessPage() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isActive = true;

    async function loadTreatmentOverview() {
      setIsLoading(true);
      setError('');
      try {
        const response = await getTreatmentOverview();
        if (!isActive) return;
        setOverview(response);
      } catch (requestError) {
        if (!isActive) return;
        setError(requestError?.message || 'Unable to load treatment effectiveness data.');
        setOverview(null);
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadTreatmentOverview();

    return () => {
      isActive = false;
    };
  }, []);

  const columns = [
    { key: 'treatment', label: 'Treatment Type' },
    {
      key: 'improved',
      label: 'Improved Count',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-txt-primary">{row.improved}</span>
          <Badge tone="success" className="text-[9px] font-bold py-0.5">HEALTHY</Badge>
        </div>
      ),
    },
    {
      key: 'unchanged',
      label: 'Unchanged Count',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-txt-primary">{row.unchanged}</span>
          <Badge tone="warning" className="text-[9px] font-bold py-0.5">STABLE</Badge>
        </div>
      ),
    },
    {
      key: 'worsened',
      label: 'Worsened Count',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-txt-primary">{row.worsened}</span>
          <Badge tone="danger" className="text-[9px] font-bold py-0.5">ATTN</Badge>
        </div>
      ),
    },
    { key: 'total', label: 'Total Cohort' },
  ];

  if (isLoading && !overview) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">Treatment Effectiveness Reports</h1>
          <p className="text-[14px] text-txt-muted mt-1">Loading live treatment effectiveness data.</p>
        </div>
        <LoadingSkeleton type="stat" count={3} />
        <LoadingSkeleton type="card" count={2} />
        <LoadingSkeleton type="table" count={1} />
      </div>
    );
  }

  const stats = overview?.stats || {};
  const recoveryTrendData = overview?.recovery_trend || [];
  const medicationEfficacyData = overview?.medication_efficacy || [];
  const outcomesData = overview?.outcomes || [];
  const hasData = (overview?.records || []).length > 0;

  if (error && !overview) {
    return (
      <EmptyState
        title="Treatment effectiveness unavailable"
        description={error}
        className="max-w-2xl mx-auto"
      />
    );
  }

  if (!hasData) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">Treatment Effectiveness Reports</h1>
          <p className="text-[14px] text-txt-muted mt-1">Outcomes evaluations, recovery status distributions, and medication efficacy assessments.</p>
        </div>

        <EmptyState
          title="No treatment effectiveness data yet"
          description="Add a patient and log an outcome to populate this report."
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-txt-primary">Treatment Effectiveness Reports</h1>
        <p className="text-[14px] text-txt-muted mt-1">Outcomes evaluations, recovery status distributions, and medication efficacy assessments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          icon={ThumbsUp}
          title="Overall Treatment Success Rate"
          value={`${Number(stats.overall_success_rate || 0).toFixed(1)}%`}
          subtitle="Improved glycemic control outcomes"
          trend={{ value: 'Endpoint data', isPositive: true }}
          tone="success"
        />
        <StatCard
          icon={Clock}
          title="Average Days to Recovery"
          value={`${Number(stats.average_days_to_recovery || 0).toFixed(1)} days`}
          subtitle="Mean duration for glycemic stabilization"
          trend={{ value: 'Endpoint data', isPositive: true }}
          tone="info"
        />
        <StatCard
          icon={Activity}
          title="Efficacy Evaluation Index"
          value={`${Number(stats.efficacy_index || 0).toFixed(2)} / 100`}
          subtitle="Patient outcomes satisfaction score"
          trend={{ value: 'Endpoint data', isPositive: true }}
          tone="secondary"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-txt-primary">Recovery Analysis</h3>
            <p className="text-[12px] text-txt-muted">Average patient stabilization progression timeline metrics</p>
          </div>
          <div className="h-60">
            {recoveryTrendData.length > 0 ? (
              <LineChart
                data={recoveryTrendData}
                dataKey="score"
                xAxisKey="name"
                color="#12B76A"
              />
            ) : (
              <EmptyState
                title="No recovery trend data yet"
                description="Recovery metrics will appear once treatment records are available."
                className="max-w-none h-full"
              />
            )}
          </div>
        </div>

        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-txt-primary">Medication Effectiveness Assessment</h3>
            <p className="text-[12px] text-txt-muted">Efficacy ratings index comparison across primary drug categories</p>
          </div>
          <div className="h-60">
            {medicationEfficacyData.length > 0 ? (
              <BarChart
                data={medicationEfficacyData}
                dataKey="efficacy"
                xAxisKey="name"
                color="#7A5AF8"
              />
            ) : (
              <EmptyState
                title="No medication data yet"
                description="Medication efficacy charts will appear once outcomes are available."
                className="max-w-none h-full"
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-[15px] font-semibold text-txt-primary">Treatment Outcome Evaluation</h3>
          <p className="text-[12px] text-txt-muted">Comparative registry matching therapies against outcome variations</p>
        </div>
        {outcomesData.length > 0 ? (
          <DataTable columns={columns} rows={outcomesData} />
        ) : (
          <EmptyState
            title="No outcome rows yet"
            description="Outcome comparisons will appear once treatment records are logged."
            className="bg-bg-app border border-borderColor"
          />
        )}
      </div>
    </div>
  );
}
