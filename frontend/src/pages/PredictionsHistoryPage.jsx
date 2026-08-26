import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftRight, Database, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { usePatient } from '../contexts/PatientContext';
import Input from '../components/Input';
import Select from '../components/Select';
import Badge from '../components/Badge';
import Button from '../components/Button';
import DataTable from '../components/DataTable';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { listPredictionHistory } from '../api/predictions';
import { getModelVersions } from '../api/models';

function getInitials(name = '') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('');
}

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
  } catch (e) {
    return timestampStr;
  }
}

export default function PredictionsHistoryPage() {
  const navigate = useNavigate();
  const { setSelectedPatient, getPatientById } = usePatient();

  useEffect(() => {
    document.title = 'Prediction History | HealthForecast AI';
  }, []);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [riskLevel, setRiskLevel] = useState('all');
  const [modelVersion, setModelVersion] = useState('all');
  const [sortBy, setSortBy] = useState('prediction_date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [historyRows, setHistoryRows] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [availableVersions, setAvailableVersions] = useState([]);

  useEffect(() => {
    let isActive = true;
    async function loadVersions() {
      try {
        const versions = await getModelVersions();
        if (!isActive) return;
        setAvailableVersions(versions || []);
      } catch (error) {
        console.error('Failed to load model versions:', error);
      }
    }
    loadVersions();
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    async function loadHistory() {
      setIsLoading(true);
      setLoadError('');
      try {
        const response = await listPredictionHistory({
          search: searchQuery,
          date_from: startDate,
          date_to: endDate,
          risk_band: riskLevel === 'all' ? '' : riskLevel,
          model_version: modelVersion === 'all' ? '' : modelVersion,
          sort_by: sortBy,
          sort_order: sortOrder,
          page,
          per_page: perPage,
        });
        if (!isActive) return;
        setHistoryRows(response.predictions || []);
        setPagination(response.pagination || null);
      } catch (error) {
        if (!isActive) return;
        setLoadError(error?.message || 'Unable to load prediction history.');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    loadHistory();

    return () => {
      isActive = false;
    };
  }, [endDate, modelVersion, page, perPage, riskLevel, searchQuery, sortBy, sortOrder, startDate]);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, startDate, endDate, riskLevel, modelVersion, sortBy, sortOrder]);

  const handleViewPatient = (row) => {
    getPatientById(row.patientId)
      .then((patient) => {
        setSelectedPatient(patient);
        navigate(`/patients/${row.patientId}`);
      })
      .catch(() => {
        navigate(`/patients/${row.patientId}`);
      });
  };

  const handleViewResult = (row) => {
    if (!row.predictionId) return;
    navigate(`/patients/${row.patientId}/predict/result?prediction_id=${row.predictionId}`);
  };

  const riskOptions = [
    { value: 'all', label: 'All Risk Bands' },
    { value: 'high', label: 'High Risk (>60%)' },
    { value: 'moderate', label: 'Moderate Risk (30-60%)' },
    { value: 'low', label: 'Low Risk (<30%)' },
  ];

  const modelOptions = [
    { value: 'all', label: 'All Models' },
    ...availableVersions.map((version) => ({
      value: version,
      label: version,
    })),
  ];


  const sortOptions = [
    { value: 'prediction_date', label: 'Timestamp' },
    { value: 'risk_score', label: 'Probability' },
    { value: 'confidence', label: 'Confidence' },
    { value: 'model_version', label: 'Model Version' },
    { value: 'patient_name', label: 'Patient Name' },
  ];

  const columns = [
    {
      key: 'patient',
      label: 'Patient',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-info-bg text-info font-bold text-[12px] flex items-center justify-center border border-info/10 flex-shrink-0">
            {row.avatarInitials || getInitials(row.patientName)}
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[14px] font-semibold text-txt-primary leading-none mb-0.5">{row.patientName || 'Unknown Patient'}</span>
            <span className="text-[11px] font-medium text-txt-muted">ID: #{row.patientId}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'predictedLabel',
      label: 'Prediction',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-semibold text-txt-primary">{row.predictedLabel || 'Prediction'}</span>
          <span className="text-[11px] text-txt-muted font-mono">#{row.predictionId || '—'}</span>
        </div>
      ),
    },
    {
      key: 'probability',
      label: 'Probability',
      render: (row) => <span className="font-semibold text-txt-primary font-mono">{row.probability}%</span>,
    },
    {
      key: 'riskBand',
      label: 'Risk Band',
      render: (row) => (
        <Badge tone={row.riskBand === 'high' ? 'danger' : row.riskBand === 'moderate' ? 'warning' : 'success'} className="text-[10px] uppercase font-bold py-0.5 px-2">
          {row.riskBand}
        </Badge>
      ),
    },
    {
      key: 'dateRun',
      label: 'Date',
      render: (row) => <span className="text-[13px] text-txt-muted font-semibold">{formatTimestamp(row.dateRun)}</span>,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      render: (row) => (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => handleViewPatient(row)}
            className="text-[12px] py-1 px-3 font-semibold"
          >
            View Patient
          </Button>
          <Button
            variant="primary"
            onClick={() => handleViewResult(row)}
            className="text-[12px] py-1 px-3 font-semibold"
            disabled={!row.predictionId}
          >
            View Result
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-[20px] font-semibold text-txt-primary">Prediction History</h1>
        <p className="text-[14px] text-txt-muted mt-1">Log of all hospital readmission predictions across patients.</p>
      </div>

      {/* Filter Card */}
      <div className="bg-surface border border-borderColor rounded-2xl p-4 shadow-card space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* Search */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <label className="text-[11px] font-bold text-txt-muted" htmlFor="search-query">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-txt-muted" />
              <Input
                id="search-query"
                type="text"
                placeholder="Patient, label, or model"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 py-1 px-2.5 text-[13px]"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-1 sm:col-span-2 lg:col-span-4">
            <label className="text-[11px] font-bold text-txt-muted">Date Range</label>
            <div className="flex items-center gap-2">
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="py-1 px-2.5 text-[13px]"
              />
              <span className="text-txt-muted text-[11px] font-semibold">to</span>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="py-1 px-2.5 text-[13px]"
              />
            </div>
          </div>

          {/* Risk Band */}
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[11px] font-bold text-txt-muted" htmlFor="risk-filter">Risk Band</label>
            <Select
              id="risk-filter"
              options={riskOptions}
              value={riskLevel}
              onChange={(e) => setRiskLevel(e.target.value)}
              className="py-1 px-2 text-[13px]"
            />
          </div>

          {/* Model Version */}
          <div className="space-y-1 lg:col-span-2">
            <label className="text-[11px] font-bold text-txt-muted" htmlFor="model-filter">Model Version</label>
            <Select
              id="model-filter"
              options={modelOptions}
              value={modelVersion}
              onChange={(e) => setModelVersion(e.target.value)}
              className="py-1 px-2 text-[13px]"
            />
          </div>
        </div>

        {/* Advanced Filters Toggle */}
        <div className="pt-1 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-[12px] text-info hover:text-info/80 font-bold flex items-center gap-1 cursor-pointer bg-transparent border-none select-none transition-colors"
          >
            {showAdvanced ? (
              <>
                <span>Hide Advanced Filters</span>
                <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Show Advanced Filters</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Collapsible Advanced Filters Section */}
        {showAdvanced && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-borderColor/40 animate-fadeIn">
            {/* Sort By */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-txt-muted" htmlFor="sort-filter">Sort By</label>
              <Select
                id="sort-filter"
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="py-1 px-2 text-[13px]"
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-txt-muted">Sort Order</label>
              <Button
                variant="ghost"
                onClick={() => setSortOrder((current) => (current === 'desc' ? 'asc' : 'desc'))}
                className="w-full px-3 py-1.5 border border-borderColor rounded-xl font-bold inline-flex items-center justify-center gap-2 text-[13px] hover:bg-bg-app transition-colors"
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                <span>{sortOrder === 'desc' ? 'Descending' : 'Ascending'}</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Main Table Layer */}
      {isLoading ? (
        <LoadingSkeleton type="table" count={1} />
      ) : loadError ? (
        <EmptyState
          title="Unable to Load Prediction History"
          description={loadError}
          className="bg-surface shadow-card border border-borderColor"
        />
      ) : historyRows.length === 0 ? (
        <EmptyState
          title="No Predictions Match Selection"
          description="Try adjusting the filters or run a new prediction from a patient record."
          icon={Database}
          className="bg-surface shadow-card border border-borderColor"
        />
      ) : (
        <div className="space-y-3">
          <DataTable 
            columns={columns} 
            rows={historyRows} 
            itemsPerPage={10} 
            density="compact"
            hideFooter={true}
          />
          
          {/* Custom Server-Side Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[12px] text-txt-muted font-bold pt-1">
            <span>
              Page {pagination?.page || 1} of {pagination?.pages || 1} (Showing {historyRows.length} of {pagination?.total ?? historyRows.length} records)
            </span>
            
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={!pagination?.has_prev}
                className="px-3 py-1.5 border border-borderColor rounded-xl text-[12px] font-bold"
              >
                Previous
              </Button>
              <Button
                variant="ghost"
                onClick={() => setPage((current) => current + 1)}
                disabled={!pagination?.has_next}
                className="px-3 py-1.5 border border-borderColor rounded-xl text-[12px] font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
