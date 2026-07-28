import { useState } from "react";
import { FaClipboardCheck, FaWandMagicSparkles, FaCircleCheck } from "react-icons/fa6";

// Dummy data — assigned patients jinke liye care recommendation generate ki ja sakti hai
const initialRecommendations = [
  {
    id: "PT-1001",
    name: "A. Johnson",
    riskLevel: "High",
    recommendation:
      "Schedule follow-up within 7 days of discharge. Monitor blood glucose levels twice daily and reinforce dietary counseling.",
    followUp: "7-day follow-up",
    status: "Reviewed",
  },
  {
    id: "PT-1003",
    name: "S. Williams",
    riskLevel: "High",
    recommendation:
      "Recommend cardiac rehabilitation referral. Weekly weight monitoring to detect fluid retention early.",
    followUp: "14-day follow-up",
    status: "Pending",
  },
  {
    id: "PT-1005",
    name: "L. Chen",
    riskLevel: "High",
    recommendation: null,
    followUp: null,
    status: "Not Generated",
  },
];

export function DoctorCareRecommendationsPage() {
  const [recommendations, setRecommendations] = useState(initialRecommendations);
  const [generatingId, setGeneratingId] = useState(null);

  // Dummy "AI generate" simulation — baad me real backend call se replace hoga
  const handleGenerate = (patientId) => {
    setGeneratingId(patientId);

    setTimeout(() => {
      setRecommendations((prev) =>
        prev.map((r) =>
          r.id === patientId
            ? {
                ...r,
                recommendation:
                  "Based on recent readmission risk score, recommend close post-discharge monitoring, medication reconciliation, and a follow-up appointment within 10 days.",
                followUp: "10-day follow-up",
                status: "Pending",
              }
            : r
        )
      );
      setGeneratingId(null);
    }, 1200);
  };

  const handleMarkReviewed = (patientId) => {
    setRecommendations((prev) =>
      prev.map((r) => (r.id === patientId ? { ...r, status: "Reviewed" } : r))
    );
  };

  return (
    <>
      <section className="dashboard-page-header">
        <h1>Care Recommendations</h1>
        <p>AI-assisted follow-up planning and discharge support for your assigned patients.</p>
      </section>

      <section className="dashboard-side-stack">
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
    </>
  );
}