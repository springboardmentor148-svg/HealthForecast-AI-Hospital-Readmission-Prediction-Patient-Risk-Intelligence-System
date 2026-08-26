import { apiRequest } from './client';
import { mapPatientToUi } from './patients';

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildQueryString(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, value);
    }
  });
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function normalizeHistoryItem(item) {
  if (!item) return null;
  return {
    id: String(item.id),
    patientId: String(item.patient_id ?? item.patientId ?? ''),
    patientIdentifier: item.patient_identifier || '',
    patientName: item.patient_name || '',
    dateRun: item.prediction_date || '',
    modelName: item.model_name || '',
    modelVersion: item.model_version || '',
    modelLabel: item.model_name && item.model_version
      ? `${item.model_name} ${item.model_version}`
      : item.model_name || item.model_version || '',
    probability: toNumber(item.risk_score) ?? 0,
    riskBand: item.risk_class || 'low',
    confidence: toNumber(item.confidence) ?? 0,
    predictionType: item.prediction_type || 'binary',
    thresholdUsed: toNumber(item.threshold_used),
    predictedLabel: item.predicted_label || '',
    threshold: toNumber(item.threshold),
    primaryDiagnosis: item.primary_diagnosis || '',
    predictionId: item.prediction_id ? String(item.prediction_id) : null,
  };
}

function normalizePrediction(prediction) {
  if (!prediction) return null;
  return {
    id: String(prediction.id),
    patientId: String(prediction.patient_id),
    patientName: prediction.patient_name || '',
    patientIdentifier: prediction.patient_identifier || '',
    predictedAt: prediction.predicted_at || '',
    predictionType: prediction.prediction_type || 'binary',
    modelName: prediction.model_name || '',
    modelVersion: prediction.model_version || '',
    modelLabel: prediction.model_name && prediction.model_version
      ? `${prediction.model_name} ${prediction.model_version}`
      : prediction.model_name || prediction.model_version || '',
    riskBand: prediction.risk_band || 'low',
    probability: toNumber(prediction.readmission_probability) ?? 0,
    predictedLabel: prediction.predicted_label || '',
    threshold: toNumber(prediction.threshold),
    featuresSnapshot: prediction.features_snapshot || {},
    explanation: prediction.explanation || '',
    actualReadmitted: prediction.actual_readmitted,
    latestHistory: normalizeHistoryItem(prediction.latest_history),
  };
}

function normalizeRunResult(payload) {
  return {
    prediction: normalizePrediction(payload?.prediction),
    history: normalizeHistoryItem(payload?.history),
    patient: mapPatientToUi(payload?.patient),
    analysis: payload?.analysis || { factors: [], next_steps: [] },
  };
}

export async function listPredictionHistory(params = {}) {
  const response = await apiRequest(`/predictions${buildQueryString(params)}`);
  return {
    predictions: (response?.predictions || []).map(normalizeHistoryItem),
    pagination: response?.pagination || null,
  };
}

export async function getPrediction(predictionId) {
  const response = await apiRequest(`/predictions/${predictionId}`);
  return normalizePrediction(response?.prediction);
}

export async function listPatientPredictionHistory(patientId, params = {}) {
  const response = await apiRequest(`/patients/${patientId}/predictions${buildQueryString(params)}`);
  return {
    predictions: (response?.predictions || []).map(normalizeHistoryItem),
    pagination: response?.pagination || null,
  };
}

export async function runPrediction(payload) {
  const response = await apiRequest('/predictions/run', {
    method: 'POST',
    body: payload,
  });
  return normalizeRunResult(response);
}

export async function getPendingPredictionsCount() {
  const response = await apiRequest('/predictions/pending-count');
  return response?.pending_count ?? 0;
}

export async function runPendingPredictions() {
  return await apiRequest('/predictions/run-pending', {
    method: 'POST',
  });
}

export async function runAllPredictions() {
  return await apiRequest('/predictions/run-all', {
    method: 'POST',
  });
}
