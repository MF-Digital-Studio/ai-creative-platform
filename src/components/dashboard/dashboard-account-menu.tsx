"use client";

import { useId } from "react";
import { useLocale, useTranslations } from "next-intl";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { useDismissiblePopover } from "@/hooks/use-dismissible-popover";
import { Link } from "@/i18n/navigation";

type DashboardAccountMenuProps = {
  displayName?: string | null;
  compact?: boolean;
  collapsed?: boolean;
};

export function DashboardAccountMenu({
  displayName,
  compact = false,
  collapsed = false,
}: DashboardAccountMenuProps) {
  const navigation = useTranslations("Dashboard.navigation");
  const topbar = useTranslations("Dashboard.topbar");
  const locale = useLocale();
  const menuId = useId();
  const name = displayName?.trim() || navigation("items.account");
  const { close, isOpen, rootRef, toggle, triggerRef } = useDismissiblePopover();

  return (
    <div
      ref={rootRef}
      className={compact ? "dashboard-header-account-menu" : "dashboard-sidebar-account-menu"}
    >
      <button
        ref={triggerRef}
        type="button"
        className={compact ? "dashboard-header-account" : "dashboard-sidebar-account"}
        aria-label={`${navigation("items.account")}: ${name}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        title={collapsed ? name : undefined}
        onClick={toggle}
      >
        <span className="dashboard-sidebar-avatar" aria-hidden="true">
          {name.slice(0, 1).toLocaleUpperCase()}
        </span>
        {!compact ? (
          <span className="dashboard-sidebar-account-copy">
            <strong>{name}</strong>
            <small>{navigation("personalWorkspace")}</small>
          </span>
        ) : null}
        <DashboardIcon
          name="chevron"
          className={`dashboard-sidebar-chevron${isOpen ? " is-open" : ""}`}
        />
      </button>
      {isOpen ? (
        <div
          id={menuId}
          className={compact ? "dashboard-header-account-actions" : "dashboard-sidebar-account-actions"}
          role="menu"
        >
          <Link href="/dashboard/account" role="menuitem" onClick={() => close()}>
            {topbar("account")}
          </Link>
          <form action={`/${locale}/auth/signout`} method="post">
            <button type="submit" role="menuitem">{topbar("signOut")}</button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
