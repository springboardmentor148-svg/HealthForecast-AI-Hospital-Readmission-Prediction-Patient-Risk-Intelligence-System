import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Database, Upload, Download, Play, RefreshCw, Check } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';
import { useAuth } from '../contexts/AuthContext';
import { ROLES, ROLE_PERMISSIONS, PERMISSIONS } from '../config/rbac';
import Button from '../components/Button';
import Input from '../components/Input';
import Select from '../components/Select';
import Badge from '../components/Badge';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/Toast';
import ConfirmDialog from '../components/ConfirmDialog';
import PatientFormModal from '../components/PatientFormModal';
import PatientImportModal from '../components/PatientImportModal';
import { triggerNotificationRefresh } from '../utils/notifications';
import {
  getPendingPredictionsCount,
  runPendingPredictions,
  runAllPredictions,
} from '../api/predictions';

export default function PatientsPage() {
  const navigate = useNavigate();
  const { currentRole, user, isAuthReady } = useAuth();
  const {
    patients,
    isPatientsLoading,
    patientsError,
    setSelectedPatient,
    createPatientRecord,
    updatePatientRecord,
    deletePatientRecord,
    refreshPatients,
  } = usePatient();
  const { showToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedDiagnosis, setSelectedDiagnosis] = useState('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editPatient, setEditPatient] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const hasImportPermission = currentRole === ROLES.SYSTEM_ADMIN || currentRole === ROLES.DOCTOR;

  const hasEditPermission = ROLE_PERMISSIONS[currentRole]?.includes(PERMISSIONS.EDIT_PATIENTS);

  const hasPredictionPermission = ROLE_PERMISSIONS[currentRole]?.includes(PERMISSIONS.RUN_PREDICTIONS);

  const [pendingCount, setPendingCount] = useState(0);
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [isPendingConfirmOpen, setIsPendingConfirmOpen] = useState(false);
  const [isAllConfirmOpen, setIsAllConfirmOpen] = useState(false);

  const loadPendingCount = async () => {
    if (hasPredictionPermission) {
      try {
        const count = await getPendingPredictionsCount();
        setPendingCount(count);
      } catch (err) {
        console.error('Failed to load pending predictions count:', err);
      }
    }
  };

  useEffect(() => {
    loadPendingCount();
  }, [patients, currentRole]);

  const handleRunPending = async () => {
    setIsBatchRunning(true);
    try {
      const res = await runPendingPredictions();
      setIsPendingConfirmOpen(false);
      await refreshPatients();
      triggerNotificationRefresh();
      if (res.failed > 0) {
        showToast({
          message: `Predictions completed with some failures.\nSuccessful: ${res.successful}\nFailed: ${res.failed}`,
          variant: 'warning',
        });
      } else {
        showToast({
          message: `Predictions completed successfully.\nProcessed: ${res.processed}\nSuccessful: ${res.successful}\nFailed: ${res.failed}`,
          variant: 'success',
        });
      }
    } catch (err) {
      showToast({
        message: err?.message || 'Failed to run pending predictions.',
        variant: 'error',
      });
    } finally {
      setIsBatchRunning(false);
    }
  };

  const handleRunAll = async () => {
    setIsBatchRunning(true);
    try {
      const res = await runAllPredictions();
      setIsAllConfirmOpen(false);
      await refreshPatients();
      triggerNotificationRefresh();
      if (res.failed > 0) {
        showToast({
          message: `Predictions completed with some failures.\nSuccessful: ${res.successful}\nFailed: ${res.failed}`,
          variant: 'warning',
        });
      } else {
        showToast({
          message: `Predictions completed successfully.\nProcessed: ${res.processed}\nSuccessful: ${res.successful}\nFailed: ${res.failed}`,
          variant: 'success',
        });
      }
    } catch (err) {
      showToast({
        message: err?.message || 'Failed to run all predictions.',
        variant: 'error',
      });
    } finally {
      setIsBatchRunning(false);
    }
  };

  const diagnosisOptions = [
    { value: 'all', label: 'All Diagnoses' },
    { value: 'type 1', label: 'Type 1 Diabetes' },
    { value: 'type 2', label: 'Type 2 Diabetes' },
    { value: 'ketoacidosis', label: 'Ketoacidosis' },
    { value: 'hypoglycemia', label: 'Hypoglycemia' },
    { value: 'hyperglycemia', label: 'Hyperglycemia' },
  ];

  const riskOptions = [
    { value: 'all', label: 'All Risk Bands' },
    { value: 'high', label: 'High Risk (>60%)' },
    { value: 'moderate', label: 'Moderate Risk (30-60%)' },
    { value: 'low', label: 'Low Risk (<30%)' },
  ];

  const filteredRows = patients.filter((patient) => {
    const assignedDoctorId = patient.assignedDoctorId ?? patient.assigned_doctor_id;

    if (currentRole === ROLES.DOCTOR) {
      if (!assignedDoctorId || String(assignedDoctorId) !== String(user?.id)) {
        return false;
      }
    }

    const searchable = [patient.name, patient.patientIdentifier, patient.id].join(' ').toLowerCase();
    const matchesSearch = searchable.includes(searchQuery.toLowerCase());
    const matchesRisk = selectedRisk === 'all' || patient.riskBand === selectedRisk;
    const matchesDiagnosis =
      selectedDiagnosis === 'all' ||
      (patient.primaryDiagnosis || '').toLowerCase().includes(selectedDiagnosis.toLowerCase());

    return matchesSearch && matchesRisk && matchesDiagnosis;
  });

  const displayRows = filteredRows.map((patient) => {
    if (currentRole === ROLES.RESEARCHER) {
      return {
        ...patient,
        name: 'Anonymized Patient #####',
        avatarInitials: 'AP',
      };
    }
    return patient;
  });

  const handleViewRecord = (patient) => {
    setSelectedPatient(patient);
    navigate(`/patients/${patient.id}`);
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'patient_identifier',
      'first_name',
      'last_name',
      'age_at_admission',
      'gender',
      'admission_type',
      'primary_diagnosis',
      'secondary_diagnosis',
      'time_in_hospital',
      'lab_procedures_count',
      'prior_diagnoses_count',
      'number_inpatient',
      'number_emergency',
      'number_outpatient',
      'num_procedures',
      'diag_3',
      'a1c_result',
      'max_glu_serum',
      'insulin_usage',
      'medications',
    ];
    const examples = [
      ['EMP-82014', 'John', 'Doe', '45', 'male', 'emergency', 'Type 2 Diabetes', 'Hypertension', '3', '42', '4', '2', '1', '0', '1', '401.9', '>8', '>300', 'Steady', 'Metformin,Insulin'],
      ['EMP-29481', 'Jane', 'Smith', '62', 'female', 'elective', 'Type 2 Diabetes', '', '5', '55', '6', '0', '0', '1', '0', '250.00', 'None', 'Norm', 'No', 'Insulin'],
    ];
    const csvContent = [
      headers.join(','),
      ...examples.map((row) => row.map((val) => `"${val}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'healthforecast_patient_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCreateSubmit = async (payload) => {
    try {
      await createPatientRecord(payload);
      showToast({ message: 'Patient created successfully.', variant: 'success' });
      setIsAddOpen(false);
    } catch (error) {
      showToast({ message: error?.message || 'Unable to create patient.', variant: 'error' });
      throw error;
    }
  };

  const handleEditSubmit = async (payload) => {
    try {
      if (!editPatient) return null;
      await updatePatientRecord(editPatient.id, payload);
      showToast({ message: 'Patient updated successfully.', variant: 'success' });
      setEditPatient(null);
      return null;
    } catch (error) {
      showToast({ message: error?.message || 'Unable to update patient.', variant: 'error' });
      throw error;
    }
  };

  const handleDelete = async () => {
    try {
      if (!deleteTarget) return;
      await deletePatientRecord(deleteTarget.id);
      showToast({ message: 'Patient deleted successfully.', variant: 'success' });
      setDeleteTarget(null);
    } catch (error) {
      showToast({ message: error?.message || 'Unable to delete patient.', variant: 'error' });
      throw error;
    }
  };

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-info-bg text-info font-bold text-[12px] flex items-center justify-center border border-info/10 flex-shrink-0">
            {row.avatarInitials}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-semibold text-txt-primary leading-none mb-0.5">{row.name}</span>
            {currentRole !== ROLES.RESEARCHER && (
              <span className="text-[11px] font-medium text-txt-muted">ID: #{row.id}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'age',
      label: 'Age',
      render: (row) => <span className="text-[14px] text-txt-primary">{row.age} yrs</span>,
    },
    {
      key: 'primaryDiagnosis',
      label: 'Diagnosis',
    },
    {
      key: 'probability',
      label: 'Readmission Probability',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-txt-primary font-mono">{row.readmissionProbability}%</span>
          <Badge
            tone={row.riskBand === 'high' ? 'danger' : row.riskBand === 'moderate' ? 'warning' : 'success'}
            className="text-[10px] uppercase font-bold py-0.5"
          >
            {row.riskBand}
          </Badge>
        </div>
      ),
    },
    {
      key: 'lastAdmissionDate',
      label: 'Last Admission Date',
      render: (row) => <span className="font-mono text-txt-primary">{row.lastAdmissionDate}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => handleViewRecord(row)}
            className="text-[12px] py-1 px-3 border border-borderColor rounded-xl hover:bg-bg-app font-semibold"
          >
            View
          </Button>
          {hasEditPermission && (
            <Button
              variant="ghost"
              onClick={() => setEditPatient(row)}
              className="text-[12px] py-1 px-3 border border-borderColor rounded-xl hover:bg-bg-app font-semibold"
            >
              Edit
            </Button>
          )}
          {hasEditPermission && (
            <Button
              variant="danger"
              onClick={() => setDeleteTarget(row)}
              className="text-[12px] py-1 px-3 rounded-xl font-semibold"
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  const isDoctorWithoutAssignedPatients =
    currentRole === ROLES.DOCTOR && patients.length > 0 && filteredRows.length === 0;

  if (!isAuthReady) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">Patient Directory</h1>
          <p className="text-[14px] text-txt-muted mt-1">Search and manage diabetic patient records.</p>
        </div>
        <LoadingSkeleton type="table" count={1} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">Patient Directory</h1>
          <p className="text-[14px] text-txt-muted mt-1">Search and manage diabetic patient records.</p>
        </div>
        <EmptyState
          title="Access Restricted"
          description="Please sign in to view the patients directory."
          className="bg-surface shadow-card border border-borderColor"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-[20px] font-semibold text-txt-primary">Patient Directory</h1>
          <p className="text-[14px] text-txt-muted mt-1">Search and manage diabetic patient records.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {hasImportPermission && (
            <>
              <Button
                onClick={handleDownloadTemplate}
                variant="ghost"
                className="self-start sm:self-auto font-semibold border border-borderColor hover:bg-bg-app flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Download Template</span>
              </Button>
              <Button
                onClick={() => setIsImportOpen(true)}
                variant="ghost"
                className="self-start sm:self-auto font-semibold border border-borderColor hover:bg-bg-app flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Import CSV</span>
              </Button>
            </>
          )}
          {hasPredictionPermission && (
            <>
              <Button
                onClick={() => setIsPendingConfirmOpen(true)}
                variant="ghost"
                disabled={isBatchRunning || pendingCount === 0}
                className="self-start sm:self-auto font-semibold border border-borderColor hover:bg-bg-app flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingCount > 0 ? (
                  <>
                    <Play className="w-4 h-4 text-success fill-success" />
                    <span>Run Pending Predictions ({pendingCount})</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 text-success" />
                    <span>No Pending Predictions</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setIsAllConfirmOpen(true)}
                variant="ghost"
                disabled={isBatchRunning || patients.length === 0}
                className="self-start sm:self-auto font-semibold border border-borderColor hover:bg-bg-app flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`w-4 h-4 text-info ${isBatchRunning ? 'animate-spin' : ''}`} />
                <span>Run All Predictions</span>
              </Button>
            </>
          )}
          {hasEditPermission && (
            <Button
              onClick={() => setIsAddOpen(true)}
              variant="primary"
              className="self-start sm:self-auto font-semibold"
            >
              + Add Patient
            </Button>
          )}
        </div>
      </div>

      <div className="bg-surface border border-borderColor rounded-2xl p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-txt-muted/70" />
          <Input
            type="text"
            placeholder="Search by name or file ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="w-full sm:w-44">
            <Select
              id="risk-filter"
              options={riskOptions}
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
            />
          </div>
          <div className="w-full sm:w-48">
            <Select
              id="diagnosis-filter"
              options={diagnosisOptions}
              value={selectedDiagnosis}
              onChange={(e) => setSelectedDiagnosis(e.target.value)}
            />
          </div>
        </div>
      </div>

      {isPatientsLoading ? (
        <LoadingSkeleton type="table" count={1} />
      ) : patientsError ? (
        <EmptyState
          title="Unable to Load Patients"
          description={patientsError}
          className="bg-surface shadow-card border border-borderColor"
        />
      ) : patients.length === 0 ? (
        <EmptyState
          title="Patient Directory Is Empty"
          description="No patients are currently available from the server."
          icon={Database}
          className="bg-surface shadow-card border border-borderColor"
        />
      ) : isDoctorWithoutAssignedPatients ? (
        <EmptyState
          title="No Patients Assigned to This Account"
          description="This doctor account currently has no assigned patients. Patients assigned to other clinicians remain hidden by RBAC."
          icon={Database}
          className="bg-surface shadow-card border border-borderColor"
        />
      ) : displayRows.length === 0 ? (
        <EmptyState
          title="No Patients Match Selection"
          description="Try adjusting your text search query or expanding the selection filters."
          icon={Database}
          className="bg-surface shadow-card border border-borderColor"
        />
      ) : (
        <DataTable columns={columns} rows={displayRows} itemsPerPage={10} />
      )}

      <PatientFormModal
        isOpen={isAddOpen}
        mode="create"
        patient={null}
        onClose={() => setIsAddOpen(false)}
        onSubmit={handleCreateSubmit}
      />

      <PatientFormModal
        isOpen={Boolean(editPatient)}
        mode="edit"
        patient={editPatient}
        onClose={() => setEditPatient(null)}
        onSubmit={handleEditSubmit}
      />

      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title="Delete Patient"
        message={`Are you sure you want to delete ${deleteTarget?.name || 'this patient'}? This action cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="danger"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <ConfirmDialog
        isOpen={isPendingConfirmOpen}
        title="Run Pending Predictions"
        message="Generate AI predictions for patients who do not have existing predictions? This will analyze only new or unprocessed patients."
        confirmLabel="Run Predictions"
        cancelLabel="Cancel"
        onCancel={() => setIsPendingConfirmOpen(false)}
        onConfirm={handleRunPending}
      />

      <ConfirmDialog
        isOpen={isAllConfirmOpen}
        title="Run All Predictions"
        message="Re-run AI predictions for all patients? Existing predictions will be updated and new prediction history entries will be created. This may take some time."
        confirmLabel="Run All Predictions"
        cancelLabel="Cancel"
        onCancel={() => setIsAllConfirmOpen(false)}
        onConfirm={handleRunAll}
      />

      <PatientImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={async () => {
          await refreshPatients();
          showToast({ message: 'Patient import directory refreshed successfully.', variant: 'success' });
        }}
      />
    </div>
  );
}
