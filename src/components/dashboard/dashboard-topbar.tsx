import { getTranslations } from "next-intl/server";

import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { WorkspaceContext } from "@/components/dashboard/workspace-context";
import { WorkspaceCreateAction } from "@/components/dashboard/workspace-create-action";

export async function DashboardTopbar({ displayName }: { displayName?: string | null }) {
  const t = await getTranslations("Dashboard.topbar");

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar-inner dashboard-container">
        <div className="dashboard-topbar-context">
          <DashboardMobileNav displayName={displayName} />
          <WorkspaceContext />
        </div>
        <div className="dashboard-topbar-actions">
          <WorkspaceCreateAction label={t("newProject")} />
          <LanguageSwitcher variant="dashboard" />
        </div>
      </div>
    </header>
  );
}
