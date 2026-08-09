import { useEffect, useState } from "react";
import {
  FaDatabase,
  FaFileExport,
  FaClockRotateLeft,
  FaCircleCheck,
} from "react-icons/fa6";
import { fetchDatasets, fetchExportHistory, exportDataset } from "../services/researchApi";

export function ResearcherDatasetExportPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [stats, setStats] = useState(null);
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [exportHistory, setExportHistory] = useState([]);

  const [exportingId, setExportingId] = useState(null);

  const loadData = () => {
    setLoading(true);
    setError("");
    Promise.all([fetchDatasets(), fetchExportHistory()])
      .then(([datasetsRes, historyRes]) => {
        setStats(datasetsRes.stats);
        setAvailableDatasets(datasetsRes.datasets);
        setExportHistory(historyRes);
      })
      .catch(() => setError("Could not load dataset export data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleExport = async (dataset) => {
    setExportingId(dataset.id);
    try {
      await exportDataset(dataset.id, `${dataset.id}.csv`);
      // Export ho gaya — history refresh karo taaki nayi entry dikhe
      const updatedHistory = await fetchExportHistory();
      setExportHistory(updatedHistory);
    } catch (err) {
      setError("Export failed. Please try again.");
    } finally {
      setExportingId(null);
    }
  };

  if (loading) {
    return <p style={{ padding: "24px" }}>Loading dataset export data...</p>;
  }

  const exportStats = stats
    ? [
        { label: "Available Datasets", value: String(stats.availableDatasets), icon: FaDatabase },
        { label: "Exports This Month", value: String(stats.exportsThisMonth), icon: FaFileExport },
        { label: "Last Export", value: stats.lastExport, icon: FaClockRotateLeft },
        { label: "Successful Exports", value: stats.successfulExports, icon: FaCircleCheck },
      ]
    : [];

  return (
    <>
      {/* PAGE HEADER */}
      <div className="dashboard-page-header">
        <h1>Dataset Export</h1>
        <p>
          Export anonymized research datasets for offline analysis.
          Personally identifiable patient information is never included.
        </p>
      </div>

      {error && <p style={{ padding: "0 0 16px", color: "crimson" }}>{error}</p>}

      {/* STAT CARDS */}
      <section className="dashboard-card-grid">
        {exportStats.map((card) => {
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

      {/* MAIN CONTENT - available datasets table + side notice */}
      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-table-panel">
          <div className="panel-header-row">
            <div>
              <h2>Available Datasets</h2>
              <p>Select a dataset below to export it</p>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Dataset Name</th>
                  <th>Records</th>
                  <th>Format</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {availableDatasets.length === 0 && (
                  <tr>
                    <td colSpan={4}>No datasets available.</td>
                  </tr>
                )}
                {availableDatasets.map((ds) => (
                  <tr key={ds.id}>
                    <td>{ds.name}</td>
                    <td>{ds.records}</td>
                    <td>{ds.format}</td>
                    <td>
                      <button
                        type="button"
                        className="secondary-button"
                        disabled={exportingId === ds.id}
                        onClick={() => handleExport(ds)}
                      >
                        {exportingId === ds.id ? "Exporting..." : "Export"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2>Access Notice</h2>
            <p>
              All exportable datasets are fully anonymized. No patient
              names, IDs, or identifying details are included in any
              export.
            </p>
          </article>
        </aside>
      </section>

      {/* EXPORT HISTORY */}
      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-table-panel">
          <div className="panel-header-row">
            <div>
              <h2>Export History</h2>
              <p>Your recent dataset export activity</p>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Dataset</th>
                  <th>Date</th>
                  <th>Format</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {exportHistory.length === 0 && (
                  <tr>
                    <td colSpan={4}>No exports yet.</td>
                  </tr>
                )}
                {exportHistory.map((row, index) => (
                  <tr key={index}>
                    <td>{row.dataset}</td>
                    <td>{row.date}</td>
                    <td>{row.format}</td>
                    <td>
                      <span className="risk-pill low">{row.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}