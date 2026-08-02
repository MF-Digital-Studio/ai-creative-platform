import type { ReactNode } from "react";

import { DashboardSidebar } from "@/components/dashboard/dashboard-sidebar";
import { DashboardTopbar } from "@/components/dashboard/dashboard-topbar";

export async function DashboardShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-svh bg-[var(--surface-soft)]">
      <DashboardSidebar />
      <div className="min-w-0 flex-1">
        <DashboardTopbar />
        <main className="mx-auto w-full max-w-[90rem] px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
