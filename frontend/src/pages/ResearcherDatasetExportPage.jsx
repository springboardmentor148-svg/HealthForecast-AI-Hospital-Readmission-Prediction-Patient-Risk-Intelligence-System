import { useState } from "react";
import {
  FaDatabase,
  FaFileExport,
  FaClockRotateLeft,
  FaCircleCheck,
} from "react-icons/fa6";

// Step 1: Upar ke 4 stat cards ka data (dummy hai, baad me API se aayega)
const exportStats = [
  { label: "Available Datasets", value: "6", icon: FaDatabase },
  { label: "Exports This Month", value: "24", icon: FaFileExport },
  { label: "Last Export", value: "2 days ago", icon: FaClockRotateLeft },
  { label: "Successful Exports", value: "100%", icon: FaCircleCheck },
];

// Step 2: Available datasets ki list (jo export ki ja sakti hain)
const availableDatasets = [
  { id: "ds1", name: "Anonymized Patient Demographics", records: "18,940", format: "CSV" },
  { id: "ds2", name: "Readmission Trend Data", records: "8,210", format: "CSV" },
  { id: "ds3", name: "Treatment Effectiveness Aggregates", records: "3,102", format: "Excel" },
  { id: "ds4", name: "Population Health Statistics", records: "18,940", format: "PDF" },
];

// Step 3: Pehle ke export history ki dummy list
const exportHistory = [
  { dataset: "Readmission Trend Data", date: "24 Jul 2026", format: "CSV", status: "Completed" },
  { dataset: "Treatment Effectiveness Aggregates", date: "20 Jul 2026", format: "Excel", status: "Completed" },
  { dataset: "Anonymized Patient Demographics", date: "15 Jul 2026", format: "CSV", status: "Completed" },
];

export function ResearcherDatasetExportPage() {
  // Step 4: State — track karega konsa dataset abhi "exporting" ho raha hai
  const [exportingId, setExportingId] = useState(null);

  // Step 5: Export button click hone pe ye function chalega
  const handleExport = (datasetId) => {
    setExportingId(datasetId);

    // Abhi ke liye sirf 1.5 second ka fake loading dikhate hain.
    // Baad me yahan actual API call (backend export request) aayegi.
    setTimeout(() => {
      setExportingId(null);
    }, 1500);
  };

  return (
    <>
      {/* PAGE HEADER - page ka title aur intro (plain, hero-card sirf Overview pe) */}
      <div className="dashboard-page-header">
        <h1>Dataset Export</h1>
        <p>
          Export anonymized research datasets for offline analysis.
          Personally identifiable patient information is never included.
        </p>
      </div>

      {/* STAT CARDS - upar ke 4 number cards */}
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
                        onClick={() => handleExport(ds.id)}
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

      {/* EXPORT HISTORY - neeche ek aur table, purani exports ki */}
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