"use client";

import { useLocale, useTranslations } from "next-intl";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { dashboardPrimaryNavigation } from "@/data/dashboard-navigation";
import { Link, usePathname } from "@/i18n/navigation";

type DashboardSidebarProps = {
  displayName?: string | null;
  collapsed: boolean;
  onToggle: () => void;
};

export function DashboardSidebar({ displayName, collapsed, onToggle }: DashboardSidebarProps) {
  const t = useTranslations("Dashboard.navigation");
  const topbar = useTranslations("Dashboard.topbar");
  const locale = useLocale();
  const pathname = usePathname();
  const name = displayName?.trim() || t("items.account");

  return <aside className="dashboard-sidebar" aria-label={t("primaryLabel")}>
    <div className="dashboard-sidebar-brand-row">
      <Link href="/dashboard" className="dashboard-brand-mark" aria-label={t("brand")}>
        <span className="dashboard-brand-compact" aria-hidden="true">K</span><span className="dashboard-brand-full">{t("brand")}</span>
      </Link>
      <button type="button" className="dashboard-sidebar-toggle" aria-label={collapsed ? t("expandSidebar") : t("collapseSidebar")} aria-expanded={!collapsed} onClick={onToggle}>
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
      <Link href="/" className="dashboard-nav-item dashboard-site-link" aria-label={t("returnToWebsite")} data-tooltip={collapsed ? t("returnToWebsite") : undefined}>
        <DashboardIcon name="website" className="dashboard-nav-icon" /><span className="dashboard-nav-label">{t("returnToWebsite")}</span>
      </Link>
      <details className="dashboard-sidebar-account-menu">
        <summary className="dashboard-sidebar-account" aria-label={`${t("items.account")}: ${name}`} title={collapsed ? name : undefined}>
          <span className="dashboard-sidebar-avatar" aria-hidden="true">{name.slice(0, 1).toLocaleUpperCase()}</span>
          <span className="dashboard-sidebar-account-copy"><strong>{name}</strong><small>{t("personalWorkspace")}</small></span>
          <DashboardIcon name="chevron" className="dashboard-sidebar-chevron" />
        </summary>
        <div className="dashboard-sidebar-account-actions">
          <Link href="/dashboard/account">{topbar("account")}</Link>
          <form action={`/${locale}/auth/signout`} method="post"><button type="submit">{topbar("signOut")}</button></form>
        </div>
      </details>
    </div>
  </aside>;
}
