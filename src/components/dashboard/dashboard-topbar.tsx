import { getTranslations } from "next-intl/server";

import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { WorkspaceCreateAction } from "@/components/dashboard/workspace-create-action";
import { DashboardAccountMenu } from "@/components/dashboard/dashboard-account-menu";

export async function DashboardTopbar({ displayName }: { displayName?: string | null }) {
  const t = await getTranslations("Dashboard.topbar");

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar-inner dashboard-container">
        <DashboardMobileNav displayName={displayName} />
        <div className="dashboard-topbar-actions">
          <WorkspaceCreateAction label={t("newProject")} />
          <LanguageSwitcher variant="dashboard" />
          <DashboardAccountMenu displayName={displayName} compact />
        </div>
      </div>
    </header>
  );
}
