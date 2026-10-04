import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

type DashboardShellProps = {
  children: React.ReactNode;
  displayName?: string | null;
};

export function DashboardShell({ children, displayName }: DashboardShellProps) {
  return (
    <DashboardFrame displayName={displayName} topbar={<DashboardTopbar displayName={displayName} />}>
      {children}
    </DashboardFrame>
  );
}
