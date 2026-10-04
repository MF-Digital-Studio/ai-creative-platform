import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { CreativeComposer } from "@/components/dashboard/creative-composer";
import { RecentWork } from "@/components/dashboard/recent-work";
import { TemplateRail } from "@/components/dashboard/template-rail";
import { WorkspaceOverview } from "@/components/dashboard/workspace-overview";
import { RecentGenerations } from "@/components/dashboard/recent-generations";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getProjects } from "@/lib/projects/get-projects";
import { getDashboardGenerations } from "@/lib/generations/get-dashboard-generations";
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

  const userId = await getAuthenticatedUserId();
  const [loadedProjects, dashboardData] = userId ? await Promise.all([getProjects(userId, 7), getDashboardGenerations(userId)]) : [[], { projectCount: 0, completedCount: 0, activeCount: 0, generations: [] }];
  const hasMoreProjects = loadedProjects.length > 6;
  const projects = loadedProjects.slice(0, 6);

  return (
    <main className="dashboard-main">
      <div className="dashboard-main-inner dashboard-container">
        <CreativeComposer locale={locale} userId={userId} />
        <TemplateRail />
        <WorkspaceOverview projectCount={dashboardData.projectCount} completedCount={dashboardData.completedCount} activeCount={dashboardData.activeCount} />
        <RecentWork locale={locale} projects={projects} hasMore={hasMoreProjects} />
        <RecentGenerations generations={dashboardData.generations} />
      </div>
    </main>
  );
}
