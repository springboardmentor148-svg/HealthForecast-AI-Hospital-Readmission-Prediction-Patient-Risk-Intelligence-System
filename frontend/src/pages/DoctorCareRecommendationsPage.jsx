import { useEffect, useState } from "react";
import { FaWandMagicSparkles, FaCircleCheck } from "react-icons/fa6";
import {
  fetchCareRecommendations,
  generateRecommendation,
  markRecommendationReviewed,
} from "../services/careRecommendationsApi.js";

export function DoctorCareRecommendationsPage() {
  const [recommendations, setRecommendations] = useState([]);
  const [generatingId, setGeneratingId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  async function loadRecommendations() {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchCareRecommendations();
      setRecommendations(data);
    } catch (err) {
      setError(err?.message || "Failed to load care recommendations.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadRecommendations();
  }, []);

  const handleGenerate = async (patientId) => {
    setGeneratingId(patientId);
    try {
      const updated = await generateRecommendation(patientId);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === patientId ? updated : r))
      );
    } catch (err) {
      setError(err?.message || "Failed to generate recommendation.");
    } finally {
      setGeneratingId(null);
    }
  };

  const handleMarkReviewed = async (patientId) => {
    try {
      const updated = await markRecommendationReviewed(patientId);
      setRecommendations((prev) =>
        prev.map((r) => (r.id === patientId ? updated : r))
      );
    } catch (err) {
      setError(err?.message || "Failed to update status.");
    }
  };

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Care Recommendations</h1>
        <p>AI-assisted follow-up planning and discharge support for your assigned patients.</p>
      </section>

      {isLoading && <p>Loading recommendations...</p>}

      {!isLoading && error && (
        <p className="access-error" role="alert">
          {error}
        </p>
      )}

      {!isLoading && !error && (
        <section className="dashboard-side-stack">
          {recommendations.length === 0 && <p>No high-risk patients found.</p>}

          {recommendations.map((r) => (
            <article key={r.id} className="dashboard-panel">
              <div className="panel-header-row">
                <div>
                  <h2>
                    {r.name} <span style={{ opacity: 0.6, fontWeight: 400 }}>({r.id})</span>
                  </h2>
                  <p>
                    Risk Level:{" "}
                    <span className={`risk-pill ${r.riskLevel === "High" ? "high" : "low"}`}>
                      {r.riskLevel}
                    </span>
                  </p>
                </div>

                {r.status !== "Not Generated" && (
                  <span className={`risk-pill ${r.status === "Reviewed" ? "low" : "moderate"}`}>
                    {r.status}
                  </span>
                )}
              </div>

              {r.recommendation ? (
                <>
                  <p style={{ marginTop: "12px", lineHeight: 1.6 }}>{r.recommendation}</p>
                  <p style={{ marginTop: "8px", fontSize: "13.5px", opacity: 0.75 }}>
                    Suggested follow-up: <strong>{r.followUp}</strong>
                  </p>

                  <div className="dashboard-inline-actions" style={{ marginTop: "16px" }}>
                    {r.status !== "Reviewed" && (
                      <button
                        type="button"
                        className="primary-button"
                        onClick={() => handleMarkReviewed(r.id)}
                      >
                        <FaCircleCheck /> Mark as Reviewed
                      </button>
                    )}
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => handleGenerate(r.id)}
                      disabled={generatingId === r.id}
                    >
                      <FaWandMagicSparkles />
                      {generatingId === r.id ? "Regenerating..." : "Regenerate"}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ marginTop: "16px" }}>
                  <p style={{ opacity: 0.75, marginBottom: "12px" }}>
                    No recommendation generated yet for this patient.
                  </p>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => handleGenerate(r.id)}
                    disabled={generatingId === r.id}
                  >
                    <FaWandMagicSparkles />
                    {generatingId === r.id ? "Generating..." : "Generate Recommendation"}
                  </button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </>
  );
}