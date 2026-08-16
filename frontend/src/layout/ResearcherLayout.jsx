import { useEffect, useState } from "react";
import { FaChartPie, FaFlask, FaChartLine, FaUsers, FaDatabase, FaSliders } from "react-icons/fa6";
import { RoleShell } from "./RoleShell.jsx";
import { fetchResearcherNotifications } from "../services/notificationsApi.js";

const sidebarItems = [
  { label: "Overview", icon: FaChartPie, path: "/app/research/overview" },
  { label: "Treatment Analysis", icon: FaFlask, path: "/app/research/treatment-analysis" },
  { label: "Risk & Readmission Trends", icon: FaChartLine, path: "/app/research/risk-trends" },
  { label: "Population Health", icon: FaUsers, path: "/app/research/population-health" },
  { label: "Dataset Export", icon: FaDatabase, path: "/app/research/dataset-export" },
  { label: "Settings", icon: FaSliders, path: "/app/research/settings" },
];

export default function ResearcherLayout() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const data = await fetchResearcherNotifications();
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
      profilePath="/app/research/profile"
      notifications={notifications}
    />
  );
}