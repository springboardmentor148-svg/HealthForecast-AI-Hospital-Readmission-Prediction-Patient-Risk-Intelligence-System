import { useState, useEffect } from "react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import { FiTrendingUp, FiAlertTriangle, FiActivity } from "react-icons/fi";
import { getPredictionHistory } from "../services/predictionService";
import Spinner from "../components/Spinner";

function groupByMonth(predictions) {
    const groups = {};

    predictions.forEach((p) => {
        const date = new Date(p.created_at);
        const key = date.toLocaleString("default", {
            month: "short",
            year: "numeric",
        });

        if (!groups[key]) {
            groups[key] = { month: key, highRisk: 0, lowRisk: 0, sortDate: date };
        }

        if (p.result?.prediction === 1) {
            groups[key].highRisk += 1;
        } else {
            groups[key].lowRisk += 1;
        }
    });

    return Object.values(groups).sort((a, b) => a.sortDate - b.sortDate);
}

// A cleaner, more readable custom tooltip instead of Recharts' default box
function CustomTooltip({ active, payload, label }) {
    if (!active || !payload || payload.length === 0) return null;

    const highRisk = payload.find((p) => p.dataKey === "highRisk")?.value ?? 0;
    const lowRisk = payload.find((p) => p.dataKey === "lowRisk")?.value ?? 0;
    const total = highRisk + lowRisk;

    return (
        <div
            className="bg-white shadow-sm border rounded p-3"
            style={{ minWidth: "180px" }}
        >
            <p className="fw-bold mb-2">{label}</p>
            <div className="d-flex justify-content-between small mb-1">
                <span className="text-danger">● High Risk</span>
                <span className="fw-bold">{highRisk}</span>
            </div>
            <div className="d-flex justify-content-between small mb-1">
                <span className="text-success">● Low Risk</span>
                <span className="fw-bold">{lowRisk}</span>
            </div>
            <hr className="my-2" />
            <div className="d-flex justify-content-between small">
                <span className="text-muted">Total</span>
                <span className="fw-bold">{total}</span>
            </div>
        </div>
    );
}

function Trends() {
    const [chartData, setChartData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchTrends = async () => {
            try {
                const predictions = await getPredictionHistory();
                setChartData(groupByMonth(predictions));
            } catch (err) {
                setError("Failed to load trend data.");
            } finally {
                setLoading(false);
            }
        };
        fetchTrends();
    }, []);

    // Summary numbers derived from the chart data
    const totalHighRisk = chartData.reduce((sum, m) => sum + m.highRisk, 0);
    const totalLowRisk = chartData.reduce((sum, m) => sum + m.lowRisk, 0);
    const totalPredictions = totalHighRisk + totalLowRisk;
    const highRiskRate =
        totalPredictions > 0
            ? Math.round((totalHighRisk / totalPredictions) * 100)
            : 0;

    return (
        <div>
            <h3 className="mb-1">Healthcare Trends</h3>
            <p className="text-muted mb-4">
                Readmission risk predictions over time, grouped by month.
            </p>

            {loading && <Spinner text="Loading trend data..." />}
            {error && <div className="alert alert-danger">{error}</div>}

            {!loading && !error && chartData.length === 0 && (
                <div className="text-center text-muted py-5">
                    <FiTrendingUp size={40} className="mb-3 opacity-50" />
                    <p>
                        Not enough prediction history yet to show trends.
                        <br />
                        Run a few predictions across different days to see this
                        chart populate.
                    </p>
                </div>
            )}

            {!loading && chartData.length > 0 && (
                <>
                    {/* Summary cards */}
                    <div className="row mb-4">
                        <div className="col-md-4 mb-3">
                            <div className="card shadow-sm border-0 hover-lift">
                                <div className="card-body d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1">Total Predictions</p>
                                        <h3 className="mb-0">{totalPredictions}</h3>
                                    </div>
                                    <FiActivity size={26} className="text-primary opacity-75" />
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-3">
                            <div className="card shadow-sm border-0 border-start border-danger border-4 hover-lift">
                                <div className="card-body d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1">High-Risk Rate</p>
                                        <h3 className="mb-0 text-danger">{highRiskRate}%</h3>
                                    </div>
                                    <FiAlertTriangle size={26} className="text-danger opacity-75" />
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-3">
                            <div className="card shadow-sm border-0 hover-lift">
                                <div className="card-body d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1">Months Tracked</p>
                                        <h3 className="mb-0">{chartData.length}</h3>
                                    </div>
                                    <FiTrendingUp size={26} className="text-primary opacity-75" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Trend chart */}
                    <div className="card shadow-sm border-0 hover-lift">
                        <div className="card-body">
                            <h6 className="text-muted mb-3">
                                Risk Distribution by Month
                            </h6>

                            <ResponsiveContainer width="100%" height={350}>
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="highRiskGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#dc3545" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#dc3545" stopOpacity={0.03} />
                                        </linearGradient>
                                        <linearGradient id="lowRiskGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#198754" stopOpacity={0.4} />
                                            <stop offset="95%" stopColor="#198754" stopOpacity={0.03} />
                                        </linearGradient>
                                    </defs>

                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis
                                        dataKey="month"
                                        tick={{ fontSize: 13 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        allowDecimals={false}
                                        tick={{ fontSize: 13 }}
                                        axisLine={false}
                                        tickLine={false}
                                        label={{
                                            value: "Predictions",
                                            angle: -90,
                                            position: "insideLeft",
                                            style: { fontSize: 12, fill: "#888" },
                                        }}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        verticalAlign="top"
                                        height={36}
                                        iconType="circle"
                                    />

                                    <Area
                                        type="monotone"
                                        dataKey="highRisk"
                                        name="High Risk"
                                        stroke="#dc3545"
                                        strokeWidth={2.5}
                                        fill="url(#highRiskGradient)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="lowRisk"
                                        name="Low Risk"
                                        stroke="#198754"
                                        strokeWidth={2.5}
                                        fill="url(#lowRiskGradient)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default Trends;