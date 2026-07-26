import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";

function DashboardLayout() {
    const location = useLocation();

    return (
        <div className="d-flex">
            <Sidebar />

            <div
                className="flex-grow-1 p-4 dashboard-content-area"
                style={{ marginLeft: "250px", minHeight: "100vh" }}
            >
                {/* key={location.pathname} forces React to remount this div
                    on every route change, which re-triggers the fade-in
                    animation each time you navigate to a new page */}
                <div
                    key={location.pathname}
                    className="animate-fade-in content-panel"
                >
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default DashboardLayout;