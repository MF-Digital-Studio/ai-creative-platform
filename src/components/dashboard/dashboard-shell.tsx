import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

type DashboardShellProps = {
  children: React.ReactNode;
  displayName?: string | null;
};

export function DashboardShell({ children, displayName }: DashboardShellProps) {
  return (
    <div className="dashboard-shell">
      <DashboardSidebar />
      <div className="dashboard-workspace-shell">
        <DashboardTopbar displayName={displayName} />
        {children}
      </div>
    </div>
  );
}
