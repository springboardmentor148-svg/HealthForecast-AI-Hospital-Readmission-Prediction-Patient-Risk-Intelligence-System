import { NavLink } from "react-router-dom";
import {
    FiHome,
    FiActivity,
    FiClock,
    FiUsers,
    FiClipboard,
    FiTrendingUp,
    FiFileText,
    FiBarChart2,
} from "react-icons/fi";
import { MdMedicalServices, MdLocalHospital } from "react-icons/md";

function Sidebar() {
    const linkClass = ({ isActive }) =>
        `nav-link sidebar-link d-flex align-items-center gap-2 text-white px-3 py-2 rounded ${
            isActive ? "bg-primary" : "text-white-50"
        }`;

    return (
        <div
            className="d-flex flex-column p-3 no-print"
            style={{
                width: "250px",
                minHeight: "100vh",
                position: "fixed",
                top: 0,
                left: 0,
                background: "linear-gradient(180deg, #1a2332 0%, #0f1620 100%)",
            }}
        >
            <h5 className="text-white mb-1">HealthForecast AI</h5>
            <p className="text-white-50 small mb-4">
                Doctor Panel
            </p>

            <nav className="nav flex-column gap-1 flex-grow-1">
                <NavLink to="/dashboard" end className={linkClass}>
                    <FiHome size={18} /> Dashboard
                </NavLink>
                <NavLink to="/prediction" className={linkClass}>
                    <FiActivity size={18} /> New Prediction
                </NavLink>
                <NavLink to="/prediction-history" className={linkClass}>
                    <FiClock size={18} /> Prediction History
                </NavLink>
                <NavLink to="/trends" className={linkClass}>
                    <FiTrendingUp size={18} /> Healthcare Trends
                </NavLink>
                <NavLink to="/patients" className={linkClass}>
                    <FiUsers size={18} /> Patients
                </NavLink>
                <NavLink to="/medical-history" className={linkClass}>
                    <FiClipboard size={18} /> Medical History
                </NavLink>
                <NavLink to="/treatment" className={linkClass}>
                    <MdMedicalServices size={18} /> Treatment
                </NavLink>
                <NavLink to="/treatment-effectiveness" className={linkClass}>
                    <FiBarChart2 size={18} /> Treatment Effectiveness
                </NavLink>
                <NavLink to="/admissions" className={linkClass}>
                    <MdLocalHospital size={18} /> Admissions
                </NavLink>
                <NavLink to="/patient-report" className={linkClass}>
                    <FiFileText size={18} /> Patient Reports
                </NavLink>
            </nav>

            {/* Fills the previously-empty bottom space now that
                Profile/Logout moved to the top navbar */}
            <div className="border-top border-secondary border-opacity-25 pt-3 mt-3">
                <div className="d-flex align-items-center gap-2 mb-2">
                    <span
                        className="rounded-circle bg-success"
                        style={{ width: "8px", height: "8px" }}
                    ></span>
                    <span className="text-white-50 small">All systems operational</span>
                </div>
                <p className="text-white-50 mb-0" style={{ fontSize: "0.7rem" }}>
                    HealthForecast AI · v1.0
                </p>
            </div>
        </div>
    );
}

export default Sidebar;