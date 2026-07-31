import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiBell, FiLogOut, FiUser, FiChevronDown } from "react-icons/fi";
import { getPatients } from "../services/patientService";

function getInitials(name) {
    if (!name) return "DR";
    const parts = name.trim().split(" ");
    const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase());
    return initials.join("") || "DR";
}

function TopNavbar() {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [allPatients, setAllPatients] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Load the doctor's patients once, so search filters instantly
    // without hitting the backend on every keystroke
    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const data = await getPatients();
                setAllPatients(data);
            } catch (err) {
                console.error("Failed to load patients for search:", err);
            }
        };
        fetchPatients();
    }, []);

    const searchResults =
        searchQuery.trim().length > 0
            ? allPatients.filter((p) =>
                  p.patient_name.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : [];

    const today = new Date().toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
    });

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/");
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setShowResults(false);
        navigate("/patients");
    };

    const handleResultClick = (patientId) => {
        setShowResults(false);
        setSearchQuery("");
        navigate(`/patient-report?patientId=${patientId}`);
    };

    return (
        <div
            className="d-flex flex-wrap align-items-center justify-content-between gap-2 bg-white shadow-sm px-3 px-md-4 py-2 mb-3 rounded no-print"
            style={{ position: "sticky", top: 0, zIndex: 10 }}
        >
            {/* Search bar */}
            <div
                className="order-1 order-md-0"
                style={{ maxWidth: "320px", width: "100%", flex: "1 1 220px", position: "relative" }}
            >
                <form onSubmit={handleSearchSubmit} className="d-flex">
                    <div className="input-group">
                        <span className="input-group-text bg-light border-0">
                            <FiSearch size={16} className="text-muted" />
                        </span>
                        <input
                            type="text"
                            className="form-control bg-light border-0"
                            placeholder="Search patients..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowResults(true);
                            }}
                            onFocus={() => setShowResults(true)}
                            onBlur={() => setTimeout(() => setShowResults(false), 150)}
                        />
                    </div>
                </form>

                {showResults && searchQuery.trim().length > 0 && (
                    <div
                        className="card shadow position-absolute mt-1"
                        style={{ width: "100%", zIndex: 20, maxHeight: "260px", overflowY: "auto" }}
                    >
                        {searchResults.length === 0 ? (
                            <p className="text-muted small text-center p-3 mb-0">
                                No patients found for "{searchQuery}"
                            </p>
                        ) : (
                            searchResults.map((p) => (
                                <button
                                    key={p._id}
                                    className="btn btn-light text-start d-flex justify-content-between align-items-center px-3 py-2 border-0 rounded-0"
                                    onClick={() => handleResultClick(p._id)}
                                >
                                    <span>
                                        {p.patient_name}
                                        <span className="text-muted small ms-2">
                                            {p.age}, {p.gender}
                                        </span>
                                    </span>
                                    {p.latest_risk_level && (
                                        <span
                                            className={`badge ${
                                                p.latest_risk_level.includes("High")
                                                    ? "bg-danger"
                                                    : "bg-success"
                                            }`}
                                        >
                                            {p.latest_risk_level}
                                        </span>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Right side: date, notifications, profile, logout */}
            <div className="d-flex align-items-center gap-2 gap-md-3 order-0 order-md-1">

                <span className="text-muted small d-none d-md-inline">
                    {today}
                </span>

                {/* Notification bell */}
                <div className="position-relative">
                    <button
                        className="btn btn-light rounded-circle p-2 position-relative"
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowProfileMenu(false);
                        }}
                    >
                        <FiBell size={18} />
                        {/* Static badge for now — no real notification system yet */}
                        <span
                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
                            style={{ fontSize: "0.55rem", padding: "3px 5px" }}
                        >
                            0
                        </span>
                    </button>

                    {showNotifications && (
                        <div
                            className="card shadow position-absolute end-0 mt-2"
                            style={{ width: "260px", zIndex: 20 }}
                        >
                            <div className="card-body">
                                <p className="text-muted small mb-0 text-center">
                                    No new notifications
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Doctor profile dropdown */}
                <div className="position-relative">
                    <button
                        className="btn btn-light d-flex align-items-center gap-2 rounded-pill px-2 py-1"
                        onClick={() => {
                            setShowProfileMenu(!showProfileMenu);
                            setShowNotifications(false);
                        }}
                    >
                        <div
                            className="d-flex align-items-center justify-content-center text-white fw-bold"
                            style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #4a7bd9, #2fa66b)",
                                fontSize: "0.8rem",
                            }}
                        >
                            {getInitials(user?.full_name)}
                        </div>
                        <span className="small fw-medium d-none d-md-inline">
                            {user?.full_name || "Doctor"}
                        </span>
                        <FiChevronDown size={14} />
                    </button>

                    {showProfileMenu && (
                        <div
                            className="card shadow position-absolute end-0 mt-2"
                            style={{ width: "200px", zIndex: 20 }}
                        >
                            <div className="card-body p-2">
                                <p className="small text-muted px-2 mb-2">
                                    {user?.role || "Doctor"}
                                </p>
                                <button
                                    className="btn btn-light w-100 text-start d-flex align-items-center gap-2 mb-1"
                                    onClick={() => {
                                        setShowProfileMenu(false);
                                        navigate("/profile");
                                    }}
                                >
                                    <FiUser size={16} /> View Profile
                                </button>
                                <button
                                    className="btn btn-light w-100 text-start d-flex align-items-center gap-2 text-danger"
                                    onClick={handleLogout}
                                >
                                    <FiLogOut size={16} /> Logout
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Standalone logout button — hidden on very small screens
                    since the profile dropdown's Logout option covers it,
                    keeping the mobile bar from getting too crowded */}
                <button
                    className="btn btn-outline-danger btn-sm d-none d-sm-flex align-items-center gap-1"
                    onClick={handleLogout}
                >
                    <FiLogOut size={14} /> Logout
                </button>
            </div>
        </div>
    );
}

export default TopNavbar;