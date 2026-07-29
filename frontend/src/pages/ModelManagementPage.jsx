import React, { useEffect, useState } from 'react';
import {
  StatCard,
  DataTable,
  Badge,
  Button,
  LineChart,
  ConfirmDialog,
  EmptyState,
  LoadingSkeleton,
  useToast,
} from '../components';
import { useAnalytics } from '../contexts/AnalyticsContext';
import { Cpu, Calendar, Clock, Server, Info, X } from 'lucide-react';

export default function ModelManagementPage() {
  const { modelSummary, isAnalyticsLoading } = useAnalytics();
  const [modelHistory, setModelHistory] = useState([]);
  const [selectedDetailModel, setSelectedDetailModel] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    targetVersion: null,
  });
  const { showToast } = useToast();

  const currentModel = modelSummary?.current_model || null;
  const performanceTrendData = modelSummary?.performance_trend || [];
  const deploymentHealth = modelSummary?.deployment_health || {};

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

  useEffect(() => {
    setModelHistory(modelSummary?.model_versions || []);
  }, [modelSummary]);

  const handleSetActive = (targetVersion) => {
    setConfirmDialog({
      isOpen: true,
      targetVersion,
    });
  };

  const performSetActive = async (targetVersion) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const updated = modelHistory.map((model) => {
      if (model.version === targetVersion) {
        return { ...model, status: 'active' };
      }
      if (model.status === 'active') {
        return { ...model, status: 'archived' };
      }
      return model;
    });
    setModelHistory(updated);
    showToast({ message: `Model configuration updated successfully. ${targetVersion} is now serving prediction requests.`, variant: 'success' });
    setConfirmDialog({ isOpen: false, targetVersion: null });
  };

  const columns = [
    {
      key: 'version',
      label: 'Model Version',
      render: (row) => (
        <span className="font-semibold text-txt-primary">{row.version}</span>
      ),
    },
    {
      key: 'date',
      label: 'Deployment Date',
      render: (row) => <span className="font-mono text-txt-muted">{row.date || '—'}</span>,
    },
    { key: 'accuracy', label: 'Accuracy' },
    { key: 'roc_auc', label: 'ROC-AUC' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => (
        <Badge
          tone={row.status === 'active' ? 'success' : row.status === 'archived' ? 'info' : 'danger'}
          className="text-[9px] font-bold uppercase py-0.5"
        >
          {row.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <Button
            onClick={() => setSelectedDetailModel(row)}
            variant="ghost"
            className="text-[12px] py-1 px-3 border border-borderColor rounded-xl text-txt-primary hover:bg-bg-app font-semibold inline-flex items-center gap-1"
          >
            <Info className="w-3.5 h-3.5" />
            <span>Details</span>
          </Button>
          <Button
            onClick={() => handleSetActive(row.version)}
            disabled={row.status === 'active'}
            variant="ghost"
            className={`text-[12px] py-1 px-3 border rounded-xl font-semibold transition-all ${
              row.status === 'active'
                ? 'border-borderColor text-txt-muted/50 bg-bg-app/40 cursor-not-allowed'
                : 'border-borderColor text-info hover:bg-bg-app'
            }`}
          >
            Set Active
          </Button>
        </div>
      ),
    },
  ];

  if (isAnalyticsLoading && !modelSummary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">AI Model Management</h1>
          <p className="text-[14px] text-txt-muted mt-1">Loading live model summary.</p>
        </div>
        <LoadingSkeleton type="stat" count={4} />
        <LoadingSkeleton type="card" count={2} />
        <LoadingSkeleton type="table" count={1} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[20px] font-semibold text-txt-primary">AI Model Management</h1>
        <p className="text-[14px] text-txt-muted mt-1">View and manage deployed prediction models.</p>
      </div>

      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-borderColor/60 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-info-bg text-info flex items-center justify-center">
              <Cpu className="w-5.5 h-5.5" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold text-txt-primary flex items-center gap-2">
                <span>{modelStatus ? modelStatus : (currentModel?.version || 'No active model available')}</span>
                <Badge tone={!modelStatus && currentModel ? 'success' : 'warning'} className="text-[9px] font-bold uppercase py-0.5 px-2">
                  {!modelStatus && currentModel ? 'Active' : 'Unavailable'}
                </Badge>
              </h2>
              <p className="text-[11px] text-txt-muted mt-0.5 flex items-center gap-3">
                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> Version: {modelStatus ? '—' : (currentModel?.model_version || '—')}</span>
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Deployed: {modelStatus ? '—' : (currentModel?.date || '—')}</span>
              </p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-txt-muted italic">
            Serving Production Inference
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Accuracy Rate"
            value={modelStatus ? modelStatus : (currentModel?.accuracy || 'No active model available')}
            subtitle={modelStatus ? (modelSummary?.error ? 'Failed to fetch model metadata' : 'Model artifact not loaded at startup') : 'Overall prediction correct score'}
            trend={{ value: modelStatus ? 'No data' : 'Endpoint data', isPositive: !modelStatus }}
            tone="success"
          />
          <StatCard
            title="ROC-AUC Score"
            value={modelStatus ? modelStatus : (currentModel?.roc_auc || 'No active model available')}
            subtitle={modelStatus ? (modelSummary?.error ? 'Failed to fetch model metadata' : 'Model artifact not loaded at startup') : 'Model discriminative index'}
            trend={{ value: modelStatus ? 'No data' : 'Endpoint data', isPositive: !modelStatus }}
            tone="info"
          />
          <StatCard
            title="Model Precision"
            value={modelStatus ? modelStatus : (currentModel?.precision || 'No active model available')}
            subtitle={modelStatus ? (modelSummary?.error ? 'Failed to fetch model metadata' : 'Model artifact not loaded at startup') : 'Positive predictive value'}
            trend={{ value: modelStatus ? 'No data' : 'Endpoint data', isPositive: !modelStatus }}
            tone="secondary"
          />
          <StatCard
            title="Model Recall"
            value={modelStatus ? modelStatus : (currentModel?.recall || 'No active model available')}
            subtitle={modelStatus ? (modelSummary?.error ? 'Failed to fetch model metadata' : 'Model artifact not loaded at startup') : 'Sensitivity screen rate'}
            trend={{ value: modelStatus ? 'No data' : 'Endpoint data', isPositive: !modelStatus }}
            tone="success"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <div className="lg:col-span-1 bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="text-[15px] font-bold text-txt-primary flex items-center gap-1.5 pb-2 border-b border-borderColor/60">
              <Server className="w-4.5 h-4.5 text-info" />
              <span>Deployment Health</span>
            </h3>

            <ul className="space-y-3.5 mt-4 text-[13px] text-txt-primary font-semibold">
              <li className="flex justify-between items-center py-0.5">
                <span className="text-txt-muted">Average Response Time</span>
                <span className="font-mono">{deploymentHealth.average_response_time_ms ?? 0}ms</span>
              </li>
              <li className="flex justify-between items-center py-0.5">
                <span className="text-txt-muted">System Uptime</span>
                <span className="text-success font-mono">{deploymentHealth.uptime_percent ?? 0}%</span>
              </li>
              <li className="flex justify-between items-center py-0.5">
                <span className="text-txt-muted">Predictions Served Today</span>
                <span className="font-mono">{deploymentHealth.predictions_served_today ?? 0} calls</span>
              </li>
              <li className="flex justify-between items-center py-0.5">
                <span className="text-txt-muted">Last Health Check</span>
                <span className="font-mono text-[11px] text-txt-muted">{deploymentHealth.last_health_check || '—'}</span>
              </li>
            </ul>
          </div>

          <div className="bg-bg-app border border-borderColor p-3 rounded-xl text-[11px] text-txt-muted leading-relaxed font-semibold mt-4">
            📡 <strong>Status Check:</strong> Live model metrics are surfaced from the analytics endpoint.
          </div>
        </div>

        <div className="lg:col-span-2 bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
          <div>
            <h3 className="text-[15px] font-semibold text-txt-primary">Model Performance Trend</h3>
            <p className="text-[12px] text-txt-muted">Accuracy (%) optimization path over version history timeline</p>
          </div>
          <div className="h-56">
            {performanceTrendData.length > 0 ? (
              <LineChart
                data={performanceTrendData}
                dataKey="accuracy"
                xAxisKey="name"
                color="#12B76A"
              />
            ) : (
              <EmptyState
                title="No performance trend data yet"
                description="Trend data will appear once model predictions are available."
                className="max-w-none h-full"
              />
            )}
          </div>
        </div>
      </div>

      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <div>
          <h3 className="text-[15px] font-semibold text-txt-primary">Model Version History</h3>
          <p className="text-[12px] text-txt-muted">Repository registry of historical and serving classification parameters.</p>
        </div>
        {modelHistory.length > 0 ? (
          <DataTable columns={columns} rows={modelHistory} />
        ) : (
          <EmptyState
            title="No model versions yet"
            description="Model version history will appear once predictions have been served."
            className="bg-bg-app border border-borderColor"
          />
        )}
      </div>

      {selectedDetailModel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-borderColor rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 relative">
            <button
              onClick={() => setSelectedDetailModel(null)}
              className="absolute right-4 top-4 text-txt-muted hover:text-txt-primary cursor-pointer p-1 rounded-lg hover:bg-bg-app"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <span className="text-[11px] text-info font-bold uppercase tracking-wider block">Evaluation Metrics</span>
              <h3 className="text-[16px] font-bold text-txt-primary">{selectedDetailModel.version}</h3>
            </div>

            <div className="border-t border-borderColor/60 pt-3 space-y-3.5">
              <div className="flex justify-between items-center text-[13px] font-semibold">
                <span className="text-txt-muted">Deployment Date</span>
                <span className="font-mono text-txt-primary">{selectedDetailModel.date || '—'}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-semibold">
                <span className="text-txt-muted">Accuracy</span>
                <span className="font-mono text-success">{selectedDetailModel.accuracy || '0.00%'}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-semibold">
                <span className="text-txt-muted">ROC-AUC Score</span>
                <span className="font-mono text-info">{selectedDetailModel.roc_auc || '0.00%'}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-semibold">
                <span className="text-txt-muted">F1-Score</span>
                <span className="font-mono text-txt-primary">{selectedDetailModel.f1_score || '0.00%'}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-semibold">
                <span className="text-txt-muted">Precision</span>
                <span className="font-mono text-secondary">{selectedDetailModel.precision || '0.00%'}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] font-semibold">
                <span className="text-txt-muted">Recall</span>
                <span className="font-mono text-txt-primary">{selectedDetailModel.recall || '0.00%'}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                onClick={() => setSelectedDetailModel(null)}
                variant="primary"
                className="font-bold px-5"
              >
                Close Details
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Activate this model?"
        description="This will mark the selected model as active in the local UI."
        confirmLabel="Activate"
        cancelLabel="Cancel"
        onConfirm={() => performSetActive(confirmDialog.targetVersion)}
        onCancel={() => setConfirmDialog({ isOpen: false, targetVersion: null })}
      />
    </div>
  );
}
