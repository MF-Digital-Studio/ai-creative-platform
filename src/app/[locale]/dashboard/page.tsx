import { getLocale, getTranslations } from "next-intl/server";

import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header";
import { DashboardSummaryCard } from "@/components/dashboard/dashboard-summary-card";
import { RecentGenerations } from "@/components/dashboard/recent-generations";
import { RecentProjects } from "@/components/dashboard/recent-projects";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Dashboard"),
  ]);

  return (
    <div className="space-y-10 lg:space-y-12">
      <DashboardPageHeader
        eyebrow={t("home.eyebrow")}
        title={t("home.title")}
        description={t("home.description")}
        cta={{ href: `/${locale}/dashboard/create`, label: t("home.createCampaign") }}
      />

      <section className="dashboard-campaign-panel rounded-[var(--radius-md)] bg-[var(--foreground)] px-6 py-7 text-white shadow-[var(--shadow-subtle)] sm:px-8 sm:py-9">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/65">
            {t("home.campaignEyebrow")}
          </p>
          <h2 className="mt-3 break-words text-[clamp(1.75rem,3vw,2.5rem)] font-semibold leading-[1.04] tracking-[-0.05em] [overflow-wrap:anywhere]" style={{ fontFamily: "var(--font-display)" }}>
            {t("home.campaignTitle")}
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-6 text-white/70 sm:text-base sm:leading-7">
            {t("home.campaignDescription")}
          </p>
          <Button href={`/${locale}/dashboard/create`} variant="secondary" className="mt-6 bg-white">
            {t("home.createCampaign")}
          </Button>
        </div>
      </section>

      <section aria-label={t("home.summaryLabel")} className="grid gap-4 sm:grid-cols-3">
        <DashboardSummaryCard label={t("summary.creditsLabel")} value="—" description={t("summary.creditsDescription")} />
        <DashboardSummaryCard label={t("summary.projectsLabel")} value="0" description={t("summary.projectsDescription")} />
        <DashboardSummaryCard label={t("summary.generationsLabel")} value="0" description={t("summary.generationsDescription")} />
      </section>

      <RecentProjects projects={[]} />
      <RecentGenerations outputs={[]} />
    </div>
  );
}
