import { useState, useEffect } from "react";
import { getPredictionHistory } from "../services/predictionService";

function PredictionHistory() {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const data = await getPredictionHistory();
                setHistory(data);
            } catch (err) {
                setError("Failed to load prediction history.");
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, []);

    if (loading) {
        return <div className="text-center mt-5">Loading history...</div>;
    }

    if (error) {
        return <div className="alert alert-danger">{error}</div>;
    }

    if (history.length === 0) {
        return (
            <div className="text-center text-muted mt-5">
                No predictions yet. Run a prediction to see it appear here.
            </div>
        );
    }

    return (
        <div>
            <h3 className="mb-4">Prediction History</h3>

            <div className="table-responsive">
                <table className="table table-hover align-middle bg-white shadow-sm">
                    <thead className="table-light">
                        <tr>
                            <th>Date</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Risk Level</th>
                            <th>Confidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {history.map((record, index) => (
                            <tr key={index}>
                                <td>
                                    {new Date(record.created_at).toLocaleString()}
                                </td>
                                <td>{record.patient_data?.age}</td>
                                <td>{record.patient_data?.gender}</td>
                                <td>
                                    <span
                                        className={`badge ${
                                            record.result?.prediction === 1
                                                ? "bg-danger"
                                                : "bg-success"
                                        }`}
                                    >
                                        {record.result?.risk_level}
                                    </span>
                                </td>
                                <td>{record.result?.confidence}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PredictionHistory;