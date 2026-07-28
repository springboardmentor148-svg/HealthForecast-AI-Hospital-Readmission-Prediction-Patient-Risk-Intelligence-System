import { useOutletContext } from "react-router-dom";
import { FaHospitalUser, FaArrowTrendUp, FaArrowTrendDown, FaMinus } from "react-icons/fa6";

const outcomeSummary = [
  { label: "Improved", value: "1,542", tone: "low" },
  { label: "Stable", value: "486", tone: "low" },
  { label: "Declined", value: "156", tone: "high" },
];

const patientOutcomes = [
  {
    id: "PT-10245",
    name: "Rohan Malhotra",
    department: "Cardiology",
    admitted: "12 Jul 2026",
    outcome: "Improved",
    trend: "up",
    readmissionRisk: "Low",
  },
  {
    id: "PT-10312",
    name: "Sunita Deshmukh",
    department: "Endocrinology",
    admitted: "15 Jul 2026",
    outcome: "Declined",
    trend: "down",
    readmissionRisk: "High",
  },
  {
    id: "PT-10398",
    name: "Arjun Verma",
    department: "General Surgery",
    admitted: "18 Jul 2026",
    outcome: "Stable",
    trend: "flat",
    readmissionRisk: "Moderate",
  },
  {
    id: "PT-10401",
    name: "Kavita Rao",
    department: "Cardiology",
    admitted: "20 Jul 2026",
    outcome: "Improved",
    trend: "up",
    readmissionRisk: "Low",
  },
  {
    id: "PT-10455",
    name: "Farhan Sheikh",
    department: "Endocrinology",
    admitted: "22 Jul 2026",
    outcome: "Stable",
    trend: "flat",
    readmissionRisk: "Moderate",
  },
];

const trendIcon = {
  up: FaArrowTrendUp,
  down: FaArrowTrendDown,
  flat: FaMinus,
};

const trendTone = {
  up: "low",
  down: "high",
  flat: "moderate",
};

export function HospitalAdminOutcomesPage() {
  const { user } = useOutletContext();

  const handleExport = () => {
    console.log("Export clicked");

    const headers = ["Patient ID", "Name", "Department", "Admitted", "Outcome", "Readmission Risk"];
    const rows = patientOutcomes.map((r) => [
      r.id,
      r.name,
      r.department,
      r.admitted,
      r.outcome,
      r.readmissionRisk,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "patient-outcomes.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Patient Outcomes</h1>
        <p>
          Track recovery trends, discharge outcomes, and readmission risk across
          every department in the hospital.
        </p>
      </section>

      <section className="dashboard-card-grid">
        {outcomeSummary.map((card) => (
          <article key={card.label} className="dashboard-metric-card">
            <div className="metric-icon">
              <FaHospitalUser />
            </div>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </article>
        ))}
      </section>

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-table-panel" style={{ gridColumn: "1 / -1" }}>
          <div className="panel-header-row">
            <div>
              <h2>Patient Outcome Tracking</h2>
              <p>Latest discharged and monitored patients across departments</p>
            </div>

            <div className="dashboard-inline-actions">
              <button type="button" className="secondary-button" onClick={handleExport}>
                Export
              </button>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Patient ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Admitted</th>
                  <th>Outcome</th>
                  <th>Trend</th>
                  <th>Readmission Risk</th>
                </tr>
              </thead>

              <tbody>
                {patientOutcomes.map((row) => {
                  const TrendIcon = trendIcon[row.trend];
                  return (
                    <tr key={row.id}>
                      <td>{row.id}</td>
                      <td>{row.name}</td>
                      <td>{row.department}</td>
                      <td>{row.admitted}</td>
                      <td>{row.outcome}</td>
                      <td>
                        <span className={`risk-pill ${trendTone[row.trend]}`}>
                          <TrendIcon />
                        </span>
                      </td>
                      <td>
                        <span
                          className={`risk-pill ${
                            row.readmissionRisk === "Low"
                              ? "low"
                              : row.readmissionRisk === "High"
                              ? "high"
                              : "moderate"
                          }`}
                        >
                          {row.readmissionRisk}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    </>
  );
}