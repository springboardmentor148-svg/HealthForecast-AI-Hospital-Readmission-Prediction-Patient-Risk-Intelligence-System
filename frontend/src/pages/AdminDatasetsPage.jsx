import { useState } from "react";
import {
  FaDatabase,
  FaCloudArrowUp,
  FaCircleCheck,
  FaTriangleExclamation,
  FaTrash,
  FaDownload,
} from "react-icons/fa6";

const datasets = [
  {
    id: 1,
    name: "Diabetes 130-US Hospitals Dataset",
    records: "101,766",
    size: "18.4 MB",
    status: "Active",
    lastUpdated: "2 days ago",
  },
  {
    id: 2,
    name: "Readmission Training Set v3",
    records: "84,220",
    size: "14.1 MB",
    status: "Active",
    lastUpdated: "1 week ago",
  },
  {
    id: 3,
    name: "Treatment Effectiveness Cohort",
    records: "18,940",
    size: "3.2 MB",
    status: "Processing",
    lastUpdated: "10 min ago",
  },
  {
    id: 4,
    name: "Legacy Patient Records (2019-2021)",
    records: "42,510",
    size: "7.8 MB",
    status: "Archived",
    lastUpdated: "3 months ago",
  },
];

const storageStats = [
  { label: "Total Datasets", value: "4", icon: FaDatabase },
  { label: "Total Storage Used", value: "43.5 MB", icon: FaCloudArrowUp },
  { label: "Active Datasets", value: "2", icon: FaCircleCheck },
];

export function AdminDatasetsPage() {
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [datasetList, setDatasetList] = useState(datasets);

  const handleDownload = (dataset) => {
    const content = `Dataset: ${dataset.name}
Records: ${dataset.records}
Size: ${dataset.size}
Status: ${dataset.status}
Last Updated: ${dataset.lastUpdated}
`;

    const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${dataset.name.replace(/\s+/g, "-").toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRemove = (id) => {
    setDatasetList((prev) => prev.filter((d) => d.id !== id));
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
              <strong>{card.value}</strong>
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
              {datasetList.map((dataset) => (
                <tr key={dataset.id}>
                  <td>{dataset.name}</td>
                  <td>{dataset.records}</td>
                  <td>{dataset.size}</td>
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
                  <td>{dataset.lastUpdated}</td>
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

              {datasetList.length === 0 && (
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
        <div className="modal-backdrop">
          <div className="modal-card" role="dialog" aria-modal="true" aria-labelledby="upload-title">
            <div className="modal-header-row">
              <h3 id="upload-title">Upload Dataset</h3>
            </div>

            <form
              className="modal-form"
              onSubmit={(e) => {
                e.preventDefault();
                setShowUploadModal(false);
              }}
            >
              <label className="modal-field">
                <span>Dataset Name</span>
                <input type="text" placeholder="e.g. Readmission Training Set v4" required />
              </label>

              <label className="modal-field">
                <span>File</span>
                <input type="file" accept=".csv,.json" required />
              </label>

              <label className="modal-field">
                <span>Notes</span>
                <input type="text" placeholder="Optional description" />
              </label>

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setShowUploadModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="primary-button">
                  <FaCloudArrowUp /> Upload
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}