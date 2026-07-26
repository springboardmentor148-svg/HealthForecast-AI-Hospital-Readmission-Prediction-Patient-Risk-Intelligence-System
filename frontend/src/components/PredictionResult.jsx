function PredictionResult({ result }) {
    if (!result) return null;

    const isHighRisk = result.prediction === 1;
    const rec = result.recommendations;

    return (
        <div className="card mt-4 shadow">
            <div className="card-body">

                <h3 className="card-title mb-3">
                    Prediction Result
                </h3>

                <p>
                    <strong>Risk Level : </strong>

                    <span
                        className={`badge ${
                            isHighRisk ? "bg-danger" : "bg-success"
                        }`}
                    >
                        {result.risk_level}
                    </span>
                </p>

                <p>
                    <strong>Confidence :</strong>{" "}
                    {result.confidence}%
                </p>

                <p>
                    <strong>Model :</strong>{" "}
                    {result.model}
                </p>

                <p>
                    <strong>Accuracy :</strong>{" "}
                    {result.accuracy}
                </p>

            </div>

            {rec && (
                <div className="card-body border-top">
                    <h5 className="mb-3">Clinical Decision Support</h5>
                    <p className="text-muted small">
                        Suggested talking points for care planning — not a
                        substitute for clinical judgment.
                    </p>

                    <div className="mb-3">
                        <h6 className="text-primary">🩺 Care Recommendations</h6>
                        <ul className="mb-0">
                            {rec.care_recommendations.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-3">
                        <h6 className="text-primary">📅 Follow-up Planning</h6>
                        <ul className="mb-0">
                            {rec.follow_up_planning.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div className="mb-3">
                        <h6 className="text-primary">⚠️ Risk Mitigation</h6>
                        <ul className="mb-0">
                            {rec.risk_mitigation.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h6 className="text-primary">🏠 Discharge Support</h6>
                        <ul className="mb-0">
                            {rec.discharge_support.map((item, i) => (
                                <li key={i}>{item}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}
        </div>
    );
}

export default PredictionResult;