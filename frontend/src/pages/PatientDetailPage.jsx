import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Activity,
  Sparkles,
  CalendarRange,
  ClipboardList,
  Edit3,
  Trash2,
} from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';
import EmptyState from '../components/EmptyState';
import RiskGauge from '../components/RiskGauge';
import Badge from '../components/Badge';
import LoadingSkeleton from '../components/LoadingSkeleton';
import Button from '../components/Button';
import ConfirmDialog from '../components/ConfirmDialog';
import PatientFormModal from '../components/PatientFormModal';
import { useToast } from '../components/Toast';
import { listPatientPredictionHistory } from '../api/predictions';
import { getClinicalSupport } from '../api/clinicalSupport';
import TreatmentFormModal from '../components/TreatmentFormModal';
import { updateTreatmentRecord } from '../api/treatments';
import { triggerNotificationRefresh } from '../utils/notifications';


export default function PatientDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const {
    selectedPatient,
    setSelectedPatient,
    getPatientById,
    updatePatientRecord,
    deletePatientRecord,
  } = usePatient();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [predictionHistoryRows, setPredictionHistoryRows] = useState(null);
  const [historyError, setHistoryError] = useState('');
  const [supportData, setSupportData] = useState(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isTreatmentOpen, setIsTreatmentOpen] = useState(false);
  const [activeTreatmentToEdit, setActiveTreatmentToEdit] = useState(null);

  useEffect(() => {
    let isActive = true;

    async function loadPatient() {
      if (!id) {
        setIsLoading(false);
        setLoadError('Patient not found.');
        return;
      }

      setIsLoading(true);
      setLoadError('');

      try {
        const patient = await getPatientById(id);
        if (!isActive) return;
        setSelectedPatient(patient);
      } catch (error) {
        if (!isActive) return;
        setLoadError(error?.message || 'Unable to load patient record.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadPatient();

    return () => {
      isActive = false;
    };
  }, [getPatientById, id, setSelectedPatient, refreshTrigger]);

  useEffect(() => {
    let isActive = true;

    async function loadHistoryAndSupport() {
      if (!id) {
        setPredictionHistoryRows([]);
        setSupportData(null);
        return;
      }

      setHistoryError('');
      try {
        const [historyRes, supportRes] = await Promise.all([
          listPatientPredictionHistory(id),
          getClinicalSupport(id).catch(() => null)
        ]);
        if (!isActive) return;
        setPredictionHistoryRows(historyRes?.predictions || []);
        setSupportData(supportRes);
      } catch (error) {
        if (!isActive) return;
        setHistoryError(error?.message || 'Unable to load prediction history.');
        setPredictionHistoryRows(null);
      }
    }

    loadHistoryAndSupport();

    return () => {
      isActive = false;
    };
  }, [id, refreshTrigger]);


  if (isLoading) {
    return <LoadingSkeleton type="card" count={2} />;
  }

  if (loadError || !selectedPatient) {
    return (
      <div className="py-20 max-w-md mx-auto">
        <EmptyState
          title="No Patient Record Selected"
          description={loadError || 'Please return to the Patient Directory registry to search and select a patient file first.'}
          className="bg-surface shadow-card border border-borderColor"
        />
        <div className="text-center mt-6">
          <button
            onClick={() => navigate('/patients')}
            className="inline-flex items-center gap-2 text-[14px] font-bold text-info hover:text-info/80 hover:underline bg-transparent border-none cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go to Patient Directory</span>
          </button>
        </div>
      </div>
    );
  }

  const patient = selectedPatient;

  const recommendations = supportData?.recommendations || [];
  const medications = Array.isArray(patient.medications) ? patient.medications : [];
  const predictionHistory = Array.isArray(predictionHistoryRows)
    ? predictionHistoryRows
    : Array.isArray(patient.predictionHistory)
      ? [...patient.predictionHistory].sort((a, b) => {
          const dateA = new Date(a.prediction_date || a.date || 0).getTime();
          const dateB = new Date(b.prediction_date || b.date || 0).getTime();
          return dateB - dateA;
        })
      : [];

  const handleTreatmentSubmit = async (payload) => {
    if (!activeTreatmentToEdit?.id) return;
    try {
      await updateTreatmentRecord(activeTreatmentToEdit.id, payload);
      showToast({ message: 'Treatment updated successfully.', variant: 'success' });
      triggerNotificationRefresh();
      setRefreshTrigger(prev => prev + 1);
    } catch (error) {
      showToast({ message: error.message || 'Failed to update treatment.', variant: 'error' });
      throw error;
    }
  };

  const handleEditSubmit = async (payload) => {
    try {
      await updatePatientRecord(patient.id, payload);
      showToast({ message: 'Patient updated successfully.', variant: 'success' });
      setIsEditOpen(false);
    } catch (error) {
      showToast({ message: error?.message || 'Unable to update patient.', variant: 'error' });
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      await deletePatientRecord(patient.id);
      showToast({ message: 'Patient deleted successfully.', variant: 'success' });
      setIsDeleteOpen(false);
      navigate('/patients');
    } catch (error) {
      showToast({ message: error?.message || 'Unable to delete patient.', variant: 'error' });
      throw error;
    }
  };

  const activeTreatment = (patient?.treatments || []).find(t => t.status === 'active');

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4 pb-2 border-b border-borderColor/60">
        <button
          onClick={() => navigate('/patients')}
          className="inline-flex items-center gap-1.5 text-[13px] font-bold text-txt-muted hover:text-txt-primary transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Directory</span>
        </button>

        <div className="flex items-center gap-2">
          <Badge
            tone={patient.riskBand === 'high' ? 'danger' : patient.riskBand === 'moderate' ? 'warning' : 'success'}
            className="text-[10px] font-bold uppercase py-1 px-3"
          >
            {patient.riskBand} Risk Category
          </Badge>
          <Button variant="ghost" onClick={() => setIsEditOpen(true)} className="text-[12px] py-1.5 px-3">
            <Edit3 className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button variant="danger" onClick={() => setIsDeleteOpen(true)} className="text-[12px] py-1.5 px-3">
            <Trash2 className="w-4 h-4 mr-1" />
            Delete
          </Button>
        </div>
      </div>

      <div className="bg-surface border border-borderColor rounded-2xl p-6 shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-info-bg text-info flex items-center justify-center font-bold text-[18px] border border-info/10">
            {patient.avatarInitials}
          </div>
          <div className="space-y-1">
            <h2 className="text-[20px] font-bold text-txt-primary leading-none">{patient.name}</h2>
            <span className="text-[12px] text-txt-muted block">Patient File ID: <strong>#{patient.id}</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-2 text-[12px] font-semibold border-l-0 md:border-l border-borderColor/80 pl-0 md:pl-8 flex-1 md:flex-initial">
          <div>
            <span className="text-txt-muted block mb-0.5">Age</span>
            <span className="text-txt-primary">{patient.age} years</span>
          </div>
          <div>
            <span className="text-txt-muted block mb-0.5">Gender</span>
            <span className="text-txt-primary">{patient.gender}</span>
          </div>
          <div>
            <span className="text-txt-muted block mb-0.5">Admission Type</span>
            <span className="text-txt-primary font-mono">{patient.admissionType}</span>
          </div>
          <div>
            <span className="text-txt-muted block mb-0.5">Assigned Clinician</span>
            <span className="text-txt-primary">{patient.assignedDoctor || 'Unassigned'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-borderColor/60">
              <FileText className="w-4.5 h-4.5 text-info" />
              <h3 className="text-[15px] font-bold text-txt-primary">Clinical &amp; Medical History</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-[13px] font-semibold text-txt-primary">
              <div className="space-y-3">
                <div>
                  <span className="text-[12px] text-txt-muted block mb-1">Primary Diagnosis</span>
                  <span className="px-3 py-1.5 bg-bg-app border border-borderColor rounded-lg block font-bold">
                    {patient.primaryDiagnosis}
                  </span>
                </div>
                <div>
                  <span className="text-[12px] text-txt-muted block mb-1">Total Co-morbidities / Prior Diagnoses</span>
                  <span className="text-txt-primary block font-mono text-[14px]">
                    {patient.priorDiagnosesCount} recorded clinical diagnoses
                  </span>
                </div>
                <div>
                  <span className="text-[12px] text-txt-muted block mb-1">Inpatient Stay Length</span>
                  <span className="text-txt-primary block font-mono text-[14px]">
                    {patient.timeInHospital} days in hospital
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <span className="text-[12px] text-txt-muted block mb-1.5">Prescribed Medications</span>
                  <div className="flex flex-wrap gap-1.5">
                    {medications.map((med, idx) => (
                      <Badge key={idx} tone="info" className="text-[10px] font-bold py-1 px-2.5">
                        {med}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <span className="text-[12px] text-txt-muted block mb-1">Completed Lab Procedures</span>
                  <span className="text-txt-primary block font-mono text-[14px]">
                    {patient.labProceduresCount} lab tests executed during stay
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#EAF9F1] border border-[#D1FADF]/60 rounded-2xl p-5 shadow-card space-y-3">
            <div className="flex items-center gap-2 text-success">
              <Sparkles className="w-4.5 h-4.5" />
              <h3 className="text-[15px] font-bold">Clinical Care Recommendations</h3>
            </div>
            <ul className="space-y-2 text-[12px] text-txt-primary font-semibold leading-relaxed">
              {recommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 flex-shrink-0" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-borderColor/60">
              <CalendarRange className="w-4.5 h-4.5 text-info" />
              <h3 className="text-[15px] font-bold text-txt-primary">Recovery &amp; Discharge Plan</h3>
            </div>

            <div className="space-y-3.5 text-[13px] font-semibold">
              <div>
                <span className="text-[11px] text-txt-muted block mb-1 uppercase tracking-wider font-bold">Follow-Up Coordination</span>
                <p className="text-txt-primary bg-bg-app border border-borderColor p-3 rounded-xl">
                  {patient.followUpSchedule}
                </p>
              </div>
              <div>
                <span className="text-[11px] text-txt-muted block mb-1 uppercase tracking-wider font-bold">Discharge Directives Plan</span>
                <p className="text-txt-primary bg-bg-app border border-borderColor p-3 rounded-xl leading-relaxed">
                  {patient.dischargePlan}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-borderColor/60">
              <ClipboardList className="w-4.5 h-4.5 text-info" />
              <h3 className="text-[15px] font-bold text-txt-primary">AI Prediction Audit History</h3>
            </div>

            {historyError ? (
              <EmptyState
                title="Unable to Load Prediction History"
                description={historyError}
                className="bg-bg-app border border-borderColor"
              />
            ) : predictionHistory.length === 0 ? (
              <EmptyState
                title="No Prediction History"
                description="This patient does not have any recorded prediction history yet."
                className="bg-bg-app border border-borderColor"
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[12px] font-semibold">
                  <thead>
                    <tr className="border-b border-borderColor/80 bg-sidebar-bg text-[10px] text-txt-muted uppercase tracking-wider font-bold">
                      <th className="px-3 py-2">Prediction</th>
                      <th className="px-3 py-2">Probability</th>
                      <th className="px-3 py-2">Risk Class</th>
                      <th className="px-3 py-2">Confidence</th>
                      <th className="px-3 py-2">Threshold</th>
                      <th className="px-3 py-2">Model Version</th>
                      <th className="px-3 py-2">Timestamp</th>
                      <th className="px-3 py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderColor/60 text-txt-primary font-medium">
                    {predictionHistory.map((history, idx) => {
                      const probability = history.risk_score ?? history.probability ?? history.prob ?? 0;
                      const riskClass = history.risk_class || history.riskBand || history.risk_band || history.riskBand || patient.riskBand;
                      const confidence = history.confidence ?? '';
                      const modelVersion = history.modelLabel || history.modelVersion || history.model_version || history.model || '';
                      const predictionLabel = history.predictedLabel || history.predicted_label || 'Prediction';
                      const threshold = history.thresholdUsed ?? history.threshold_used ?? history.threshold ?? '';
                      const date = history.dateRun || history.prediction_date || history.date || '';

                      return (
                        <tr key={idx} className="hover:bg-bg-app/40 transition-colors">
                          <td className="px-3 py-2.5">
                            <div className="flex flex-col">
                              <span>{predictionLabel}</span>
                              <span className="text-[10px] text-txt-muted font-mono">ID: #{history.prediction_id || history.predictionId || '—'}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 font-mono">{probability}%</td>
                          <td className="px-3 py-2.5">
                            <Badge tone={riskClass === 'high' ? 'danger' : riskClass === 'moderate' ? 'warning' : 'success'} className="text-[8px] py-0.5 font-bold uppercase">
                              {riskClass}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 font-mono">{confidence}%</td>
                          <td className="px-3 py-2.5 font-mono">{threshold ?? '—'}</td>
                          <td className="px-3 py-2.5">{modelVersion}</td>
                          <td className="px-3 py-2.5 font-mono">{date}</td>
                          <td className="px-3 py-2.5">
                            <Button
                              variant="ghost"
                              onClick={() => navigate(`/patients/${patient.id}/predict/result?prediction_id=${history.prediction_id || history.predictionId}`)}
                              className="text-[12px] py-1 px-3 border border-borderColor rounded-xl hover:bg-bg-app font-semibold"
                              disabled={!history.prediction_id && !history.predictionId}
                            >
                              View Result
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4 flex flex-col items-center">
            <div className="w-full border-b border-borderColor/60 pb-2 flex items-center gap-2">
              <Activity className="w-4.5 h-4.5 text-info" />
              <h3 className="text-[15px] font-bold text-txt-primary">Forecasted Risk Gauge</h3>
            </div>

            <div className="w-full h-56 mt-2">
              <RiskGauge value={patient.readmissionProbability} band={patient.riskBand} />
            </div>

            <div className="bg-bg-app border border-borderColor rounded-xl p-3.5 text-[11px] text-txt-muted w-full text-center leading-relaxed">
              This score indicates the likelihood of patient readmission within a 30-day window based on ensemble variable markers.
            </div>
          </div>

          {/* Current Active Treatment Section */}
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div className="w-full border-b border-borderColor/60 pb-2 flex items-center gap-2">
              <ClipboardList className="w-4.5 h-4.5 text-info" />
              <h3 className="text-[15px] font-bold text-txt-primary">Current Active Treatment</h3>
            </div>

            {activeTreatment ? (
              <div className="space-y-4 text-[13px] font-semibold text-txt-primary">
                <div>
                  <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Protocol / Treatment Name</span>
                  <span className="block text-[13px] font-bold text-txt-primary">{activeTreatment.treatment_name}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Started</span>
                    <span className="block text-[12px] font-mono">{activeTreatment.start_date}</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Source</span>
                    <span className="block text-[12px] capitalize font-mono text-info">{activeTreatment.source?.replace('_', ' ')}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Assigned Doctor</span>
                  <span className="block text-[12px]">{activeTreatment.approved_by || patient.assigned_doctor_name || 'N/A'}</span>
                </div>

                {activeTreatment.notes && (
                  <div>
                    <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Notes</span>
                    <p className="bg-bg-app border border-borderColor p-3 rounded-xl text-[12px] font-medium leading-relaxed max-h-36 overflow-y-auto">
                      {activeTreatment.notes}
                    </p>
                  </div>
                )}

                <Button
                  onClick={() => {
                    setActiveTreatmentToEdit(activeTreatment);
                    setIsTreatmentOpen(true);
                  }}
                  variant="primary"
                  className="w-full font-bold py-2 mt-2"
                >
                  View / Update Treatment
                </Button>
              </div>
            ) : (
              <EmptyState
                title="No Active Treatment"
                description="This patient is not currently enrolled in any active treatment protocols."
                className="bg-bg-app border border-borderColor/60 py-6"
              />
            )}
          </div>

          {/* AI Treatment Outcome Forecast Section */}
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div className="w-full border-b border-borderColor/60 pb-2 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-[#7A5AF8]" />
              <h3 className="text-[15px] font-bold text-txt-primary">AI Treatment Outcome Forecast</h3>
            </div>

            {activeTreatment && activeTreatment.predicted_treatment_effectiveness !== undefined && activeTreatment.predicted_treatment_effectiveness !== null ? (
              <div className="space-y-4 text-[13px] font-semibold text-txt-primary">
                <div>
                  <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Recommended Treatment (Forecast)</span>
                  <span className="block text-[13px] font-bold text-txt-primary">{activeTreatment.treatment_name}</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Predicted Effectiveness (AI Prediction)</span>
                    <span className="block text-[14px] font-bold text-success">{Number(activeTreatment.predicted_treatment_effectiveness).toFixed(1)}%</span>
                  </div>
                  <div>
                    <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Estimated Recovery (Estimated)</span>
                    <span className="block text-[14px] font-bold text-info">{Number(activeTreatment.predicted_recovery_days).toFixed(1)} days</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Expected Response (Forecast)</span>
                    <Badge tone={activeTreatment.expected_response_category === 'excellent' || activeTreatment.expected_response_category === 'good' ? 'success' : 'warning'} className="text-[10px] font-bold py-0.5 uppercase tracking-wider">
                      {activeTreatment.expected_response_category}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">AI Confidence (AI Prediction)</span>
                    <span className="block text-[13px] font-mono text-txt-primary">{Number(activeTreatment.treatment_confidence).toFixed(1)}%</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Forecast Generated At (Estimated)</span>
                  <span className="block text-[11px] font-mono text-txt-muted">
                    {activeTreatment.forecast_generated_at ? new Date(activeTreatment.forecast_generated_at).toLocaleString() : 'N/A'}
                  </span>
                </div>
              </div>
            ) : (
              <EmptyState
                title="No Forecast Available"
                description="This patient does not have an active treatment outcome forecast. Run a readmission prediction to generate one."
                className="bg-bg-app border border-borderColor/60 py-6"
              />
            )}
          </div>
        </div>
      </div>

      <PatientFormModal
        isOpen={isEditOpen}
        mode="edit"
        patient={patient}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
      />

      <TreatmentFormModal
        isOpen={isTreatmentOpen}
        treatment={activeTreatmentToEdit}
        onClose={() => {
          setIsTreatmentOpen(false);
          setActiveTreatmentToEdit(null);
        }}
        onSubmit={handleTreatmentSubmit}
      />

      <ConfirmDialog
        isOpen={isDeleteOpen}
        title="Delete Patient"
        message={`Are you sure you want to delete ${patient.name}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
