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

const sidebarItems = [
  { label: "Overview", icon: FaChartPie, path: "/app/hospital-admin/overview" },
  { label: "Patient Outcomes", icon: FaHospitalUser, path: "/app/hospital-admin/outcomes" },
  { label: "Risk & Readmission", icon: FaChartLine, path: "/app/hospital-admin/risk-forecast" },
  { label: "Treatment Effectiveness", icon: FaFlask, path: "/app/hospital-admin/treatment-effectiveness" },
  { label: "Population Health", icon: FaUsers, path: "/app/hospital-admin/population-health" },
  { label: "Reports", icon: FaFileWaveform, path: "/app/hospital-admin/reports" },
  { label: "Settings", icon: FaSliders, path: "/app/hospital-admin/settings" },
];

const hospitalAdminNotifications = [
  { id: 1, text: "Endocrinology readmission rate crossed the 10% alert threshold.", time: "1 hr ago" },
  { id: 2, text: "Weekly hospital performance report is ready to view.", time: "3 hr ago" },
  { id: 3, text: "Bed occupancy in General Surgery reached 82%.", time: "Yesterday" },
];

export default function HospitalAdminLayout() {
  return (
    <RoleShell
      sidebarItems={sidebarItems}
      profilePath="/app/hospital-admin/settings"
      notifications={hospitalAdminNotifications}
    />
  );
}