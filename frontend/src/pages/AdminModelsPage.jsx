import { useState } from "react";
import {
  FaMicrochip,
  FaChartLine,
  FaBullseye,
  FaGaugeHigh,
  FaRotate,
  FaCircleCheck,
} from "react-icons/fa6";

const modelMetrics = [
  { label: "Prediction Accuracy", value: "92.4%", icon: FaBullseye },
  { label: "Precision", value: "89.1%", icon: FaChartLine },
  { label: "Recall", value: "87.6%", icon: FaGaugeHigh },
  { label: "ROC-AUC Score", value: "0.94", icon: FaMicrochip },
];

const modelVersions = [
  {
    version: "v3.2.0",
    trainedOn: "Diabetes 130-US Hospitals Dataset",
    accuracy: "92.4%",
    status: "Deployed",
    date: "2 days ago",
  },
  {
    version: "v3.1.0",
    trainedOn: "Readmission Training Set v3",
    accuracy: "90.8%",
    status: "Archived",
    date: "3 weeks ago",
  },
  {
    version: "v3.0.0",
    trainedOn: "Diabetes 130-US Hospitals Dataset",
    accuracy: "88.2%",
    status: "Archived",
    date: "2 months ago",
  },
];

export function AdminModelsPage() {
  const [isRetraining, setIsRetraining] = useState(false);

  const handleRetrain = () => {
    setIsRetraining(true);
    setTimeout(() => setIsRetraining(false), 2000);
  };

  return (
    <>
      <section className="dashboard-page-header">
        <h1>AI Model Management</h1>
        <p>Monitor model performance, manage versions, and trigger retraining.</p>
      </section>

      <section className="dashboard-card-grid">
        {modelMetrics.map((card) => {
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

      <section className="dashboard-content-grid">
        <article className="dashboard-panel dashboard-table-panel">
          <div className="panel-header-row">
            <div>
              <h2><FaMicrochip /> Model Versions</h2>
              <p>Deployment history and training source for each model version</p>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Version</th>
                  <th>Trained On</th>
                  <th>Accuracy</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>

              <tbody>
                {modelVersions.map((model) => (
                  <tr key={model.version}>
                    <td>{model.version}</td>
                    <td>{model.trainedOn}</td>
                    <td>{model.accuracy}</td>
                    <td>
                      <span className={`risk-pill ${model.status === "Deployed" ? "low" : "high"}`}>
                        {model.status}
                      </span>
                    </td>
                    <td>{model.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>

        <aside className="dashboard-side-stack">
          <article className="dashboard-panel">
            <h2><FaRotate /> Model Training</h2>
            <p>Trigger a new training run using the latest active datasets.</p>

            <div className="dashboard-inline-actions" style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="primary-button"
                onClick={handleRetrain}
                disabled={isRetraining}
              >
                <FaRotate /> {isRetraining ? "Training..." : "Retrain Model"}
              </button>
            </div>
          </article>

          <article className="dashboard-panel">
            <h2><FaCircleCheck /> Deployment Status</h2>
            <p>
              Model v3.2.0 is currently live and serving predictions with 92.4%
              accuracy on the latest validation set.
            </p>
          </article>
        </aside>
      </section>
    </>
  );
}