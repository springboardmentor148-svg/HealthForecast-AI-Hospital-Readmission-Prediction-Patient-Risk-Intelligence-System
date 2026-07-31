import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import TopNavbar from "../components/TopNavbar";
import Footer from "../components/Footer";

function DashboardLayout() {
    const location = useLocation();

    return (
        <div className="d-flex">
            <Sidebar />

            {/* d-flex flex-column + minHeight: 100vh turns this into a
                "sticky footer" layout: the content block below grows to
                fill any leftover space (flex-grow-1), pushing Footer to
                the actual bottom of the viewport even when a page's
                content is short. On long pages, Footer just follows
                naturally after the content instead of being cut off. */}
            <div
                className="d-flex flex-column p-4 dashboard-content-area"
                style={{ marginLeft: "250px", minHeight: "100vh", flex: 1 }}
            >
                <TopNavbar />

                <div
                    key={location.pathname}
                    className="animate-fade-in content-panel flex-grow-1"
                >
                    <Outlet />
                </div>

                <Footer />
            </div>
        </div>
    );
}

export default DashboardLayout;