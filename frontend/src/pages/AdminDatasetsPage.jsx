import { useEffect, useState } from "react";
import {
  FaDatabase,
  FaCloudArrowUp,
  FaCircleCheck,
  FaTrash,
  FaDownload,
} from "react-icons/fa6";
import {
  fetchDatasets,
  uploadDataset,
  downloadDataset,
  removeDataset,
} from "../services/adminApi.js";

function formatTimeAgo(isoString) {
  if (!isoString) return "—";
  const then = new Date(isoString);
  const diffMs = Date.now() - then.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return `${months} month${months > 1 ? "s" : ""} ago`;
}

function formatStorage(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${bytes} B`;
}

export function AdminDatasetsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [datasetList, setDatasetList] = useState([]);
  const [totals, setTotals] = useState({ totalDatasets: 0, totalStorageBytes: 0, activeDatasets: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [uploadName, setUploadName] = useState("");
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadError, setUploadError] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  async function loadDatasets() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchDatasets();
      setDatasetList(data.datasets);
      setTotals({
        totalDatasets: data.totalDatasets,
        totalStorageBytes: data.totalStorageBytes,
        activeDatasets: data.activeDatasets,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadDatasets();
  }, []);

  const storageStats = [
    { label: "Total Datasets", value: String(totals.totalDatasets), icon: FaDatabase },
    { label: "Total Storage Used", value: formatStorage(totals.totalStorageBytes), icon: FaCloudArrowUp },
    { label: "Active Datasets", value: String(totals.activeDatasets), icon: FaCircleCheck },
  ];

  const handleDownload = async (dataset) => {
    try {
      await downloadDataset(dataset.id, dataset.name);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemove = async (id) => {
    try {
      await removeDataset(id);
      loadDatasets();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadName.trim() || !uploadFile) {
      setUploadError("Please provide a name and choose a file.");
      return;
    }

    setIsUploading(true);
    setUploadError("");

    try {
      await uploadDataset({ name: uploadName, notes: uploadNotes, file: uploadFile });
      setUploadName("");
      setUploadNotes("");
      setUploadFile(null);
      setShowUploadModal(false);
      loadDatasets();
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Dataset Management</h1>
        <p>Upload, review, and manage the datasets powering HealthForecastAI's models.</p>
      </section>

      <section className="dashboard-card-grid">
        {storageStats.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="dashboard-metric-card">
              <div className="metric-icon">
                <Icon />
              </div>
              <span>{card.label}</span>
              <strong>{loading ? "…" : card.value}</strong>
            </article>
          );
        })}
      </section>

      <article className="dashboard-panel">
        <div className="panel-header-row">
          <div>
            <h2><FaDatabase /> Datasets</h2>
            <p>All datasets available for training and analytics</p>
          </div>

          <div className="dashboard-inline-actions">
            <button
              type="button"
              className="primary-button"
              onClick={() => setShowUploadModal(true)}
            >
              <FaCloudArrowUp /> Upload Dataset
            </button>
          </div>
        </div>

        <div className="dashboard-table-wrap">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Dataset Name</th>
                <th>Records</th>
                <th>Size</th>
                <th>Status</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="dashboard-table-empty">Loading datasets...</td>
                </tr>
              )}

              {!loading && error && (
                <tr>
                  <td colSpan={6} className="dashboard-table-empty">{error}</td>
                </tr>
              )}

              {!loading && !error && datasetList.map((dataset) => (
                <tr key={dataset.id}>
                  <td>{dataset.name}</td>
                  <td>{dataset.records.toLocaleString()}</td>
                  <td>{dataset.sizeLabel}</td>
                  <td>
                    <span
                      className={`risk-pill ${
                        dataset.status === "Active"
                          ? "low"
                          : dataset.status === "Processing"
                          ? "moderate"
                          : "high"
                      }`}
                    >
                      {dataset.status}
                    </span>
                  </td>
                  <td>{formatTimeAgo(dataset.lastUpdated)}</td>
                  <td>
                    <div className="dashboard-inline-actions">
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Download dataset"
                        onClick={() => handleDownload(dataset)}
                      >
                        <FaDownload />
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        aria-label="Remove dataset"
                        onClick={() => handleRemove(dataset.id)}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {!loading && !error && datasetList.length === 0 && (
                <tr>
                  <td colSpan={6} className="dashboard-table-empty">
                    No datasets available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </article>

      {showUploadModal && (
        <div className="modal-backdrop" onClick={() => setShowUploadModal(false)}>
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header-row">
              <h3 id="upload-title">Upload Dataset</h3>
            </div>

            <form className="modal-form" onSubmit={handleUploadSubmit}>
              <label className="modal-field">
                <span>Dataset Name</span>
                <input
                  type="text"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  placeholder="e.g. Readmission Training Set v4"
                  required
                />
              </label>

              <label className="modal-field">
                <span>File</span>
                <input
                  type="file"
                  accept=".csv,.json"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  required
                />
              </label>

              <label className="modal-field">
                <span>Notes</span>
                <input
                  type="text"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  placeholder="Optional description"
                />
              </label>

              {uploadError && <p className="dashboard-table-empty">{uploadError}</p>}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isUploading}>
                  <FaCloudArrowUp /> {isUploading ? "Uploading..." : "Upload"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}