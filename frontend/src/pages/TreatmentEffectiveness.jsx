import { useState, useEffect } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { FiCheckCircle, FiClock, FiXCircle, FiBarChart2 } from "react-icons/fi";
import { getAllTreatments } from "../services/treatmentService";
import Spinner from "../components/Spinner";

// Groups treatments by medication and computes an effectiveness rate.
// Effectiveness = Completed / (Completed + Discontinued) * 100
// "Ongoing" treatments are excluded from the rate since their outcome
// isn't known yet — they're shown separately instead.
function analyzeTreatments(treatments) {
    const groups = {};

    treatments.forEach((t) => {
        const med = t.medication || "Unknown";

        if (!groups[med]) {
            groups[med] = { medication: med, completed: 0, ongoing: 0, discontinued: 0 };
        }

        if (t.status === "Completed") groups[med].completed += 1;
        else if (t.status === "Ongoing") groups[med].ongoing += 1;
        else if (t.status === "Discontinued") groups[med].discontinued += 1;
    });

    return Object.values(groups)
        .map((g) => {
            const resolved = g.completed + g.discontinued;
            const effectivenessRate =
                resolved > 0 ? Math.round((g.completed / resolved) * 100) : null;
            return { ...g, effectivenessRate, total: g.completed + g.ongoing + g.discontinued };
        })
        .sort((a, b) => b.total - a.total);
}

function barColor(rate) {
    if (rate === null) return "#adb5bd";
    if (rate >= 70) return "#198754";
    if (rate >= 40) return "#f0ad4e";
    return "#dc3545";
}

function TreatmentEffectiveness() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchData = async () => {
            try {
                const treatments = await getAllTreatments();
                setData(analyzeTreatments(treatments));
            } catch (err) {
                setError("Failed to load treatment data.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0);
    const totalOngoing = data.reduce((sum, d) => sum + d.ongoing, 0);
    const totalDiscontinued = data.reduce((sum, d) => sum + d.discontinued, 0);

    return (
        <div>
            <h3 className="mb-1">Treatment Effectiveness</h3>
            <p className="text-muted mb-4">
                Completion rates across medications, based on treatment
                outcomes recorded for your patients.
            </p>

            {loading && <Spinner text="Analyzing treatment data..." />}
            {error && <div className="alert alert-danger">{error}</div>}

            {!loading && !error && data.length === 0 && (
                <div className="text-center text-muted py-5">
                    <FiBarChart2 size={40} className="mb-3 opacity-50" />
                    <p>
                        No treatment records yet. Add treatments for your
                        patients to see effectiveness analysis here.
                    </p>
                </div>
            )}

            {!loading && data.length > 0 && (
                <>
                    {/* Summary cards */}
                    <div className="row mb-4">
                        <div className="col-md-4 mb-3">
                            <div className="card shadow-sm border-0 border-start border-success border-4 hover-lift">
                                <div className="card-body d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1">Completed</p>
                                        <h3 className="mb-0 text-success">{totalCompleted}</h3>
                                    </div>
                                    <FiCheckCircle size={26} className="text-success opacity-75" />
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-3">
                            <div className="card shadow-sm border-0 border-start border-primary border-4 hover-lift">
                                <div className="card-body d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1">Ongoing</p>
                                        <h3 className="mb-0 text-primary">{totalOngoing}</h3>
                                    </div>
                                    <FiClock size={26} className="text-primary opacity-75" />
                                </div>
                            </div>
                        </div>

                        <div className="col-md-4 mb-3">
                            <div className="card shadow-sm border-0 border-start border-danger border-4 hover-lift">
                                <div className="card-body d-flex justify-content-between align-items-start">
                                    <div>
                                        <p className="text-muted mb-1">Discontinued</p>
                                        <h3 className="mb-0 text-danger">{totalDiscontinued}</h3>
                                    </div>
                                    <FiXCircle size={26} className="text-danger opacity-75" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Effectiveness chart */}
                    <div className="card shadow-sm border-0 hover-lift mb-4">
                        <div className="card-body">
                            <h6 className="text-muted mb-1">
                                Effectiveness Rate by Medication
                            </h6>
                            <p className="text-muted small mb-3">
                                % of resolved treatments (Completed vs Discontinued) that
                                ended in Completed. Ongoing treatments aren't counted yet.
                            </p>

                            <ResponsiveContainer width="100%" height={Math.max(250, data.length * 45)}>
                                <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                    <XAxis type="number" domain={[0, 100]} unit="%" />
                                    <YAxis type="category" dataKey="medication" width={110} />
                                    <Tooltip
                                        formatter={(value, name, props) =>
                                            props.payload.effectivenessRate === null
                                                ? ["No resolved cases yet", "Effectiveness"]
                                                : [`${value}%`, "Effectiveness"]
                                        }
                                    />
                                    <Bar dataKey="effectivenessRate" radius={[0, 6, 6, 0]}>
                                        {data.map((entry, index) => (
                                            <Cell
                                                key={index}
                                                fill={barColor(entry.effectivenessRate)}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detail table */}
                    <div className="card shadow-sm border-0 hover-lift">
                        <div className="card-body">
                            <h6 className="text-muted mb-3">Breakdown by Medication</h6>
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead className="table-light">
                                        <tr>
                                            <th>Medication</th>
                                            <th>Completed</th>
                                            <th>Ongoing</th>
                                            <th>Discontinued</th>
                                            <th>Effectiveness</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.map((d) => (
                                            <tr key={d.medication}>
                                                <td>{d.medication}</td>
                                                <td>{d.completed}</td>
                                                <td>{d.ongoing}</td>
                                                <td>{d.discontinued}</td>
                                                <td>
                                                    {d.effectivenessRate === null ? (
                                                        <span className="text-muted small">
                                                            Not enough data
                                                        </span>
                                                    ) : (
                                                        <span
                                                            className={`badge ${
                                                                d.effectivenessRate >= 70
                                                                    ? "bg-success"
                                                                    : d.effectivenessRate >= 40
                                                                    ? "bg-warning text-dark"
                                                                    : "bg-danger"
                                                            }`}
                                                        >
                                                            {d.effectivenessRate}%
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

export default TreatmentEffectiveness;