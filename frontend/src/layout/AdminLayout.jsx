import { FaChartPie, FaUsers, FaClipboardList, FaDatabase, FaMicrochip, FaSliders } from "react-icons/fa6";
import { RoleShell } from "./RoleShell.jsx";

const sidebarItems = [
  { label: "Overview", icon: FaChartPie, path: "/app/admin/overview" },
  { label: "User Management", icon: FaUsers, path: "/app/admin/users" },
  { label: "Dataset Management", icon: FaDatabase, path: "/app/admin/datasets" },
  { label: "AI Model Management", icon: FaMicrochip, path: "/app/admin/models" },
  { label: "Audit Logs", icon: FaClipboardList, path: "/app/admin/audit" },
  { label: "Settings", icon: FaSliders, path: "/app/admin/settings" },
];

export default function AdminLayout() {
  return <RoleShell sidebarItems={sidebarItems} />;
}