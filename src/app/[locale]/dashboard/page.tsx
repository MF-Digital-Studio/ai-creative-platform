import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CreativeComposer } from "@/components/dashboard/creative-composer";
import { InspirationGrid } from "@/components/dashboard/inspiration-grid";
import { RecentWork } from "@/components/dashboard/recent-work";
import { TemplateRail } from "@/components/dashboard/template-rail";
import { isSupportedLocale } from "@/i18n/routing";

type DashboardPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: DashboardPageProps): Promise<Metadata> {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Dashboard" });
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <main className="dashboard-main">
      <div className="dashboard-main-inner">
        <CreativeComposer />
        <TemplateRail />
        <InspirationGrid />
        <RecentWork locale={locale} />
      </div>
    </main>
  );
}
