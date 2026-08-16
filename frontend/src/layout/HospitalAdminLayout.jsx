import { useEffect, useState } from "react";
import {
  FaChartPie,
  FaHospitalUser,
  FaChartLine,
  FaFlask,
  FaUsers,
  FaFileWaveform,
  FaSliders,
} from "react-icons/fa6";
import { RoleShell } from "./RoleShell.jsx";
import { fetchHospitalAdminNotifications } from "../services/notificationsApi.js";

const sidebarItems = [
  { label: "Overview", icon: FaChartPie, path: "/app/hospital-admin/overview" },
  { label: "Patient Outcomes", icon: FaHospitalUser, path: "/app/hospital-admin/outcomes" },
  { label: "Risk & Readmission", icon: FaChartLine, path: "/app/hospital-admin/risk-forecast" },
  { label: "Treatment Effectiveness", icon: FaFlask, path: "/app/hospital-admin/treatment-effectiveness" },
  { label: "Population Health", icon: FaUsers, path: "/app/hospital-admin/population-health" },
  { label: "Reports", icon: FaFileWaveform, path: "/app/hospital-admin/reports" },
  { label: "Settings", icon: FaSliders, path: "/app/hospital-admin/settings" },
];

export default function HospitalAdminLayout() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const data = await fetchHospitalAdminNotifications();
        if (isMounted) {
          setNotifications(data);
        }
      } catch (err) {
        console.error("Failed to load notifications:", err);
      }
    }

    loadNotifications();
    return () => { isMounted = false; };
  }, []);

  return (
    <RoleShell
      sidebarItems={sidebarItems}
      profilePath="/app/hospital-admin/settings"
      notifications={notifications}
    />
  );
}