import { getLocale, getTranslations } from "next-intl/server";

import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export async function DashboardTopbar({ displayName }: { displayName?: string | null }) {
  const t = await getTranslations("Dashboard.topbar");
  const locale = await getLocale();
  const accountLabel = displayName?.trim() || t("account");

  return (
    <header className="dashboard-topbar">
      <div className="dashboard-topbar-inner">
        <div className="dashboard-topbar-context">
          <DashboardMobileNav />
          <span>{t("workspace")}</span>
        </div>
        <div className="dashboard-topbar-actions">
          <span className="dashboard-credits" title={t("creditsHint")}>
            <span>{t("credits")}</span>
            <small>{t("creditsHint")}</small>
          </span>
          <LanguageSwitcher />
          <details className="dashboard-account-menu">
            <summary className="dashboard-account-button">
              <span className="max-w-40 truncate whitespace-nowrap" title={accountLabel}>{accountLabel}</span>
            </summary>
            <form action={`/${locale}/auth/signout`} method="post">
              <Link href="/dashboard/account" className="dashboard-sign-out-button block">
                {t("profile")}
              </Link>
              <button type="submit" className="dashboard-sign-out-button">
                {t("signOut")}
              </button>
            </form>
          </details>
        </div>
      </div>
    </header>
  );
}
