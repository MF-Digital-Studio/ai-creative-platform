import { getTranslations } from "next-intl/server";

import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export async function DashboardTopbar() {
  const t = await getTranslations("Dashboard");

  return (
    <header className="sticky top-0 z-30 flex min-h-18 items-center border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--surface)_94%,transparent)] px-4 sm:px-6 lg:px-8">
      <div className="flex w-full items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <DashboardMobileNav />
          <p className="truncate text-sm font-semibold text-[var(--foreground)]">
            {t("topbar.workspace")}
          </p>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <div className="hidden rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-3 py-2 sm:block">
            <p className="text-xs font-semibold text-[var(--foreground)]">
              {t("topbar.credits")}
              <span className="ml-2 text-[var(--foreground-muted)]">—</span>
            </p>
            <p className="mt-0.5 text-[0.6875rem] leading-4 text-[var(--foreground-muted)]">
              {t("topbar.creditsDescription")}
            </p>
          </div>
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <div
            aria-label={t("account.label")}
            className="hidden min-h-11 items-center rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-3 text-sm font-medium text-[var(--foreground)] sm:flex"
          >
            {t("account.label")}
          </div>
        </div>
      </div>
    </header>
  );
}
