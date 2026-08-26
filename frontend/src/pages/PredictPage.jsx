import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { useAnalytics } from '../contexts/AnalyticsContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import { useToast } from '../components/Toast';
import { runPrediction } from '../api/predictions';
import { triggerNotificationRefresh } from '../utils/notifications';

export default function PredictPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedPatient, setSelectedPatient, setCurrentPrediction, patients, getPatientById, refreshPatients } = usePatient();
  const { modelSummary } = useAnalytics();
  const { showToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // If page loads via patient-specific route, auto-load; if via generic /predict or /predictions, reset selected patient on mount
  useEffect(() => {
    document.title = 'Patient Readmission Prediction | HealthForecast AI';
    if (id) {
      if (!selectedPatient || selectedPatient.id !== id) {
        getPatientById(id).catch(() => {});
      }
    } else {
      setSelectedPatient(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Form State Variables
  const [priorInpatient, setPriorInpatient] = useState('1');
  const [priorEmergency, setPriorEmergency] = useState('0');
  const [medicationsCount, setMedicationsCount] = useState('3');
  const [timeInHospital, setTimeInHospital] = useState('4');
  const [diagnosesCount, setDiagnosesCount] = useState('5');
  const [a1cResult, setA1cResult] = useState('None');
  const [insulinUsage, setInsulinUsage] = useState('Steady');

  // Sync form inputs with selected patient profile when available
  useEffect(() => {
    if (selectedPatient) {
      setPriorInpatient(String(selectedPatient.priorDiagnosesCount > 5 ? 2 : 1));
      setPriorEmergency(String(selectedPatient.riskBand === 'high' ? 1 : 0));
      setMedicationsCount(String(selectedPatient.medications ? selectedPatient.medications.length : 3));
      setTimeInHospital(String(selectedPatient.timeInHospital || 4));
      setDiagnosesCount(String(selectedPatient.priorDiagnosesCount || 5));
      setA1cResult(selectedPatient.riskBand === 'high' ? '>8' : 'None');
      setInsulinUsage(selectedPatient.medications && selectedPatient.medications.includes('Insulin Glargine') ? 'Steady' : 'No');
    }
  }, [selectedPatient]);

  const handlePatientSelectChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      getPatientById(selectedId).then((patient) => {
        setSelectedPatient(patient);
        const isPredictionsPath = window.location.pathname === '/predictions' || window.location.pathname === '/predict';
        if (!isPredictionsPath) {
          navigate(`/patients/${selectedId}/predict`);
        }
      }).catch(() => {});
    }
  };

  const handleRunPrediction = async (e) => {
    e.preventDefault();
    if (!selectedPatient) {
      showToast({ message: 'Please select a patient file first.', variant: 'error' });
      return;
    }

    setIsSubmitting(true);
    setFormError('');

    try {
      const result = await runPrediction({
        patient_id: selectedPatient.id,
        prior_inpatient: priorInpatient,
        prior_emergency: priorEmergency,
        medications_count: medicationsCount,
        time_in_hospital: timeInHospital,
        diagnoses_count: diagnosesCount,
        a1c_result: a1cResult,
        insulin_usage: insulinUsage,
      });

      setCurrentPrediction({
        ...result.prediction,
        patientName: result.patient?.name || selectedPatient.name,
        patientId: selectedPatient.id,
        patientIdentifier: result.patient?.patientIdentifier || selectedPatient.patientIdentifier,
        inputs: {
          priorInpatient,
          priorEmergency,
          medicationsCount,
          timeInHospital,
          diagnosesCount,
          a1cResult,
          insulinUsage,
        },
        analysis: result.analysis,
        history: result.history,
      });

      if (result.patient) {
        setSelectedPatient(result.patient);
      }

      await refreshPatients();
      triggerNotificationRefresh();
      navigate(`/predictions/${result.prediction.id}`);
    } catch (error) {
      const message = error?.message || 'Unable to run prediction.';
      setFormError(message);
      showToast({ message, variant: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Dropdown list options mapping
  const a1cOptions = [
    { value: 'None', label: 'None' },
    { value: 'Normal', label: 'Normal' },
    { value: '>7', label: 'More than 7%' },
    { value: '>8', label: 'More than 8%' }
  ];

  const insulinOptions = [
    { value: 'No', label: 'No Usage' },
    { value: 'Steady', label: 'Steady Dose' },
    { value: 'Up', label: 'Dose Increased' },
    { value: 'Down', label: 'Dose Decreased' }
  ];

  const patientSelectOptions = [
    { value: '', label: '-- Choose a Patient --' },
    ...patients.map((p) => ({ value: p.id, label: `${p.name} (ID: #${p.id})` }))
  ];

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-txt-primary">Patient Readmission Prediction</h1>
        <p className="text-[14px] text-txt-muted mt-1">Run a new hospital readmission risk prediction using the deployed Weighted Stacking Ensemble model.</p>
      </div>

      {/* Patient Selection Segment */}
      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <h3 className="text-[15px] font-bold text-txt-primary">Target Patient Selection</h3>
        
        {selectedPatient ? (
          <div className="flex items-center justify-between gap-4 bg-bg-app border border-borderColor p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info-bg text-info flex items-center justify-center font-bold text-[14px]">
                {selectedPatient.avatarInitials}
              </div>
              <div>
                <span className="text-[14px] font-bold text-txt-primary block">{selectedPatient.name}</span>
                <span className="text-[11px] text-txt-muted block">ID: #{selectedPatient.id} | Diagnosis: {selectedPatient.primaryDiagnosis}</span>
              </div>
            </div>
            
            <button 
              type="button"
              onClick={() => setSelectedPatient(null)}
              className="text-[12px] font-bold text-info hover:text-info/80 hover:underline bg-transparent border-none cursor-pointer"
            >
              Change Patient
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[12px] text-txt-muted block">Select a patient dossier to pre-fill standard variables:</span>
            <div className="max-w-md">
              <Select
                id="patient-picker"
                options={patientSelectOptions}
                value={selectedPatient?.id || ''}
                onChange={handlePatientSelectChange}
              />
            </div>
          </div>
        )}
      </div>

      {/* Clinical Input Variables Form */}
      <form onSubmit={handleRunPrediction} className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-5">
        <h3 className="text-[15px] font-bold text-txt-primary border-b border-borderColor/60 pb-2.5">Clinical Input Variables</h3>
        {formError && (
          <div className="rounded-xl border border-danger/15 bg-danger-bg/20 px-3.5 py-2 text-[12px] font-semibold text-danger">
            {formError}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-txt-muted" htmlFor="prior-inpatient">Number of Prior Inpatient Visits</label>
            <Input
              id="prior-inpatient"
              type="number"
              min={0}
              value={priorInpatient}
              onChange={(e) => setPriorInpatient(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-txt-muted" htmlFor="prior-emergency">Number of Prior Emergency Visits</label>
            <Input
              id="prior-emergency"
              type="number"
              min={0}
              value={priorEmergency}
              onChange={(e) => setPriorEmergency(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-txt-muted" htmlFor="medications">Number of Medications</label>
            <Input
              id="medications"
              type="number"
              min={1}
              value={medicationsCount}
              onChange={(e) => setMedicationsCount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-txt-muted" htmlFor="hospital-stay">Time in Hospital (days)</label>
            <Input
              id="hospital-stay"
              type="number"
              min={1}
              value={timeInHospital}
              onChange={(e) => setTimeInHospital(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-txt-muted" htmlFor="diagnoses">Number of Diagnoses</label>
            <Input
              id="diagnoses"
              type="number"
              min={1}
              value={diagnosesCount}
              onChange={(e) => setDiagnosesCount(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-txt-muted" htmlFor="a1c-result">A1C Test Result</label>
            <Select
              id="a1c-result"
              options={a1cOptions}
              value={a1cResult}
              onChange={(e) => setA1cResult(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[12px] font-bold text-txt-muted" htmlFor="insulin-usage">Insulin Dosage Changes</label>
            <Select
              id="insulin-usage"
              options={insulinOptions}
              value={insulinUsage}
              onChange={(e) => setInsulinUsage(e.target.value)}
            />
          </div>
        </div>

        {/* Submit Controller block */}
        <div className="border-t border-borderColor/60 pt-4 flex flex-col items-center gap-2 text-center">
          <Button 
            type="submit" 
            variant="primary" 
            className="w-full sm:w-auto px-10 font-bold"
            disabled={!selectedPatient || isSubmitting}
          >
            {isSubmitting ? 'Running...' : 'Run Prediction Model'}
          </Button>
          <span className="text-[11px] text-txt-muted">
            Active model: <strong>{modelSummary?.current_model?.version || 'Live model'}</strong> <span className="text-txt-muted">(threshold comes from the live prediction response)</span>
          </span>
        </div>
      </form>
    </div>
  );
}
