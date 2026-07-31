import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import {
    FiUsers,
    FiActivity,
    FiAlertTriangle,
    FiCheckCircle,
    FiClock,
} from "react-icons/fi";
import { getPatients } from "../services/patientService";
import { getPredictionHistory } from "../services/predictionService";

function Dashboard() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const [stats, setStats] = useState({
        totalPatients: 0,
        totalPredictions: 0,
        highRisk: 0,
        lowRisk: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [patients, predictions] = await Promise.all([
                    getPatients(),
                    getPredictionHistory(),
                ]);

                const highRisk = predictions.filter(
                    (p) => p.result?.prediction === 1
                ).length;

                setStats({
                    totalPatients: patients.length,
                    totalPredictions: predictions.length,
                    highRisk,
                    lowRisk: predictions.length - highRisk,
                });
            } catch (err) {
                console.error("Failed to load dashboard stats:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const chartData = [
        { name: "High Risk", value: stats.highRisk },
        { name: "Low Risk", value: stats.lowRisk },
    ];

    const COLORS = ["#dc3545", "#198754"];

    return (
        <div>
            <h2 className="mb-1">Welcome, {user?.full_name || "Doctor"}</h2>
            <p className="text-muted mb-4">
                Hospital Readmission Prediction &amp; Patient Risk Intelligence System
            </p>

            <div className="row mb-4">
                <div className="col-md-3 mb-3">
                    <div className="card shadow-sm border-0 hover-lift">
                        <div className="card-body d-flex justify-content-between align-items-start">
                            <div>
                                <p className="text-muted mb-1">Total Patients</p>
                                <h3 className="mb-0">
                                    {loading ? "..." : stats.totalPatients}
                                </h3>
                            </div>
                            <FiUsers size={26} className="text-primary opacity-75" />
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card shadow-sm border-0 hover-lift">
                        <div className="card-body d-flex justify-content-between align-items-start">
                            <div>
                                <p className="text-muted mb-1">Total Predictions</p>
                                <h3 className="mb-0">
                                    {loading ? "..." : stats.totalPredictions}
                                </h3>
                            </div>
                            <FiActivity size={26} className="text-primary opacity-75" />
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card shadow-sm border-0 border-start border-danger border-4 hover-lift">
                        <div className="card-body d-flex justify-content-between align-items-start">
                            <div>
                                <p className="text-muted mb-1">High-Risk Predictions</p>
                                <h3 className="mb-0 text-danger">
                                    {loading ? "..." : stats.highRisk}
                                </h3>
                            </div>
                            <FiAlertTriangle size={26} className="text-danger opacity-75" />
                        </div>
                    </div>
                </div>

                <div className="col-md-3 mb-3">
                    <div className="card shadow-sm border-0 border-start border-success border-4 hover-lift">
                        <div className="card-body d-flex justify-content-between align-items-start">
                            <div>
                                <p className="text-muted mb-1">Low-Risk Predictions</p>
                                <h3 className="mb-0 text-success">
                                    {loading ? "..." : stats.lowRisk}
                                </h3>
                            </div>
                            <FiCheckCircle size={26} className="text-success opacity-75" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="row">
                <div className="col-md-5 mb-3">
                    <div className="card shadow-sm border-0 h-100 hover-lift">
                        <div className="card-body">
                            <h5 className="mb-3">Readmission Risk Distribution</h5>

                            {!loading && stats.totalPredictions === 0 && (
                                <p className="text-muted">
                                    No predictions yet — run a prediction to see this chart.
                                </p>
                            )}

                            {!loading && stats.totalPredictions > 0 && (
                                <ResponsiveContainer width="100%" height={250}>
                                    <PieChart>
                                        <Pie
                                            data={chartData}
                                            dataKey="value"
                                            nameKey="name"
                                            outerRadius={90}
                                            label
                                        >
                                            {chartData.map((entry, index) => (
                                                <Cell key={index} fill={COLORS[index]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-7 mb-3">
                    <div className="card shadow-sm border-0 h-100 hover-lift">
                        <div className="card-body">
                            <h5 className="mb-3">Quick Actions</h5>

                            <div className="d-flex flex-wrap gap-2">
                                <button
                                    className="btn btn-primary d-flex align-items-center gap-2"
                                    onClick={() => navigate("/prediction")}
                                >
                                    <FiActivity size={16} /> New Prediction
                                </button>
                                <button
                                    className="btn btn-outline-primary d-flex align-items-center gap-2"
                                    onClick={() => navigate("/prediction-history")}
                                >
                                    <FiClock size={16} /> View History
                                </button>
                                <button
                                    className="btn btn-outline-secondary d-flex align-items-center gap-2"
                                    onClick={() => navigate("/patients")}
                                >
                                    <FiUsers size={16} /> Manage Patients
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;