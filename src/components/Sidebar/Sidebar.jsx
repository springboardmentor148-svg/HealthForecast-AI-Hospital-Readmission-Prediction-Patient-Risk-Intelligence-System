import {
    FaHome,
    FaUsers,
    FaHeartbeat,
    FaHistory,
    FaChartBar,
    FaFileAlt,
    FaUserCircle,
    FaCog,
    FaStethoscope
} from "react-icons/fa";

import { NavLink } from "react-router-dom";

import "../../assets/css/Sidebar.css";

export default function Sidebar() {

    const menus = [
        {
            name: "Dashboard",
            icon: <FaHome />,
            path: "/"
        },
        {
            name: "Patients",
            icon: <FaUsers />,
            path: "/patients"
        },
        {
            name: "Predictions",
            icon: <FaHeartbeat />,
            path: "/predictions"
        },
        {
            name: "Prediction History",
            icon: <FaHistory />,
            path: "/history"
        },
        {
            name: "Analytics",
            icon: <FaChartBar />,
            path: "/analytics"
        },
        {
            name: "Reports",
            icon: <FaFileAlt />,
            path: "/reports"
        },
        {
            name: "Profile",
            icon: <FaUserCircle />,
            path: "/profile"
        },
        {
            name: "Settings",
            icon: <FaCog />,
            path: "/settings"
        }
    ];

    return (

        <aside className="sidebar">

            <div>

                <div className="logo">

                    <div className="logoIcon">

                        <FaStethoscope />

                    </div>

                    <div>

                        <h3>HealthForecast AI</h3>

                        <p>Hospital Prediction</p>

                    </div>

                </div>

                <nav>

                    {
                        menus.map((item) => (

                            <NavLink
                                key={item.name}
                                to={item.path}
                                className={({ isActive }) =>
                                    isActive
                                        ? "sidebarItem active"
                                        : "sidebarItem"
                                }
                            >

                                {item.icon}

                                <span>{item.name}</span>

                            </NavLink>

                        ))
                    }

                </nav>

            </div>

            <div className="doctorCard">

                <img
                    src="https://i.pravatar.cc/100"
                    alt="Doctor"
                />

                <div>

                    <h5>Dr. Rahul</h5>

                    <small>Administrator</small>

                </div>

            </div>

        </aside>

    );

}