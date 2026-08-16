import { useEffect, useState } from "react";
import { FaChartPie, FaUsers, FaClipboardList, FaDatabase, FaMicrochip, FaSliders } from "react-icons/fa6";
import { RoleShell } from "./RoleShell.jsx";
import { fetchAdminNotifications } from "../services/notificationsApi.js";

const sidebarItems = [
  { label: "Overview", icon: FaChartPie, path: "/app/admin/overview" },
  { label: "User Management", icon: FaUsers, path: "/app/admin/users" },
  { label: "Dataset Management", icon: FaDatabase, path: "/app/admin/datasets" },
  { label: "AI Model Management", icon: FaMicrochip, path: "/app/admin/models" },
  { label: "Audit Logs", icon: FaClipboardList, path: "/app/admin/audit" },
  { label: "Settings", icon: FaSliders, path: "/app/admin/settings" },
];

export default function AdminLayout() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let isMounted = true;

    async function loadNotifications() {
      try {
        const data = await fetchAdminNotifications();
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
      profilePath="/app/admin/settings"
      notifications={notifications}
    />
  );
}