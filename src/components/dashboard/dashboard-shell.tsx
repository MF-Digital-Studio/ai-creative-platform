import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-shell">
      <DashboardSidebar />
      <div className="dashboard-workspace-shell">
        <DashboardTopbar />
        {children}
      </div>
    </div>
  );
}
