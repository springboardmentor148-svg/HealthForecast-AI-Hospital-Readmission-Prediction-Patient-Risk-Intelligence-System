import { FaChartPie, FaFlask, FaChartLine, FaUsers, FaDatabase, FaSliders } from "react-icons/fa6";
import { RoleShell } from "./RoleShell.jsx";

const sidebarItems = [
  { label: "Overview", icon: FaChartPie, path: "/app/research/overview" },
  { label: "Treatment Analysis", icon: FaFlask, path: "/app/research/treatment-analysis" },
  { label: "Risk & Readmission Trends", icon: FaChartLine, path: "/app/research/risk-trends" },
  { label: "Population Health", icon: FaUsers, path: "/app/research/population-health" },
  { label: "Dataset Export", icon: FaDatabase, path: "/app/research/dataset-export" },
  { label: "Settings", icon: FaSliders, path: "/app/research/settings" },
];

export default function ResearcherLayout() {
  return <RoleShell sidebarItems={sidebarItems} profilePath="/app/research/profile" />;
}