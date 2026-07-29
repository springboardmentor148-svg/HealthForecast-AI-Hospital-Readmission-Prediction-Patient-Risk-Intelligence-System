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

export default function ClinicalSupportPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { selectedPatient, setSelectedPatient, patients, getPatientById } = usePatient();
  const { currentRole } = useAuth();
  const [isApproved, setIsApproved] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

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
          setIsApproved(false);
          setIsSaved(false);
          navigate(`/clinical-support?id=${selectedId}`);
        })
        .catch(() => {});
    }
  };

  const handleApprove = () => {
    setIsApproved(true);
    setTimeout(() => setIsApproved(false), 3000);
  };

  const handleSaveDraft = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const isResearcher = currentRole === ROLES.RESEARCHER;

  // Resolve active patient details with anonymization filter for Researcher
  const activePatient = selectedPatient ? {
    ...selectedPatient,
    name: isResearcher ? 'Anonymized Patient #####' : selectedPatient.name,
    id: isResearcher ? '#####' : selectedPatient.id,
    avatarInitials: isResearcher ? 'AP' : selectedPatient.avatarInitials
  } : null;

  // 2. Resolve risk-tiered care recommendations
  const getRecommendations = (patient) => {
    if (!patient) return [];
    if (patient.riskBand === 'high') {
      return [
        `Initiate priority clinical case management for ${patient.primaryDiagnosis} readmission mitigation.`,
        'Perform complete review of active glycemic agents and insulin sliding scales.',
        'Schedule home health nurse evaluations and post-discharge clinic scheduling within 3 days.'
      ];
    } else if (patient.riskBand === 'moderate') {
      return [
        'Recommend standard outpatient clinic glycemic checks and review glucose self-monitoring logs.',
        'Arrange dietitian nutrition management consultation.',
        'Provide educational materials concerning hyperglycemia identification.'
      ];
    } else {
      return [
        'Provide general lifestyle counseling and routine primary care follow-up.',
        'Instruct patient on baseline oral medications adherence checkups.'
      ];
    }
  };

  // 3. Resolve Structured Follow-up Planning details
  const getFollowUpPlanning = (patient) => {
    if (!patient) return [];
    if (patient.riskBand === 'high') {
      return [
        { type: 'Endocrinology Clinic', timeframe: 'Within 3 days', priority: 'high', notes: 'Urgent glycemic check' },
        { type: 'Primary Care Outpatient', timeframe: 'Within 7 days', priority: 'moderate', notes: 'Overall care transition evaluation' },
        { type: 'Home Nurse Evaluation', timeframe: 'Within 48 hours', priority: 'high', notes: 'Insulin injection compliance' }
      ];
    } else if (patient.riskBand === 'moderate') {
      return [
        { type: 'Endocrinology Outpatient', timeframe: 'Within 7 days', priority: 'moderate', notes: 'HbA1c optimization plan' },
        { type: 'Dietary & Nutrition Consult', timeframe: 'Within 14 days', priority: 'low', notes: 'Weight and carb intake counseling' }
      ];
    } else {
      return [
        { type: 'Primary Care Outpatient', timeframe: 'Within 30 days', priority: 'low', notes: 'Routine glycemic index tracking' }
      ];
    }
  };

  // 4. Resolve Risk Mitigation suggestions
  const getMitigationSuggestions = (patient) => {
    if (!patient) return [];
    const medsCount = patient.medications ? patient.medications.length : 3;
    const stayDays = patient.timeInHospital || 4;
    
    const suggestions = [
      {
        title: 'Schedule Glycemic Logs Check-in',
        rationale: 'Elevated A1C indicates sub-optimal glycemic control. Monitor daily pre-meal readings.'
      }
    ];

    if (medsCount >= 4) {
      suggestions.push({
        title: `Consolidate Medication Load (${medsCount} active drugs)`,
        rationale: 'High polypharmacy indices are strongly correlated with patient compliance errors and readmission risks.'
      });
    }

    if (stayDays > 5) {
      suggestions.push({
        title: 'Review Functional Status Post-Discharge',
        rationale: `Extended stay of ${stayDays} days elevates clinical deconditioning risk. Assess physical therapy support options.`
      });
    }

    // Default fallback mitigation
    if (suggestions.length < 3) {
      suggestions.push({
        title: 'Patient Medication Reconciliation',
        rationale: 'Review patient understanding of discharge prescriptions to minimize post-discharge errors.'
      });
    }

    return suggestions;
  };

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

  const recommendationsList = getRecommendations(activePatient);
  const followUpRows = getFollowUpPlanning(activePatient);
  const mitigationList = getMitigationSuggestions(activePatient);

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
                  {activePatient.riskBand === 'high' ? (
                    'Configure direct warm handoff to endocrine care coordinators. Schedule home nurse post-discharge insulin technique check within 48 hours.'
                  ) : (
                    'Arrange primary care outpatient clinic follow-up within 10-14 days. Review home blood glucose monitoring records during checkup.'
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[12px] font-bold text-txt-muted block uppercase tracking-wider">
                  Clinical Care Directives
                </span>
                <div className="bg-bg-app border border-borderColor p-4 rounded-xl text-[13px] text-txt-primary font-semibold leading-relaxed">
                  {activePatient.riskBand === 'high' ? (
                    'Patient instructed on glucose monitoring twice daily. Inpatient sliding scale insulin discontinued; transition to basal-bolus home regimen.'
                  ) : (
                    'Resume home baseline oral diabetes agents. Instruct patient on warning flags of hypo/hyperglycemia.'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Gated Action Buttons Panel */}
          <div className="bg-surface border border-borderColor rounded-2xl p-4 shadow-card flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Button
                onClick={handleApprove}
                disabled={isApproved || isResearcher}
                variant="primary"
                className="font-bold px-6 py-2"
              >
                {isApproved ? (
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-success-bg" /> Approved
                  </span>
                ) : (
                  'Approve Recommendations Plan'
                )}
              </Button>

              <Button
                onClick={handleSaveDraft}
                disabled={isSaved || isResearcher}
                variant="ghost"
                className="font-bold border border-borderColor hover:bg-bg-app"
              >
                {isSaved ? 'Draft Saved' : 'Save Draft Plan'}
              </Button>
            </div>

            {isResearcher && (
              <span className="text-[11px] text-danger font-semibold flex items-center gap-1">
                <ShieldAlert className="w-4 h-4" />
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
