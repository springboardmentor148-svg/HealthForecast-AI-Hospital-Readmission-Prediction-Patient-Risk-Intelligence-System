import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Upload, AlertCircle, CheckCircle, HelpCircle, X, Download } from 'lucide-react';
import { validateImportPatients, importPatients } from '../api/patients';
import Button from './Button';

export default function PatientImportModal({ isOpen, onClose, onImportSuccess }) {
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'importing', 'summary'
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Stats from backend validation/import
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep('upload');
      setFile(null);
      setLoading(false);
      setError('');
      setStats(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e) => {
    setError('');
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        setError('Only CSV files are allowed.');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUploadAndValidate = async () => {
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await validateImportPatients(file);
      if (res.success === false) {
        setError(res.error || 'Failed to parse CSV file.');
      } else {
        setStats(res);
        setStep('preview');
      }
    } catch (err) {
      setError(err?.message || 'Server error occurred during validation.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    setStep('importing');
    setLoading(true);
    setError('');
    try {
      const res = await importPatients(file);
      if (res.success === false) {
        setError(res.error || 'Failed to import CSV file.');
        setStep('preview');
      } else {
        setStats(res);
        setStep('summary');
        if (onImportSuccess) {
          onImportSuccess();
        }
      }
    } catch (err) {
      setError(err?.message || 'Server error occurred during import.');
      setStep('preview');
    } finally {
      setLoading(false);
    }
  };

  const downloadErrorReport = () => {
    if (!stats?.errors?.length) return;
    
    const headers = ['Row Number', 'Error Reason'];
    const rows = stats.errors.map((err) => [err.row, err.reason]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `import_errors_${file?.name || 'report'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderContent = () => {
    if (loading && step === 'upload') {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <svg className="animate-spin h-8 w-8 text-info" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[13px] font-bold text-txt-primary">Uploading and validating CSV file...</span>
        </div>
      );
    }

    if (loading && step === 'importing') {
      return (
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <svg className="animate-spin h-8 w-8 text-info" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-[13px] font-bold text-txt-primary">Importing patients into database...</span>
        </div>
      );
    }

    switch (step) {
      case 'upload':
        return (
          <div className="space-y-4">
            <div className="text-center">
              <h3 className="text-[15px] font-bold text-txt-primary">Import Patient Directory CSV</h3>
              <p className="text-[11px] font-semibold text-txt-muted mt-1">
                Upload a CSV matching the HealthForecast Patient Import Template.
              </p>
            </div>

            <div className="border border-dashed border-borderColor rounded-xl p-6 text-center hover:bg-bg-app/40 transition cursor-pointer relative">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="p-2 bg-info-bg text-info rounded-xl">
                  <Upload className="w-6 h-6" />
                </div>
                {file ? (
                  <div>
                    <span className="text-[12px] font-bold text-txt-primary block truncate max-w-xs mx-auto">
                      {file.name}
                    </span>
                    <span className="text-[10px] text-txt-muted font-mono block">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                ) : (
                  <div>
                    <span className="text-[12px] font-bold text-txt-primary block">
                      Select or drag & drop CSV file
                    </span>
                    <span className="text-[10px] text-txt-muted block mt-0.5">
                      Only .csv files up to 10MB
                    </span>
                  </div>
                )}
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-danger-bg/20 border border-danger/20 rounded-xl p-3 text-[11px] font-bold text-danger">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="ghost" onClick={onClose} className="rounded-xl px-4 py-2 text-[12px] font-bold">
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleUploadAndValidate}
                disabled={!file}
                className="rounded-xl px-4 py-2 text-[12px] font-bold"
              >
                Validate CSV
              </Button>
            </div>
          </div>
        );

      case 'preview':
        return (
          <div className="space-y-4 max-h-[85vh] overflow-y-auto pr-1">
            <div>
              <h3 className="text-[15px] font-bold text-txt-primary">Import Preview Summary</h3>
              <p className="text-[11px] font-semibold text-txt-muted mt-0.5">
                Review row validation before confirming database writes.
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-2.5">
              <div className="bg-bg-app/50 border border-borderColor/60 rounded-xl p-2.5 text-center">
                <span className="text-[10px] font-bold text-txt-muted block uppercase tracking-wider">Total Rows</span>
                <span className="text-[18px] font-black text-txt-primary mt-0.5 block">{stats?.total_rows}</span>
              </div>
              <div className="bg-success-bg/15 border border-success/15 rounded-xl p-2.5 text-center">
                <span className="text-[10px] font-bold text-success block uppercase tracking-wider">Valid Rows</span>
                <span className="text-[18px] font-black text-success mt-0.5 block">{stats?.valid_rows_count}</span>
              </div>
              <div className="bg-info-bg/15 border border-info/15 rounded-xl p-2.5 text-center">
                <span className="text-[10px] font-bold text-info block uppercase tracking-wider">Duplicates</span>
                <span className="text-[18px] font-black text-info mt-0.5 block">{stats?.duplicate_rows_count}</span>
              </div>
              <div className="bg-danger-bg/15 border border-danger/15 rounded-xl p-2.5 text-center">
                <span className="text-[10px] font-bold text-danger block uppercase tracking-wider">Invalid Rows</span>
                <span className="text-[18px] font-black text-danger mt-0.5 block">{stats?.invalid_rows_count}</span>
              </div>
            </div>

            {/* Preview Rows Table */}
            {stats?.preview_rows?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-txt-primary uppercase tracking-wider pl-0.5">
                  Preview (First 5 valid rows)
                </span>
                <div className="border border-borderColor rounded-xl overflow-hidden overflow-x-auto">
                  <table className="min-w-full divide-y divide-borderColor/60 text-[11px] text-left">
                    <thead className="bg-bg-app/40 font-bold text-txt-muted uppercase tracking-wider">
                      <tr>
                        <th className="px-3 py-2 border-b border-borderColor/60">ID</th>
                        <th className="px-3 py-2 border-b border-borderColor/60">Name</th>
                        <th className="px-3 py-2 border-b border-borderColor/60">Gender</th>
                        <th className="px-3 py-2 border-b border-borderColor/60">Age</th>
                        <th className="px-3 py-2 border-b border-borderColor/60">Admission</th>
                        <th className="px-3 py-2 border-b border-borderColor/60">Diagnosis</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderColor/40 font-semibold text-txt-primary">
                      {stats.preview_rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-bg-app/20">
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.patient_identifier}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.name}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap capitalize">{row.gender}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap">{row.age}</td>
                          <td className="px-3 py-1.5 whitespace-nowrap capitalize">{row.admission_type}</td>
                          <td className="px-3 py-1.5 truncate max-w-[120px]">{row.primary_diagnosis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Validation Errors scroll box */}
            {stats?.validation_errors?.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-danger uppercase tracking-wider pl-0.5">
                  Validation Failures ({stats.validation_errors.length})
                </span>
                <div className="border border-danger/15 bg-danger-bg/5 rounded-xl p-3 max-h-[140px] overflow-y-auto space-y-2 text-[11px]">
                  {stats.validation_errors.map((err, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 font-bold text-danger leading-relaxed">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                      <span>Row {err.row}: {err.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              {stats?.validation_errors?.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={downloadErrorReport}
                  className="rounded-xl px-3 py-1.5 text-[11px] font-bold border border-borderColor hover:bg-bg-app flex items-center gap-1 text-danger"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Error Report</span>
                </Button>
              )}
              <div className="flex gap-2.5 ml-auto">
                <Button variant="ghost" onClick={() => setStep('upload')} className="rounded-xl px-4 py-2 text-[12px] font-bold">
                  Back
                </Button>
                <Button
                  variant="primary"
                  onClick={handleConfirmImport}
                  disabled={stats?.valid_rows_count === 0}
                  className="rounded-xl px-4 py-2 text-[12px] font-bold"
                >
                  Confirm Import ({stats?.valid_rows_count} Rows)
                </Button>
              </div>
            </div>
          </div>
        );

      case 'summary':
        return (
          <div className="space-y-4 text-center py-2">
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="p-3 bg-success-bg/25 text-success rounded-full">
                <CheckCircle className="w-10 h-10" />
              </div>
              <h3 className="text-[16px] font-bold text-txt-primary">Import Complete</h3>
              <p className="text-[11px] font-semibold text-txt-muted max-w-xs">
                Patient records have been successfully parsed and committed.
              </p>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto text-left text-[12px] font-semibold text-txt-primary pt-2">
              <div className="flex justify-between border-b border-borderColor/40 pb-2">
                <span className="text-txt-muted">Total Processed:</span>
                <span className="font-mono font-bold">{stats?.total_rows}</span>
              </div>
              <div className="flex justify-between border-b border-borderColor/40 pb-2">
                <span className="text-txt-muted">Imported:</span>
                <span className="font-mono font-bold text-success">{stats?.imported}</span>
              </div>
              <div className="flex justify-between border-b border-borderColor/40 pb-2">
                <span className="text-txt-muted">Duplicates Skipped:</span>
                <span className="font-mono font-bold text-info">{stats?.skipped}</span>
              </div>
              <div className="flex justify-between border-b border-borderColor/40 pb-2">
                <span className="text-txt-muted">Failed Insertion:</span>
                <span className="font-mono font-bold text-danger">{stats?.failed}</span>
              </div>
            </div>

            <div className="flex justify-center gap-3 pt-4">
              {stats?.errors?.length > 0 && (
                <Button
                  variant="ghost"
                  onClick={downloadErrorReport}
                  className="rounded-xl px-4 py-2 text-[12px] font-bold border border-borderColor hover:bg-bg-app flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Error Report</span>
                </Button>
              )}
              <Button variant="primary" onClick={onClose} className="rounded-xl px-6 py-2 text-[12px] font-bold">
                Done
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={() => {
        if (!loading) onClose();
      }}
    >
      <div 
        className="bg-surface border border-borderColor rounded-2xl max-w-xl w-full p-6 shadow-xl relative text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 text-txt-muted hover:text-txt-primary transition disabled:opacity-30 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {renderContent()}
      </div>
    </div>
  );
}

PatientImportModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onImportSuccess: PropTypes.func,
};
