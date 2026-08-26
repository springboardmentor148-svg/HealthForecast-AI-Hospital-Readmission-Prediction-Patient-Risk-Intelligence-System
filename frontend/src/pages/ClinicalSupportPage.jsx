import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { ROLES } from '../config/rbac';
import { 
  Sparkles, 
  Calendar, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowLeft,
  Users
} from 'lucide-react';
import Select from '../components/Select';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { getClinicalSupport, saveClinicalSupportDraft, approveClinicalSupport } from '../api/clinicalSupport';
import { useToast } from '../components/Toast';
import { triggerNotificationRefresh } from '../utils/notifications';

export default function ClinicalSupportPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedPatient, setSelectedPatient, patients, getPatientById } = usePatient();
  const { currentRole } = useAuth();
  const { showToast } = useToast();

  const [draftNotes, setDraftNotes] = useState('');
  const [isSavedLoading, setIsSavedLoading] = useState(false);
  const [isApproveLoading, setIsApproveLoading] = useState(false);

  const [supportData, setSupportData] = useState(null);
  const [isSupportLoading, setIsSupportLoading] = useState(false);
  const [supportError, setSupportError] = useState('');


  // If id is in route path but no patient in context, prefill it
  useEffect(() => {
    if (id && (!selectedPatient || selectedPatient.id !== id)) {
      getPatientById(id).catch(() => {});
    }
  }, [getPatientById, id, selectedPatient, setSelectedPatient]);

  const handlePatientSelectChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId) {
      getPatientById(selectedId)
        .then(() => {
          setDraftNotes('');
          navigate(`/clinical-support?id=${selectedId}`);
        })
        .catch(() => {});
    }
  };

  const handleApprove = async () => {
    if (!selectedPatient) return;
    setIsApproveLoading(true);
    try {
      await approveClinicalSupport(selectedPatient.id);
      showToast({ message: 'Clinical support plan approved successfully.', variant: 'success' });
      triggerNotificationRefresh();
      const refreshed = await getClinicalSupport(selectedPatient.id);
      setSupportData(refreshed);
    } catch (err) {
      showToast({ message: err.message || 'Failed to approve recommendations plan.', variant: 'error' });
    } finally {
      setIsApproveLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedPatient) return;
    setIsSavedLoading(true);
    try {
      await saveClinicalSupportDraft(selectedPatient.id, draftNotes);
      showToast({ message: 'Clinical support plan draft saved successfully.', variant: 'success' });
      triggerNotificationRefresh();
      const refreshed = await getClinicalSupport(selectedPatient.id);
      setSupportData(refreshed);
    } catch (err) {
      showToast({ message: err.message || 'Failed to save draft plan.', variant: 'error' });
    } finally {
      setIsSavedLoading(false);
    }
  };

  const isResearcher = currentRole === ROLES.RESEARCHER;

  // Resolve active patient details with anonymization filter for Researcher
  const activePatient = selectedPatient ? {
    ...selectedPatient,
    name: isResearcher ? 'Anonymized Patient #####' : selectedPatient.name,
    id: isResearcher ? '#####' : selectedPatient.id,
    avatarInitials: isResearcher ? 'AP' : selectedPatient.avatarInitials
  } : null;

  // Fetch clinical support recommendations from API
  useEffect(() => {
    if (!selectedPatient) {
      setSupportData(null);
      setDraftNotes('');
      return;
    }
    let isActive = true;
    async function fetchSupportData() {
      setIsSupportLoading(true);
      setSupportError('');
      try {
        const res = await getClinicalSupport(selectedPatient.id);
        if (isActive) {
          setSupportData(res);
          setDraftNotes(res?.plan?.draft_notes || '');
        }
      } catch (err) {
        if (isActive) {
          setSupportError(err.message || 'Failed to fetch clinical support recommendations.');
        }
      } finally {
        if (isActive) {
          setIsSupportLoading(false);
        }
      }
    }
    fetchSupportData();
    return () => {
      isActive = false;
    };
  }, [selectedPatient]);

  // Follow-up Table columns
  const followUpColumns = [
    { key: 'type', label: 'Follow-Up Service' },
    { key: 'timeframe', label: 'Timeframe' },
    {
      key: 'priority',
      label: 'Priority Level',
      render: (row) => (
        <Badge tone={row.priority === 'high' ? 'danger' : row.priority === 'moderate' ? 'warning' : 'success'} className="text-[10px] uppercase font-bold">
          {row.priority === 'high' ? 'Urgent' : row.priority === 'moderate' ? 'Routine' : 'Optional'}
        </Badge>
      )
    },
    { key: 'notes', label: 'Clinical Directives Notes' }
  ];

  const patientSelectOptions = [
    { value: '', label: '-- Choose a Patient --' },
    ...patients.map((p) => ({ 
      value: p.id, 
      label: isResearcher ? `Anonymized Patient (ID: #${p.id})` : `${p.name} (ID: #${p.id})` 
    }))
  ];

  const recommendationsList = supportData?.recommendations || [];
  const followUpRows = supportData?.follow_up || [];
  const mitigationList = supportData?.mitigation || [];


  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div>
        <h1 className="text-[20px] font-semibold text-txt-primary">Clinical Decision Support</h1>
        <p className="text-[14px] text-txt-muted mt-1">Care recommendations, follow-up planning, and discharge guidance.</p>
      </div>

      {/* 1. Patient Selector Card */}
      <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
        <h3 className="text-[15px] font-bold text-txt-primary">Active Patient Profile</h3>
        
        {activePatient ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-bg-app border border-borderColor p-4 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-info-bg text-info flex items-center justify-center font-bold text-[14px]">
                {activePatient.avatarInitials}
              </div>
              <div>
                <span className="text-[14px] font-bold text-txt-primary block">{activePatient.name}</span>
                <span className="text-[11px] text-txt-muted block">
                  ID: #{activePatient.id} | Diagnosis: {activePatient.primaryDiagnosis} | Risk: {activePatient.riskBand.toUpperCase()}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Select
                id="change-patient-select"
                options={patientSelectOptions}
                value={selectedPatient?.id || ''}
                onChange={handlePatientSelectChange}
                className="h-9 text-[12px] min-w-48"
              />
              <Link 
                to="/patients" 
                className="text-[12px] font-bold text-info hover:text-info/80 hover:underline shrink-0"
              >
                Directory
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="text-[12px] text-txt-muted block">Select a patient profile to review guidance plans:</span>
            <div className="max-w-md">
              <Select
                id="patient-support-picker"
                options={patientSelectOptions}
                value=""
                onChange={handlePatientSelectChange}
              />
            </div>
          </div>
        )}
      </div>

      {activePatient ? (
        <div className="space-y-6">
          
          {/* 2. Care Recommendations Card (Soft Green Tint) */}
          <div className="bg-[#EAF9F1] border border-[#D1FADF]/60 rounded-2xl p-5 shadow-card space-y-3">
            <div className="flex items-center gap-1.5 text-success">
              <Sparkles className="w-4.5 h-4.5" />
              <h3 className="text-[15px] font-bold">Primary Care Recommendations</h3>
            </div>
            
            <ul className="space-y-2 text-[13px] text-txt-primary font-semibold leading-relaxed list-disc list-inside">
              {recommendationsList.map((rec, idx) => (
                <li key={idx} className="marker:text-success">
                  <span className="pl-1">{rec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Grid Layout: Planning & Mitigation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            
            {/* 3. Follow-Up Planning Table (2/3 width) */}
            <div className="lg:col-span-2 bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
              <div>
                <h3 className="text-[15px] font-semibold text-txt-primary">Clinical Follow-Up Planning</h3>
                <p className="text-[12px] text-txt-muted">Recommended follow-up clinics, scheduling timelines, and urgency levels.</p>
              </div>
              <DataTable columns={followUpColumns} rows={followUpRows} />
            </div>

            {/* 4. Risk Mitigation Suggestions (1/3 width) */}
            <div className="lg:col-span-1 bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
              <div>
                <h3 className="text-[15px] font-semibold text-txt-primary">Risk Mitigation Suggestions</h3>
                <p className="text-[12px] text-txt-muted">Targeted interventions and rationale.</p>
              </div>
              
              <ul className="space-y-3">
                {mitigationList.map((item, idx) => (
                  <li key={idx} className="bg-bg-app border border-borderColor p-3 rounded-xl space-y-1">
                    <span className="text-[12px] font-bold text-txt-primary block">{item.title}</span>
                    <span className="text-[11px] text-txt-muted block leading-relaxed">{item.rationale}</span>
                  </li>
                ))}
              </ul>
            </div>

          </div>

          {/* 5. Discharge Support Recommendations */}
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div>
              <h3 className="text-[15px] font-semibold text-txt-primary border-b border-borderColor/60 pb-2">
                Discharge Support Recommendations
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <span className="text-[12px] font-bold text-txt-muted block uppercase tracking-wider">
                  Follow-Up Coordination Directives
                </span>
                <div className="bg-bg-app border border-borderColor p-4 rounded-xl text-[13px] text-txt-primary font-semibold leading-relaxed">
                  {supportData?.coordination || 'No data available'}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[12px] font-bold text-txt-muted block uppercase tracking-wider">
                  Clinical Care Directives
                </span>
                <div className="bg-bg-app border border-borderColor p-4 rounded-xl text-[13px] text-txt-primary font-semibold leading-relaxed">
                  {supportData?.directives || 'No data available'}
                </div>
              </div>
            </div>
          </div>


          {/* AI Treatment Outcome Forecast summary */}
          {supportData?.forecast && (
            <div className="bg-[#F9F5FF] border border-[#E9D7FE] rounded-2xl p-5 shadow-card space-y-4">
              <div className="flex items-center gap-1.5 text-[#7A5AF8]">
                <Sparkles className="w-4.5 h-4.5" />
                <h3 className="text-[15px] font-bold">Treatment Outcome Forecast</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[13px] font-semibold text-txt-primary">
                <div>
                  <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Recommended Care Protocol</span>
                  <span className="block text-[12px] font-bold text-txt-primary">{supportData.forecast.treatment_name}</span>
                </div>
                <div>
                  <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Forecasted Outcome Score</span>
                  <span className="block text-[14px] font-bold text-success">{Number(supportData.forecast.predicted_treatment_effectiveness).toFixed(1)}%</span>
                </div>
                <div>
                  <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Estimated Recovery Time</span>
                  <span className="block text-[14px] font-bold text-info">{Number(supportData.forecast.predicted_recovery_days).toFixed(1)} days</span>
                </div>
                <div>
                  <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Prediction Confidence</span>
                  <span className="block text-[14px] font-bold text-[#7A5AF8]">{Number(supportData.forecast.treatment_confidence).toFixed(1)}%</span>
                </div>
              </div>
              <div>
                <span className="text-[11px] text-txt-muted block uppercase tracking-wider font-bold mb-0.5">Forecast Generated At</span>
                <span className="block text-[11px] font-mono text-txt-muted">
                  {supportData.forecast.forecast_generated_at ? new Date(supportData.forecast.forecast_generated_at).toLocaleString() : 'N/A'}
                </span>
              </div>
            </div>
          )}

          {/* 6. Clinician Draft Notes */}
          <div className="bg-surface border border-borderColor rounded-2xl p-5 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-borderColor/60 pb-2">
              <div>
                <h3 className="text-[15px] font-semibold text-txt-primary">
                  Clinician Draft Notes
                </h3>
                <p className="text-[12px] text-txt-muted mt-1">
                  Add clinical annotations, custom notes, or deconditioning alerts for this patient's support plan.
                </p>
              </div>
              {supportData?.plan?.updated_by && (
                <span className="text-[11px] text-txt-muted self-start sm:self-auto font-medium">
                  Last updated by <strong className="text-txt-primary">{supportData.plan.updated_by}</strong> on {new Date(supportData.plan.updated_at).toLocaleString()}
                </span>
              )}
            </div>
            <textarea
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
              placeholder={supportData?.plan?.is_approved ? "Plan is approved. Draft notes are locked." : "Type your clinical support plan notes here..."}
              rows={4}
              disabled={isResearcher || supportData?.plan?.is_approved}
              className="w-full bg-bg-app border border-borderColor rounded-xl p-3 text-[13px] text-txt-primary focus:outline-none focus:ring-1 focus:ring-info/50 disabled:opacity-75 disabled:cursor-not-allowed font-medium"
            />
          </div>

          {/* Gated Action Buttons Panel */}
          <div className="bg-surface border border-borderColor rounded-2xl p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {supportData?.plan?.is_approved ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                  <Badge tone="success" className="font-bold px-4 py-2 text-[12px] uppercase">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-success-bg" /> Approved
                    </span>
                  </Badge>
                  {supportData.plan.approved_by && (
                    <span className="text-[12px] text-txt-muted font-medium">
                      Approved by <strong className="text-txt-primary">{supportData.plan.approved_by}</strong> on {new Date(supportData.plan.approved_at).toLocaleString()}
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <Button
                    onClick={handleApprove}
                    disabled={isApproveLoading || isResearcher}
                    variant="primary"
                    className="font-bold px-6 py-2"
                  >
                    {isApproveLoading ? 'Approving...' : 'Approve Recommendations Plan'}
                  </Button>

                  <Button
                    onClick={handleSaveDraft}
                    disabled={isSavedLoading || isResearcher}
                    variant="ghost"
                    className="font-bold border border-borderColor hover:bg-bg-app"
                  >
                    {isSavedLoading ? 'Saving...' : 'Save Draft Plan'}
                  </Button>
                </>
              )}
            </div>

            {isResearcher && (
              <span className="text-[11px] text-danger font-semibold flex items-center gap-1">
                <ShieldAlert className="w-4.5 h-4.5" />
                Action restricted: Researchers cannot approve clinical plans.
              </span>
            )}
          </div>

        </div>
      ) : (
        <div className="bg-surface border border-borderColor border-dashed rounded-2xl p-12 text-center text-txt-muted">
          <Calendar className="w-10 h-10 mx-auto mb-3" strokeWidth={1.5} />
          <span className="text-xs font-bold text-txt-primary block">No Patient Profile Loaded</span>
          <span className="text-[11px] block mt-1">Please select an active patient dossier from the dropdown to load decision support models.</span>
        </div>
      )}
    </div>
  );
}
