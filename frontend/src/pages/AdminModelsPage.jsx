import { useEffect, useState } from "react";
import {
  FaMicrochip,
  FaChartLine,
  FaBullseye,
  FaGaugeHigh,
  FaRotate,
  FaCircleCheck,
} from "react-icons/fa6";
import { fetchModels, retrainModel } from "../services/adminApi.js";

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

export function AdminModelsPage() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRetraining, setIsRetraining] = useState(false);
  const [retrainError, setRetrainError] = useState("");

  async function loadModels() {
    setLoading(true);
    setError("");
    try {
      const data = await fetchModels();
      setOverview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModels();
  }, []);

  const modelMetrics = [
    { label: "Prediction Accuracy", value: overview ? overview.latestAccuracy : "—", icon: FaBullseye },
    { label: "Precision", value: overview ? overview.latestPrecision : "—", icon: FaChartLine },
    { label: "Recall", value: overview ? overview.latestRecall : "—", icon: FaGaugeHigh },
    { label: "ROC-AUC Score", value: overview ? overview.latestRocAuc : "—", icon: FaMicrochip },
  ];

  const modelVersions = overview ? overview.versions : [];

  const handleRetrain = async () => {
    setIsRetraining(true);
    setRetrainError("");
    try {
      await retrainModel();
      await loadModels();
    } catch (err) {
      setRetrainError(err.message);
    } finally {
      setIsRetraining(false);
    }
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
              <strong>{loading ? "…" : card.value}</strong>
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
                {loading && (
                  <tr>
                    <td colSpan={5} className="dashboard-table-empty">Loading...</td>
                  </tr>
                )}

                {!loading && error && (
                  <tr>
                    <td colSpan={5} className="dashboard-table-empty">{error}</td>
                  </tr>
                )}

                {!loading && !error && modelVersions.map((model) => (
                  <tr key={model.id}>
                    <td>{model.version}</td>
                    <td>{model.trainedOn}</td>
                    <td>{model.accuracy}</td>
                    <td>
                      <span className={`risk-pill ${model.status === "Deployed" ? "low" : "high"}`}>
                        {model.status}
                      </span>
                    </td>
                    <td>{formatTimeAgo(model.date)}</td>
                  </tr>
                ))}

                {!loading && !error && modelVersions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="dashboard-table-empty">No model versions yet. Trigger a retrain to get started.</td>
                  </tr>
                )}
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
                <FaRotate /> {isRetraining ? "Training... (may take a while)" : "Retrain Model"}
              </button>
            </div>

            {retrainError && (
              <p className="dashboard-table-empty" style={{ wordBreak: "break-word", whiteSpace: "normal" }}>
                {retrainError}
              </p>
            )}
          </article>

          <article className="dashboard-panel">
            <h2><FaCircleCheck /> Deployment Status</h2>
            <p>
              {overview && overview.deployedVersion !== "—"
                ? `Model ${overview.deployedVersion} is currently live and serving predictions with ${overview.latestAccuracy} accuracy on the latest validation set.`
                : "No model has been trained yet."}
            </p>
          </article>
        </aside>
      </section>
    </>
  );
}