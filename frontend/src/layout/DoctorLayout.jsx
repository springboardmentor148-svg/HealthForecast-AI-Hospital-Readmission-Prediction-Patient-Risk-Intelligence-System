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
  return <RoleShell sidebarItems={sidebarItems} profilePath="/app/doctor/profile" />;
}