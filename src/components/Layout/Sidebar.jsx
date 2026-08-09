import "../../assets/css/Sidebar.css";

import {
  FaHome,
  FaUsers,
  FaHeartbeat,
  FaHistory,
  FaChartBar,
  FaFileAlt,
  FaUserCircle,
  FaCog,
  FaStethoscope,
} from "react-icons/fa";

import { NavLink } from "react-router-dom";

export default function Sidebar() {
  const menus = [
    {
      name: "Dashboard",
      path: "/",
      icon: <FaHome />,
    },
    {
      name: "Patients",
      path: "/patients",
      icon: <FaUsers />,
    },
    {
      name: "New Prediction",
      path: "/prediction",
      icon: <FaHeartbeat />,
    },
    {
      name: "Prediction History",
      path: "/history",
      icon: <FaHistory />,
    },

    {
      name: "Reports",
      path: "/reports",
      icon: <FaFileAlt />,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: <FaUserCircle />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <FaCog />,
    },
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
          {menus.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                isActive ? "sidebarItem active" : "sidebarItem"
              }
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="doctorCard">
        <img
          src="https://i.pravatar.cc/100?img=12"
          alt="doctor"
        />

        <div>
          <h5>Dr Rahul</h5>
          <small>Administrator</small>
        </div>
      </div>
    </aside>
  );
}