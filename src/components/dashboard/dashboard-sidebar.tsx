"use client";

import { useLocale, useTranslations } from "next-intl";

import {
  dashboardNavigation,
  isDashboardNavigationItemActive,
  type DashboardIconName,
} from "@/data/dashboard-navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

function DashboardIcon({ name }: { name: DashboardIconName }) {
  const commonProps = {
    "aria-hidden": true,
    className: "h-[1.125rem] w-[1.125rem] shrink-0",
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.6,
    viewBox: "0 0 24 24",
  };

  switch (name) {
    case "home":
      return (
        <svg {...commonProps}>
          <path d="m3.5 10.75 8.5-7 8.5 7v9.75H14.5v-6h-5v6h-6Z" />
        </svg>
      );
    case "projects":
      return (
        <svg {...commonProps}>
          <rect x="3.5" y="4" width="17" height="16" rx="2" />
          <path d="M3.5 9h17M8.5 4v5" />
        </svg>
      );
    case "spark":
      return (
        <svg {...commonProps}>
          <path d="M12 3.5 13.7 10.3 20.5 12l-6.8 1.7L12 20.5l-1.7-6.8L3.5 12l6.8-1.7Z" />
        </svg>
      );
    case "files":
      return (
        <svg {...commonProps}>
          <path d="M7 3.5h7l4 4v13H7a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2Z" />
          <path d="M14 3.5v4h4M8.5 12h7M8.5 16h5" />
        </svg>
      );
    case "credits":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M14.8 8.9c-.52-.55-1.4-.9-2.55-.9-1.54 0-2.62.74-2.62 1.87 0 2.8 5.2 1.24 5.2 4 0 1.2-1.1 2.13-2.8 2.13-1.2 0-2.22-.4-2.86-1.03M12 6.5v11" />
        </svg>
      );
    case "settings":
      return (
        <svg {...commonProps}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.2 13.4a1.65 1.65 0 0 0 .33 1.82l.06.06-2.1 2.1-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.5v.1h-3v-.1a1.65 1.65 0 0 0-1-1.5 1.65 1.65 0 0 0-1.82.33l-.06.06-2.1-2.1.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.5-1h-.1v-3h.1a1.65 1.65 0 0 0 1.5-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06 2.1-2.1.06.06a1.65 1.65 0 0 0 1.82.33 1.65 1.65 0 0 0 1-1.5v-.1h3v.1a1.65 1.65 0 0 0 1 1.5 1.65 1.65 0 0 0 1.82-.33l.06-.06 2.1 2.1-.06.06a1.65 1.65 0 0 0-.33 1.82 1.65 1.65 0 0 0 1.5 1h.1v3h-.1a1.65 1.65 0 0 0-1.5 1Z" />
        </svg>
      );
  }
}

type DashboardNavigationProps = {
  onNavigate?: () => void;
};

export function DashboardNavigation({ onNavigate }: DashboardNavigationProps) {
  const pathname = usePathname();
  const t = useTranslations("Dashboard");

  return (
    <nav aria-label={t("navigation.label")}>
      <ul className="space-y-1" role="list">
        {dashboardNavigation.map((item) => {
          const isActive = isDashboardNavigationItemActive(pathname, item);

          return (
            <li key={item.id}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--foreground-muted)] transition-colors duration-(--transition-fast) hover:bg-[var(--surface-soft)] hover:text-[var(--foreground)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]",
                  isActive &&
                    "bg-[var(--accent-soft)] font-semibold text-[var(--foreground)] before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:rounded-full before:bg-[var(--accent)]",
                )}
                onClick={onNavigate}
              >
                <DashboardIcon name={item.icon} />
                <span>{t(item.labelKey)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DashboardSidebar() {
  const locale = useLocale();
  const t = useTranslations("Dashboard");

  return (
    <aside className="hidden min-h-svh w-60 shrink-0 border-r border-[var(--border)] bg-[var(--surface)] lg:flex lg:flex-col xl:w-64">
      <div className="flex min-h-18 items-center px-6">
        <Link
          href="/"
          locale={locale}
          className="rounded-[var(--radius-sm)] text-sm font-bold tracking-[-0.035em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          CREATIVE AI
        </Link>
      </div>
      <div className="flex flex-1 flex-col px-3 pb-5 pt-4">
        <DashboardNavigation />
        <div className="mt-auto border-t border-[var(--border)] pt-4">
          <div className="rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-3 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
              {t("account.label")}
            </p>
            <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
              {t("account.description")}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
