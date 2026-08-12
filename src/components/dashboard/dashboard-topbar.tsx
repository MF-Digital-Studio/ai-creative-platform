import { getLocale, getTranslations } from "next-intl/server";

import { DashboardMobileNav } from "@/components/dashboard/dashboard-mobile-nav";
import { LanguageSwitcher } from "@/components/layout/language-switcher";

export async function DashboardTopbar() {
  const t = await getTranslations("Dashboard.topbar");
  const locale = await getLocale();

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
            <summary className="dashboard-account-button">{t("account")}</summary>
            <form action={`/${locale}/auth/signout`} method="post">
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
