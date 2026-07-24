import React, { useState } from 'react';
import { ModelPerformanceMetrics } from '../types';
import { Cpu, RefreshCw, CheckCircle2, AlertCircle, BarChart3, Sliders, ShieldCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ModelManagementViewProps {
  metrics: ModelPerformanceMetrics;
  onRetrainModel: () => Promise<void>;
}

export const ModelManagementView: React.FC<ModelManagementViewProps> = ({
  metrics,
  onRetrainModel,
}) => {
  const [retraining, setRetraining] = useState(false);
  const [threshold, setThreshold] = useState(0.50);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleRetrain = async () => {
    setRetraining(true);
    setStatusMessage('Initiating XGBoost hyperparameter tuning & k-fold cross validation on 101,766 dataset encounters...');
    try {
      await onRetrainModel();
      setStatusMessage('Model retrained successfully! Promoted XGBoost-ReadmitNet v2.4.2 to inference pipeline.');
    } catch (err) {
      setStatusMessage('Model retraining error.');
    } finally {
      setRetraining(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

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
            Machine learning algorithm performance monitoring, feature importance SHAP attribution, and model retraining pipeline
          </p>
        </div>

        <button
          onClick={handleRetrain}
          disabled={retraining}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-semibold text-xs flex items-center gap-2 shadow-sm transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${retraining ? 'animate-spin' : ''}`} />
          {retraining ? 'Training Model...' : 'Retrain & Deploy Model'}
        </button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          {statusMessage}
        </div>
      )}

      {/* Model Benchmark Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-xl border border-slate-200 text-center space-y-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">ROC-AUC Score</span>
          <span className="text-2xl font-extrabold text-teal-600">{metrics.rocAuc}</span>
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
          <span className="text-[10px] uppercase font-semibold text-slate-400 block">Training Data</span>
          <span className="text-lg font-bold text-slate-800 font-mono mt-1 block">101.7K Enc</span>
        </div>
      </div>

      {/* ROC Curve & Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ROC-AUC Curve Chart */}
        <div className="lg:col-span-7 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm">Receiver Operating Characteristic (ROC) Curve</h3>
            <span className="text-xs font-mono font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200">
              AUC = {metrics.rocAuc}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.rocCurveData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="fpr" label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -5, fontSize: 10 }} tick={{ fontSize: 10 }} />
                <YAxis label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', fontSize: 10 }} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="tpr" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix & Threshold Tuning */}
        <div className="lg:col-span-5 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 text-sm">Confusion Matrix & Decision Threshold</h3>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center font-medium">
              <span className="text-slate-600">Decision Cutoff Threshold:</span>
              <span className="font-mono font-bold text-teal-700">{threshold.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min={0.10}
              max={0.90}
              step={0.01}
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-teal-600 bg-slate-100 rounded-lg h-2 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono pt-2">
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

      </div>

      {/* Feature Importances Ranking */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm">Global XGBoost Feature Importance Ranking</h3>
        <div className="space-y-2 text-xs">
          {metrics.featureImportances.map((feat, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <span className="w-40 font-mono font-medium text-slate-700 truncate" title={feat.feature}>
                {feat.feature}
              </span>
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal-600 h-2 rounded-full"
                  style={{ width: `${(feat.importance / 0.25) * 100}%` }}
                />
              </div>
              <span className="w-16 text-right font-mono font-bold text-slate-800">
                {(feat.importance * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
