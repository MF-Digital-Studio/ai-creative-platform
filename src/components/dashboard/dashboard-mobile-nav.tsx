"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useTranslations } from "next-intl";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import {
  dashboardFooterNavigation,
  dashboardPrimaryNavigation,
  dashboardUtilityNavigation,
  type DashboardNavigationItem,
} from "@/data/dashboard-navigation";
import { Link, usePathname } from "@/i18n/navigation";

export function DashboardMobileNav() {
  const t = useTranslations("Dashboard.navigation");
  const drawerId = useId();
  const pathname = usePathname();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const previousPathnameRef = useRef(pathname);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (previousPathnameRef.current !== pathname) {
      previousPathnameRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    drawerRef.current?.querySelector<HTMLElement>("a, button")?.focus();

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  function closeDrawer(restoreFocus = false) {
    setIsOpen(false);
    if (restoreFocus) {
      triggerRef.current?.focus();
    }
  }

  function handleDrawerKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key !== "Tab") {
      return;
    }

    const focusable = drawerRef.current?.querySelectorAll<HTMLElement>(
      "a[href], button:not([disabled])",
    );
    if (!focusable?.length) {
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function renderItem(item: DashboardNavigationItem, active = false) {
    const label = t(`items.${item.key}`);
    const content = (
      <>
        <DashboardIcon name={item.icon} className="dashboard-mobile-nav-icon" />
        <span>{label}</span>
      </>
    );

    if (item.href) {
      return (
        <Link
          key={item.key}
          href={item.href}
          aria-current={active ? "page" : undefined}
          className="dashboard-mobile-nav-item"
          data-active={active || undefined}
          onClick={() => closeDrawer()}
        >
          {content}
        </Link>
      );
    }

    return (
      <button
        key={item.key}
        type="button"
        aria-disabled="true"
        title={t("unavailable")}
        className="dashboard-mobile-nav-item"
      >
        {content}
      </button>
    );
  }

  return (
    <div className="dashboard-mobile-navigation">
      <button
        ref={triggerRef}
        type="button"
        aria-label={t("openMenu")}
        aria-expanded={isOpen}
        aria-controls={drawerId}
        className="dashboard-menu-trigger"
        onClick={() => setIsOpen(true)}
      >
        <DashboardIcon name="menu" />
      </button>

      {isOpen ? (
        <div className="dashboard-drawer-layer">
          <button
            type="button"
            tabIndex={-1}
            aria-label={t("closeMenu")}
            className="dashboard-drawer-backdrop"
            onClick={() => closeDrawer(true)}
          />
          <aside
            ref={drawerRef}
            id={drawerId}
            aria-label={t("primaryLabel")}
            className="dashboard-drawer"
            onKeyDown={handleDrawerKeyDown}
          >
            <div className="dashboard-drawer-header">
              <Link href="/" aria-label={t("homeLabel")} className="dashboard-drawer-brand">
                {t("brand")}
              </Link>
              <button
                type="button"
                aria-label={t("closeMenu")}
                className="dashboard-drawer-close"
                onClick={() => closeDrawer(true)}
              >
                <DashboardIcon name="close" />
              </button>
            </div>

            <nav aria-label={t("primaryLabel")} className="dashboard-drawer-nav">
              {dashboardPrimaryNavigation.map((item, index) => renderItem(item, index === 0))}
            </nav>
            <nav aria-label={t("secondaryLabel")} className="dashboard-drawer-nav dashboard-drawer-nav-secondary">
              {dashboardUtilityNavigation.map((item) => renderItem(item))}
              {dashboardFooterNavigation.map((item) => renderItem(item))}
            </nav>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
