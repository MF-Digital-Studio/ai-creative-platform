import { DashboardFrame } from "@/components/dashboard/dashboard-frame";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";
import type { NotificationItem } from "@/lib/notifications/types";

type DashboardShellProps = {
  children: React.ReactNode;
  displayName?: string | null;
  notifications: NotificationItem[];
  notificationsRenderedAt: number;
  notificationsLoadFailed?: boolean;
};

export function DashboardShell({ children, displayName, notifications, notificationsRenderedAt, notificationsLoadFailed }: DashboardShellProps) {
  return (
    <DashboardFrame displayName={displayName} topbar={<DashboardTopbar displayName={displayName} notifications={notifications} notificationsRenderedAt={notificationsRenderedAt} notificationsLoadFailed={notificationsLoadFailed} />}>
      {children}
    </DashboardFrame>
  );
}
