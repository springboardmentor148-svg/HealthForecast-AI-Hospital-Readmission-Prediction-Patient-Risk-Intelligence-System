import React from 'react';
import { ModelPerformanceMetrics } from '../types';
import { Cpu } from 'lucide-react';

interface ModelManagementViewProps {
  metrics: ModelPerformanceMetrics;
}

export const ModelManagementView: React.FC<ModelManagementViewProps> = ({ metrics }) => {
  const maxImportance = metrics.featureImportances.length
    ? Math.max(...metrics.featureImportances.map((f) => f.importance))
    : 0;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-emerald-600" />
              AI Model Management & MLOps Pipeline
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-slate-900 text-teal-300">
              {metrics.modelVersion}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            XGBoost readmission model — performance measured on the held-out test split by the training pipeline
          </p>
        </div>
      </div>

      {/* Model Benchmark Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">ROC-AUC Score</span>
          <span className="text-2xl font-extrabold text-teal-600">{metrics.rocAuc.toFixed(4)}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Accuracy</span>
          <span className="text-2xl font-extrabold text-slate-800">{(metrics.accuracy * 100).toFixed(1)}%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Precision</span>
          <span className="text-2xl font-extrabold text-slate-800">{(metrics.precision * 100).toFixed(1)}%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Recall</span>
          <span className="text-2xl font-extrabold text-slate-800">{(metrics.recall * 100).toFixed(1)}%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">F1 Score</span>
          <span className="text-2xl font-extrabold text-slate-800">{(metrics.f1Score * 100).toFixed(1)}%</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Training Samples</span>
          <span className="text-lg font-bold text-slate-800 font-mono mt-1 block">
            {(metrics.trainedEncounters / 1000).toFixed(1)}K
          </span>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Test-Set Confusion Matrix</h3>
        <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono pt-1 max-w-2xl">
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <span className="text-[10px] text-emerald-700 block uppercase font-bold">True Positive (TP)</span>
            <span className="text-lg font-extrabold text-emerald-900">{metrics.confusionMatrix.truePositive.toLocaleString()}</span>
          </div>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-[10px] text-rose-700 block uppercase font-bold">False Positive (FP)</span>
            <span className="text-lg font-extrabold text-rose-900">{metrics.confusionMatrix.falsePositive.toLocaleString()}</span>
          </div>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-[10px] text-rose-700 block uppercase font-bold">False Negative (FN)</span>
            <span className="text-lg font-extrabold text-rose-900">{metrics.confusionMatrix.falseNegative.toLocaleString()}</span>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl border border-slate-200">
            <span className="text-[10px] text-slate-700 block uppercase font-bold">True Negative (TN)</span>
            <span className="text-lg font-extrabold text-slate-900">{metrics.confusionMatrix.trueNegative.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Feature Importances Ranking */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">
          XGBoost Feature Importance Ranking ({metrics.featureCount} engineered features)
        </h3>
        {metrics.featureImportances.length === 0 ? (
          <p className="text-xs text-slate-500">No feature importance data available from the training pipeline.</p>
        ) : (
          <div className="space-y-2 text-xs">
            {metrics.featureImportances.map((feat, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <span className="w-40 font-mono font-medium text-slate-700 truncate" title={feat.feature}>
                  {feat.feature}
                </span>
                <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-teal-600 h-2 rounded-full"
                    style={{ width: `${maxImportance ? (feat.importance / maxImportance) * 100 : 0}%` }}
                  />
                </div>
                <span className="w-16 text-right font-mono font-bold text-slate-800">
                  {(feat.importance * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
