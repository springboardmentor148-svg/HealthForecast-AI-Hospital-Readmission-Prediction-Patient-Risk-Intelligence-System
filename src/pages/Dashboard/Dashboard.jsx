import "./Dashboard.css";

import DashboardCard from "../../components/Cards/DashboardCard";
import ReadmissionChart from "../../components/Charts/ReadmissionChart";
import RiskChart from "../../components/Charts/RiskChart";
import RecentPredictionTable from "../../components/Tables/RecentPredictionTable";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import dashboardService from "../../services/dashboardService";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

import {
    FaUsers,
    FaHeartbeat,
    FaExclamationTriangle,
    FaRobot,
    FaArrowUp,
    FaFileDownload
} from "react-icons/fa";

function Dashboard() {
    const { user } = useAuth();
    const [dashboard, setDashboard] = useState({

    total_users: 0,

    total_patients: 0,

    total_predictions: 0,

    high_risk_cases: 0,

    low_risk_cases: 0

});

const navigate = useNavigate();

const [loading, setLoading] = useState(true);

useEffect(() => {

    loadDashboard();

}, []);

const loadDashboard = async () => {

    try {

        const response = await dashboardService.getDashboard();

        setDashboard(response.data);

    }

    catch (error) {

        console.error(error);

        toast.error("Unable to load dashboard.");

    }

    finally {

        setLoading(false);

    }

};

    if (loading) {

    return (

        <div className="text-center mt-5">

            <h4>Loading Dashboard...</h4>

        </div>

    );

}

    const currentHour = new Date().getHours();

    let greeting = "";

    if (currentHour < 12) {

        greeting = "🌅 Good Morning";

    }

    else if (currentHour < 17) {

        greeting = "☀️ Good Afternoon";

    }

    else {

        greeting = "🌙 Good Evening";

    }

    const handlePrediction = () => {

            navigate("/prediction");

        };

        const handleExport = () => {

            toast("PDF Export feature will be available soon.");

        };

        const handleAnalytics = () => {

            toast("Analytics module is under development.");

        };

    return (

        <div className="dashboard">

            {/* ================= Header ================= */}

            <div className="welcomeCard">

                <div className="welcomeLeft">

                    <span className="welcomeTag">

                        {greeting}

                    </span>

                    <h1>
                        Welcome, {user?.name || "User"}!
                    </h1>

                    <p>
                        Monitor patient readmission risks, predictions, and hospital analytics in one place.
                    </p>

                    <div className="quickStats">

                        <div className="miniCard">
                            <h3>{dashboard.total_patients}</h3>
                            <span>Patients</span>
                        </div>

                        <div className="miniCard">
                            <h3>{dashboard.high_risk_cases}</h3>
                            <span>High Risk</span>
                        </div>

                        <div className="miniCard">
                            <h3>{dashboard.total_predictions}</h3>
                            <span>Today's Predictions</span>
                        </div>

                    </div>

                </div>

                <div className="welcomeRight">

                    <button
                        className="primaryBtn"
                        onClick={handlePrediction}
                    >
                        + New Prediction
                    </button>

                    <button
                        className="secondaryBtn"
                        onClick={handleExport}
                    >
                        Export PDF
                    </button>

                    <button
                        className="secondaryBtn"
                        onClick={handleAnalytics}
                    >
                        Analytics
                    </button>

                </div>

            </div>

            {/* ================= Statistics ================= */}

            <div className="row g-4">

                <div className="col-xl-3 col-md-6">

                    <DashboardCard
                        title="Total Patients"
                        value={dashboard.total_patients}
                        change="Live"
                        icon={<FaUsers />}
                        color="linear-gradient(135deg,#4F7CFF,#6EA8FF)"
                    />

                </div>

                <div className="col-xl-3 col-md-6">

                    <DashboardCard
                        title="Predictions"
                        value={dashboard.total_predictions}
                        change="Live"
                        icon={<FaHeartbeat />}
                        color="linear-gradient(135deg,#22C55E,#4ADE80)"
                    />

                </div>

                <div className="col-xl-3 col-md-6">

                    <DashboardCard
                        title="High Risk"
                        value={dashboard.high_risk_cases}
                        change="Live"
                        icon={<FaExclamationTriangle />}
                        color="linear-gradient(135deg,#EF4444,#F87171)"
                    />
                </div>

                <div className="col-xl-3 col-md-6">

                    <DashboardCard
                        title="Low Risk Cases"
                        value={dashboard.low_risk_cases}
                        change="Live"
                        icon={<FaRobot />}
                        color="linear-gradient(135deg,#8B5CF6,#A78BFA)"
                    />

                </div>

            </div>

            {/* ================= Charts ================= */}

            <div className="row mt-4">

                {/* Readmission Chart */}

                <div className="col-lg-8">

                    <div className="dashboardBox">

                        <div className="chartHeader">

                            <div>

                                <h4>Monthly Readmission Trend</h4>

                                <span>Last 6 Months Performance</span>

                            </div>

                            <button className="exportBtn">

                                Export

                            </button>

                        </div>

                        <ReadmissionChart/>

                    </div>

                </div>

                {/* Risk Distribution */}

                <div className="col-lg-4">

                    <div className="dashboardBox">

                        <div className="chartHeader">

                            <div>

                                <h4>Risk Distribution</h4>

                                <span>Current Predictions</span>

                            </div>

                        </div>

                        <RiskChart/>

                        <div className="riskLegend">

                            <div>

                                <span className="dot high"></span>

                                High Risk

                            </div>

                            <div>

                                <span className="dot medium"></span>

                                Medium Risk

                            </div>

                            <div>

                                <span className="dot low"></span>

                                Low Risk

                            </div>

                        </div>

                    </div>

                </div>

            </div>

            {/* ================= AI Insights ================= */}

            <div className="row mt-4">

                <div className="col-lg-8">

                    <div className="dashboardBox">

                        <h4>AI Clinical Insights</h4>

                        <p className="text-muted mb-4">

                            Recommendations generated from the latest prediction data.

                        </p>

                        <ul className="list-group">

                            <li className="list-group-item">
                                ✔ 12 patients require follow-up within 7 days.
                            </li>

                            <li className="list-group-item">
                                ✔ Diabetes is the most common high-risk factor.
                            </li>

                            <li className="list-group-item">
                                ✔ Readmission rate has decreased by 8.5% this month.
                            </li>

                            <li className="list-group-item">
                                ✔ Average model confidence is 96.8%.
                            </li>

                        </ul>

                    </div>

                </div>

                <div className="col-lg-4">

                    <div className="dashboardBox">

                        <h4>Today's Summary</h4>

                        <hr/>

                        <p><strong>Patients:</strong> 250</p>

                        <p><strong>Predictions:</strong> 430</p>

                        <p><strong>High Risk:</strong> 85</p>

                        <p><strong>Reports:</strong> 150</p>

                        <hr/>

                        <button className="btnPrimary w-100">

                            Generate Daily Report

                        </button>

                    </div>

                </div>

            </div>

            {/* ================= Table ================= */}

            <div className="row mt-4">

                <div className="col-12">

                    <div className="dashboardBox">

                        <div className="boxHeader">

                            <h4>

                                Recent Predictions

                            </h4>

                        </div>

                        <RecentPredictionTable />

                    </div>

                </div>

            </div>

        </div>

    );

}

export default Dashboard;