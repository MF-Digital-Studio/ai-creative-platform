"use client";

import { useTranslations } from "next-intl";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { dashboardPrimaryNavigation } from "@/data/dashboard-navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { DashboardPlanCard } from "@/components/dashboard/dashboard-plan-card";
import { DashboardAccountMenu } from "@/components/dashboard/dashboard-account-menu";

type DashboardSidebarProps = {
  displayName?: string | null;
  collapsed: boolean;
  onToggle: () => void;
};

export function DashboardSidebar({ displayName, collapsed, onToggle }: DashboardSidebarProps) {
  const t = useTranslations("Dashboard.navigation");
  const pathname = usePathname();

  return <aside className="dashboard-sidebar" aria-label={t("primaryLabel")}>
    <div className="dashboard-sidebar-brand-row">
      <Link href="/dashboard" className="dashboard-brand-mark" aria-label={t("brand")}>
        <span className="dashboard-brand-compact" aria-hidden="true">K</span><span className="dashboard-brand-full">{t("brand")}</span>
      </Link>
      <button type="button" className="dashboard-sidebar-toggle" aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")} aria-expanded={!collapsed} title={collapsed ? t("expandSidebar") : t("collapseSidebar")} onClick={onToggle}>
        <DashboardIcon name={collapsed ? "expand" : "collapse"} />
      </button>
    </div>
    <div className="dashboard-sidebar-group">
      <span className="dashboard-sidebar-caption">{t("workspaceGroup")}</span>
      <nav aria-label={t("primaryLabel")} className="dashboard-sidebar-nav">
        {dashboardPrimaryNavigation.map((item) => {
          const active = item.key === "home" ? pathname === "/dashboard" : item.key === "projects" ? pathname.startsWith("/dashboard/projects") : false;
          const label = t(`items.${item.key}`);
          return <Link key={item.key} href={item.href} className="dashboard-nav-item" aria-label={label} aria-current={active ? "page" : undefined} data-active={active || undefined} data-tooltip={collapsed ? label : undefined}>
            <DashboardIcon name={item.icon} className="dashboard-nav-icon" /><span className="dashboard-nav-label">{label}</span>
          </Link>;
        })}
      </nav>
    </div>
    <div className="dashboard-sidebar-spacer" />
    <div className="dashboard-sidebar-footer">
      <div className="dashboard-sidebar-plan-slot">
        <DashboardPlanCard collapsed={collapsed} />
      </div>
      <Link href="/" className="dashboard-nav-item dashboard-site-link" aria-label={t("returnToWebsite")} data-tooltip={collapsed ? t("returnToWebsite") : undefined}>
        <DashboardIcon name="website" className="dashboard-nav-icon" /><span className="dashboard-nav-label">{t("returnToWebsite")}</span>
      </Link>
      <DashboardAccountMenu displayName={displayName} collapsed={collapsed} />
    </div>
  </aside>;
}
