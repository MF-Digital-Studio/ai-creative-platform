import { getTranslations } from "next-intl/server";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import {
  dashboardFooterNavigation,
  dashboardPrimaryNavigation,
  dashboardUtilityNavigation,
  type DashboardNavigationItem,
} from "@/data/dashboard-navigation";
import { Link } from "@/i18n/navigation";

async function NavigationItem({
  item,
  active = false,
}: {
  item: DashboardNavigationItem;
  active?: boolean;
}) {
  const t = await getTranslations("Dashboard.navigation");
  const label = t(`items.${item.key}`);
  const content = (
    <>
      <DashboardIcon name={item.icon} className="dashboard-nav-icon" />
      <span className="dashboard-nav-tooltip" role="tooltip">{label}</span>
    </>
  );

  if (item.href) {
    return (
      <Link
        href={item.href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className="dashboard-nav-item"
        data-active={active || undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      aria-label={`${label}. ${t("unavailable")}`}
      aria-disabled="true"
      className="dashboard-nav-item"
    >
      {content}
    </button>
  );
}

export async function DashboardSidebar() {
  const t = await getTranslations("Dashboard.navigation");

  return (
    <aside className="dashboard-sidebar">
      <Link href="/" aria-label={t("homeLabel")} className="dashboard-brand-mark">
        <span aria-hidden="true">Klay.ai</span>
      </Link>

      <nav aria-label={t("primaryLabel")} className="dashboard-sidebar-nav">
        {dashboardPrimaryNavigation.map((item, index) => (
          <NavigationItem key={item.key} item={item} active={index === 0} />
        ))}
      </nav>

      <div className="dashboard-sidebar-footer">
        <nav aria-label={t("secondaryLabel")} className="dashboard-sidebar-nav">
          {dashboardUtilityNavigation.map((item) => (
            <NavigationItem key={item.key} item={item} />
          ))}
        </nav>
        <div className="dashboard-sidebar-separator" />
        <nav aria-label={t("secondaryLabel")} className="dashboard-sidebar-nav">
          {dashboardFooterNavigation.map((item) => (
            <NavigationItem key={item.key} item={item} />
          ))}
        </nav>
      </div>
    </aside>
  );
}
