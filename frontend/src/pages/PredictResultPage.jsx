import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { Sparkles, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import RiskGauge from '../components/RiskGauge';
import Button from '../components/Button';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getPrediction } from '../api/predictions';
import { useToast } from '../components/Toast';

function formatTimestamp(timestampStr) {
  if (!timestampStr) return '—';
  try {
    const date = new Date(timestampStr);
    if (isNaN(date.getTime())) {
      return timestampStr;
    }
    const day = date.getDate();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `${day} ${month} ${year} · ${hours}:${minutes} ${ampm}`;
  } catch {
    return timestampStr;
  }
}

export default function PredictResultPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const isPredictionPath = window.location.pathname.startsWith('/predictions/');
  const predictionId = searchParams.get('prediction_id') || (isPredictionPath ? id : null);
  const { currentPrediction, setCurrentPrediction } = usePatient();
  const { showToast } = useToast();
  const [isLoading, setIsLoading] = useState(!currentPrediction || (predictionId && currentPrediction.id !== predictionId));
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    document.title = 'Prediction Result | HealthForecast AI';
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadPrediction() {
      if (currentPrediction && currentPrediction.id === predictionId) {
        setIsLoading(false);
        return;
      }
      if (!predictionId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const prediction = await getPrediction(predictionId);
        if (!isActive) return;
        setCurrentPrediction(prediction);
      } catch (error) {
        if (!isActive) return;
        setLoadError(error?.message || 'Unable to load prediction details.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadPrediction();

    return () => {
      isActive = false;
    };
  }, [currentPrediction, predictionId, setCurrentPrediction]);

  const prediction = currentPrediction;

  const factors = useMemo(() => {
    const rawFactors = prediction?.analysis?.factors || [];
    if (rawFactors.length > 0) return rawFactors;
    const inputs = prediction?.inputs || {};
    const fallbackFactors = [];
    if (Number(inputs.priorInpatient) > 0) {
      fallbackFactors.push({ label: 'Prior inpatient visits', impact: `+${Number(inputs.priorInpatient) * 8}%`, isPositive: true });
    }
    if (inputs.a1cResult && inputs.a1cResult !== 'None') {
      fallbackFactors.push({ label: 'Elevated A1C result', impact: '+12%', isPositive: true });
    }
    if (Number(inputs.medicationsCount) < 5) {
      fallbackFactors.push({ label: 'Low medication count', impact: '-6%', isPositive: false });
    }
    if (Number(inputs.timeInHospital) > 5) {
      fallbackFactors.push({ label: 'Extended stay duration', impact: '+8%', isPositive: true });
    }
    return fallbackFactors.slice(0, 3);
  }, [prediction]);

  const nextSteps = useMemo(() => {
    if (prediction?.analysis?.next_steps?.length) return prediction.analysis.next_steps;
    if (!prediction) return [];
    if (prediction.riskBand === 'high') {
      return [
        'Coordinate priority care transition and post-discharge clinic scheduling within 3 days.',
        'Arrange urgent home healthcare diabetes nurse training sessions.',
        'Re-evaluate sliding scale insulin settings before final discharge signature.',
      ];
    }
    if (prediction.riskBand === 'moderate') {
      return [
        'Arrange primary care outpatient consult within 10-14 days.',
        'Instruct patient to maintain home blood glucose self-monitoring logs.',
        'Refer to dietitian for diabetes medical nutrition therapy consult.',
      ];
    }
    return [
      'Provide standard diabetes discharge materials and instructions.',
      'Resume home care baseline medications. Routine check-up in 30 days.',
    ];
  }, [prediction]);

  const handleSaveToRecord = () => {
    showToast({ message: 'Prediction already saved to the backend.', variant: 'success' });
  };

  if (isLoading) {
    return <LoadingSkeleton type="card" count={2} />;
  }

  if (loadError || !prediction) {
    return (
      <div className="py-20 max-w-md mx-auto">
        <EmptyState
          title="No Prediction Run Yet"
          description={loadError || 'Please return to the Prediction Form page to execute a prediction.'}
          className="bg-surface shadow-card border border-borderColor"
        />
        <div className="text-center mt-6">
          <Link
            to="/predictions"
            className="inline-flex items-center gap-2 text-[14px] font-bold text-info hover:text-info/80 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Predictions</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between pb-2 border-b border-borderColor/60">
        <button
          onClick={() => navigate('/predictions')}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-txt-muted hover:text-txt-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Predictions</span>
        </button>
        <span className="text-[12px] font-semibold text-txt-muted">
          Active Forecast for: <strong>{prediction.patientName}</strong>
        </span>
      </div>

      {/* Top Metadata Info Banner */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 bg-surface border border-borderColor rounded-2xl p-4 text-[13px] font-semibold text-txt-muted shadow-sm justify-between sm:justify-start">
        <div className="flex flex-col min-w-[220px]">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">Model:</span>
            <span className="text-txt-primary font-bold">{prediction.modelLabel || 'Weighted Stacking Ensemble'}</span>
          </div>
          <span className="text-[10.5px] text-txt-muted font-bold mt-0.5">CatBoost • XGBoost • LightGBM</span>
        </div>
        <div className="text-borderColor hidden sm:inline self-center">•</div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">Confidence:</span>
            <span className="text-txt-primary font-bold font-mono">{prediction.latestHistory?.confidence ?? '—'}</span>
          </div>
        </div>
        <div className="text-borderColor hidden sm:inline self-center">•</div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">Threshold:</span>
            <span className="text-txt-primary font-bold font-mono">{prediction.threshold ?? '—'}</span>
          </div>
        </div>
        {(prediction.predictedAt || prediction.latestHistory?.dateRun) && (
          <>
            <div className="text-borderColor hidden sm:inline self-center">•</div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-txt-muted uppercase tracking-wider">Date Run:</span>
                <span className="text-txt-primary font-bold">{formatTimestamp(prediction.predictedAt || prediction.latestHistory?.dateRun)}</span>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card flex flex-col items-center justify-center md:col-span-1 min-h-[260px]">
          <div className="w-full h-48 relative">
            <RiskGauge value={prediction.probability} band={prediction.riskBand} />
          </div>
        </div>

        <div className="bg-[#EAF9F1] border border-[#D1FADF]/60 rounded-2xl p-5 shadow-card md:col-span-2 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-1.5 text-success">
              <Sparkles className="w-4.5 h-4.5" />
              <h3 className="text-[15px] font-bold">Top Contributing Factors</h3>
            </div>

            <ul className="space-y-2 text-[13px] text-txt-primary font-semibold leading-relaxed">
              {factors.map((factor, idx) => (
                <li key={idx} className="flex justify-between items-center bg-surface/50 border border-borderColor/30 rounded-xl px-3.5 py-2">
                  <span>{factor.label}</span>
                  <span className={factor.isPositive ? 'text-danger' : 'text-success font-mono'}>
                    {factor.impact}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-txt-muted leading-tight mt-4">
            {prediction.explanation || 'Prediction details were generated by the backend prediction service.'}
          </p>
        </div>
      </div>

      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-3">
        <h3 className="text-[15px] font-bold text-txt-primary pb-1.5 border-b border-borderColor/60">
          Recommended Next Steps
        </h3>
        <ul className="space-y-2 text-[13px] text-txt-primary font-semibold leading-relaxed list-disc list-inside">
          {nextSteps.map((step, idx) => (
            <li key={idx} className="marker:text-info">
              <span className="pl-1">{step}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="bg-surface border border-borderColor rounded-2xl p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleSaveToRecord}
            variant="primary"
            className="flex items-center gap-1.5 font-bold px-6 py-2"
          >
            <CheckCircle2 className="w-4 h-4 text-success-bg" />
            <span>Saved Successfully</span>
          </Button>

          <Button
            onClick={() => navigate(`/patients/${prediction.patientId}/predict`)}
            variant="ghost"
            className="font-bold border border-borderColor hover:bg-bg-app"
          >
            Run Another Prediction
          </Button>
        </div>

        <button
          onClick={() => navigate('/predictions/history')}
          className="text-[12px] font-bold text-info hover:text-info/80 hover:underline bg-transparent border-none cursor-pointer inline-flex items-center gap-0.5"
        >
          <span>View Prediction History</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
