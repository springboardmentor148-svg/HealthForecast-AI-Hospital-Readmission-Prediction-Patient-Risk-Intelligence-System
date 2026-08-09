import { useEffect, useState } from "react";
import {
  FaHouseMedical,
  FaUserInjured,
  FaChartLine,
  FaFlask,
  FaClipboardCheck,
  FaFileWaveform,
  FaSliders,
} from "react-icons/fa6";
import { RoleShell } from "./RoleShell.jsx";
import { fetchDoctorNotifications } from "../services/notificationsApi.js";

const sidebarItems = [
  { label: "Overview", icon: FaHouseMedical, path: "/app/doctor/overview" },
  { label: "My Patients", icon: FaUserInjured, path: "/app/doctor/patients" },
  { label: "Risk Predictions", icon: FaChartLine, path: "/app/doctor/predictions" },
  { label: "Treatment Effectiveness", icon: FaFlask, path: "/app/doctor/treatment-effectiveness" },
  { label: "Care Recommendations", icon: FaClipboardCheck, path: "/app/doctor/care-recommendations" },
  { label: "Reports", icon: FaFileWaveform, path: "/app/doctor/reports" },
  { label: "Settings", icon: FaSliders, path: "/app/doctor/settings" },
];

export default function DoctorLayout() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const data = await fetchDoctorNotifications();
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
      profilePath="/app/doctor/settings"
      notifications={notifications}
    />
  );
}