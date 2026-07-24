import React, { useState, useEffect } from 'react';
import { RiskFactorImpact, RiskTier, ReadmissionWindow } from '../types';
import { Activity, Sparkles, RefreshCw, AlertCircle, ShieldAlert, CheckCircle2, Sliders } from 'lucide-react';

interface RiskPredictionSimulatorProps {
  onOpenGeminiAssistantWithCustomData: (customPatient: any) => void;
}

export const RiskPredictionSimulator: React.FC<RiskPredictionSimulatorProps> = ({
  onOpenGeminiAssistantWithCustomData,
}) => {
  // Simulator State
  const [patientName, setPatientName] = useState('Simulation Patient');
  const [age, setAge] = useState('[70-80)');
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [timeInHospital, setTimeInHospital] = useState(7);
  const [numLabProcedures, setNumLabProcedures] = useState(65);
  const [numMedications, setNumMedications] = useState(22);
  const [numInpatientVisits, setNumInpatientVisits] = useState(2);
  const [numEmergencyVisits, setNumEmergencyVisits] = useState(1);
  const [numOutpatientVisits, setNumOutpatientVisits] = useState(0);
  const [a1cResult, setA1cResult] = useState<'>8' | '>7' | 'Normal' | 'None'>('>8');
  const [glucoseTest, setGlucoseTest] = useState<'>300' | '>200' | 'Normal' | 'None'>('>300');
  const [insulinStatus, setInsulinStatus] = useState<'Up' | 'Steady' | 'Down' | 'No'>('Up');
  const [metforminStatus, setMetforminStatus] = useState<'Steady' | 'No'>('Steady');
  const [primaryDiagnosis, setPrimaryDiagnosis] = useState('250.02 - Type 2 Diabetes w/ Uncontrolled Hyperglycemia');

  // Simulation Results
  const [riskScore, setRiskScore] = useState(82);
  const [riskTier, setRiskTier] = useState<RiskTier>('Critical');
  const [readmissionLikelihood, setReadmissionLikelihood] = useState<ReadmissionWindow>('<30 Days');
  const [riskFactors, setRiskFactors] = useState<RiskFactorImpact[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Recalculate Risk whenever input sliders change
  useEffect(() => {
    runPredictionModel();
  }, [
    timeInHospital,
    numLabProcedures,
    numMedications,
    numInpatientVisits,
    numEmergencyVisits,
    numOutpatientVisits,
    a1cResult,
    glucoseTest,
    insulinStatus,
    metforminStatus,
  ]);

  const runPredictionModel = async () => {
    setIsCalculating(true);
    try {
      const payload = {
        name: patientName,
        age,
        gender,
        timeInHospital,
        numLabProcedures,
        numMedications,
        numInpatientVisits,
        numEmergencyVisits,
        numOutpatientVisits,
        a1cResult,
        glucoseTest,
        medications: {
          insulin: insulinStatus,
          metformin: metforminStatus,
        },
        primaryDiagnosis,
      };

      const res = await fetch('/api/predict-risk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success && data.prediction) {
        setRiskScore(data.prediction.riskScore);
        setRiskTier(data.prediction.riskTier);
        setReadmissionLikelihood(data.prediction.readmissionLikelihood);
        setRiskFactors(data.prediction.riskFactors);
        setRecommendations(data.prediction.careRecommendations);
      }
    } catch (err) {
      console.error('Error running risk prediction:', err);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleLaunchGeminiPlan = () => {
    const customPatient = {
      name: patientName,
      age,
      gender,
      race: 'Caucasian',
      primaryDiagnosis,
      timeInHospital,
      numLabProcedures,
      numMedications,
      numInpatientVisits,
      numEmergencyVisits,
      numOutpatientVisits,
      glucoseTest,
      a1cResult,
      medications: { insulin: insulinStatus, metformin: metforminStatus },
      riskScore,
      riskTier,
      readmissionLikelihood,
    };
    onOpenGeminiAssistantWithCustomData(customPatient);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-600" />
            Interactive Readmission Risk Prediction Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Simulate 30-day hospital readmission probabilities by tuning Diabetes 130-US Hospitals clinical feature vectors
          </p>
        </div>

        <button
          onClick={handleLaunchGeminiPlan}
          className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Sparkles className="w-4 h-4 text-teal-200" />
          Generate Gemini Plan for Simulation
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Controls Column */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-slate-600" /> Feature Vector Controls
            </h2>
            <span className="text-[11px] text-teal-600 font-semibold flex items-center gap-1">
              {isCalculating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Real-time XGBoost Evaluation'}
            </span>
          </div>

          {/* Patient Basics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div>
              <label className="text-slate-500 font-medium block mb-1">Age Bracket</label>
              <select
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value="[30-40)">[30-40) Years</option>
                <option value="[50-60)">[50-60) Years</option>
                <option value="[60-70)">[60-70) Years</option>
                <option value="[70-80)">[70-80) Years</option>
                <option value="[80-90)">[80-90) Years</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 font-medium block mb-1">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div>
              <label className="text-slate-500 font-medium block mb-1">HbA1c Lab Level</label>
              <select
                value={a1cResult}
                onChange={(e) => setA1cResult(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
              >
                <option value=">8">&gt; 8% (High)</option>
                <option value=">7">&gt; 7% (Moderate)</option>
                <option value="Normal">Normal (&lt; 7%)</option>
                <option value="None">None Tested</option>
              </select>
            </div>
          </div>

          {/* Sliders Section */}
          <div className="space-y-4 text-xs">
            
            {/* Prior Inpatient Admissions */}
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-700">Prior Inpatient Admissions (Past 12 Mo):</span>
                <span className="font-mono font-bold text-teal-700">{numInpatientVisits} Stays</span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                value={numInpatientVisits}
                onChange={(e) => setNumInpatientVisits(Number(e.target.value))}
                className="w-full accent-teal-600 bg-slate-100 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Prior ER Visits */}
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-700">Prior Emergency Room Visits:</span>
                <span className="font-mono font-bold text-teal-700">{numEmergencyVisits} ER Visits</span>
              </div>
              <input
                type="range"
                min={0}
                max={6}
                value={numEmergencyVisits}
                onChange={(e) => setNumEmergencyVisits(Number(e.target.value))}
                className="w-full accent-teal-600 bg-slate-100 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Time in Hospital */}
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-700">Inpatient Length of Stay (Days):</span>
                <span className="font-mono font-bold text-teal-700">{timeInHospital} Days</span>
              </div>
              <input
                type="range"
                min={1}
                max={14}
                value={timeInHospital}
                onChange={(e) => setTimeInHospital(Number(e.target.value))}
                className="w-full accent-teal-600 bg-slate-100 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Number of Active Meds */}
            <div>
              <div className="flex justify-between font-medium mb-1">
                <span className="text-slate-700">Total Active Prescription Medications:</span>
                <span className="font-mono font-bold text-teal-700">{numMedications} Medications</span>
              </div>
              <input
                type="range"
                min={1}
                max={35}
                value={numMedications}
                onChange={(e) => setNumMedications(Number(e.target.value))}
                className="w-full accent-teal-600 bg-slate-100 rounded-lg h-2 cursor-pointer"
              />
            </div>

            {/* Insulin Titration */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-slate-500 font-medium block mb-1">Insulin Titration</label>
                <select
                  value={insulinStatus}
                  onChange={(e) => setInsulinStatus(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  <option value="Up">Up (Rapid Increase)</option>
                  <option value="Steady">Steady</option>
                  <option value="Down">Down (Decrease)</option>
                  <option value="No">No Insulin</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-medium block mb-1">Fasting Glucose Test</label>
                <select
                  value={glucoseTest}
                  onChange={(e) => setGlucoseTest(e.target.value as any)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-medium"
                >
                  <option value=">300">&gt; 300 mg/dL</option>
                  <option value=">200">&gt; 200 mg/dL</option>
                  <option value="Normal">Normal (&lt; 140 mg/dL)</option>
                  <option value="None">None</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        {/* Live Output Column */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Risk Gauge Card */}
          <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl space-y-4 text-center">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
              30-Day Readmission Probability
            </span>

            <div className="relative inline-flex items-center justify-center my-2">
              <svg className="w-40 h-40 transform -rotate-90">
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  stroke="#1e293b"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  stroke={riskScore >= 75 ? '#f43f5e' : riskScore >= 50 ? '#f59e0b' : '#10b981'}
                  strokeWidth="12"
                  strokeDasharray={427}
                  strokeDashoffset={427 - (427 * riskScore) / 100}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute text-center">
                <span className="text-4xl font-extrabold tracking-tight text-white block">
                  {riskScore}%
                </span>
                <span className={`text-[11px] font-bold uppercase tracking-wider ${
                  riskScore >= 75 ? 'text-rose-400' : riskScore >= 50 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {riskTier} Risk
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/50 text-xs text-slate-300">
              Readmission Forecast: <span className="font-bold text-white">{readmissionLikelihood}</span>
            </div>
          </div>

          {/* SHAP Feature Contribution Waterfall */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-xs">Primary Risk Factor Drivers</h3>
            <div className="space-y-2 text-xs">
              {riskFactors.map((rf, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">{rf.factor}</span>
                    <span className="text-[10px] text-slate-400">{rf.description}</span>
                  </div>
                  <span className={`font-mono font-bold ${rf.impactPercent > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {rf.impactPercent > 0 ? `+${rf.impactPercent}%` : `${rf.impactPercent}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Clinical Recommendations */}
          <div className="bg-teal-50/60 p-5 rounded-2xl border border-teal-200/80 space-y-3">
            <h3 className="font-bold text-teal-900 text-xs flex items-center justify-between">
              <span>Care Recommendations</span>
              <button
                onClick={handleLaunchGeminiPlan}
                className="text-[10px] text-teal-700 hover:underline flex items-center gap-1 font-semibold"
              >
                <Sparkles className="w-3 h-3 text-teal-600" /> Ask Gemini
              </button>
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-700">
              {recommendations.map((rec, i) => (
                <li key={i} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

      </div>

    </div>
  );
};
