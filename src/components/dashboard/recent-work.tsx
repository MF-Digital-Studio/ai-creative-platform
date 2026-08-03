import { getTranslations } from "next-intl/server";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { Button } from "@/components/ui/button";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";

export async function RecentWork({ locale }: { locale: AppLocale }) {
  const t = await getTranslations("Dashboard.recentWork");
  const composerHref = `${getPathname({ href: "/dashboard", locale })}#composer`;

  return (
    <section id="recent-work" className="dashboard-content-section dashboard-recent-section" aria-labelledby="dashboard-recent-heading">
      <div className="dashboard-section-heading">
        <h2 id="dashboard-recent-heading">{t("heading")}</h2>
      </div>
      <div className="dashboard-empty-state">
        <div className="dashboard-empty-mark" aria-hidden="true">
          <DashboardIcon name="spark" />
        </div>
        <div>
          <h3>{t("emptyHeading")}</h3>
          <p>{t("emptyDescription")}</p>
        </div>
        <Button href={composerHref} variant="secondary" size="sm">
          <span>{t("startCreating")}</span>
          <DashboardIcon name="arrow" className="dashboard-empty-cta-icon" />
        </Button>
      </div>
    </section>
  );
}
