import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Database, Upload, Download } from 'lucide-react';
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

export default function PatientsPage() {
  const navigate = useNavigate();
  const { currentRole } = useAuth();
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

  const hasImportPermission = currentRole === ROLES.SYSTEM_ADMIN;

  const hasEditPermission = ROLE_PERMISSIONS[currentRole]?.includes(PERMISSIONS.EDIT_PATIENTS);

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
    if (currentRole === ROLES.DOCTOR && patient.assignedDoctor && patient.assignedDoctor !== 'Dr. Sarah Reed') {
      return false;
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
      'medications',
    ];
    const examples = [
      ['EMP-82014', 'John', 'Doe', '45', 'male', 'emergency', 'Type 2 Diabetes', 'Hypertension', '3', '42', '4', 'Metformin,Insulin'],
      ['EMP-29481', 'Jane', 'Smith', '62', 'female', 'elective', 'Type 2 Diabetes', '', '5', '55', '6', 'Insulin'],
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
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
