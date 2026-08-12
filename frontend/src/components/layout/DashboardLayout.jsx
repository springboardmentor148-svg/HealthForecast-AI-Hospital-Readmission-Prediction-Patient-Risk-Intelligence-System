import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function DashboardLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--paper)" }}>
      <Sidebar />
      <div className="flex-1 min-w-0 flex flex-col">
        <TopBar title={title} subtitle={subtitle} />
        <main className="flex-1 px-5 md:px-8 py-6 md:py-8">{children}</main>
      </div>
    </div>
  );
}
