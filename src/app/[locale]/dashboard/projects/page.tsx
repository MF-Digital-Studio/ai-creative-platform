import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {RecentWork} from "@/components/dashboard/recent-work";
import {Link} from "@/i18n/navigation";
import {isSupportedLocale} from "@/i18n/routing";
import {getAuthenticatedUserId} from "@/lib/auth/require-user";
import {getProjects} from "@/lib/projects/get-projects";

type ProjectsPageProps = {
  params: Promise<{locale: string}>;
};

export async function generateMetadata({params}: ProjectsPageProps): Promise<Metadata> {
  const {locale} = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({locale, namespace: "Dashboard.recentWork"});
  return {title: t("allMetadataTitle")};
}

export default async function ProjectsPage({params}: ProjectsPageProps) {
  const {locale} = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const userId = await getAuthenticatedUserId();
  const [projects, t] = await Promise.all([
    userId ? getProjects(userId) : [],
    getTranslations({locale, namespace: "Dashboard.recentWork"}),
  ]);

  return (
    <main className="dashboard-main">
      <div className="dashboard-main-inner dashboard-project-index">
        <header className="dashboard-project-index-header">
          <Link href="/dashboard" className="project-back-link">
            <span aria-hidden="true">←</span>
            {t("backToWorkspace")}
          </Link>
          <p>{t("allEyebrow")}</p>
          <h1>{t("allHeading")}</h1>
        </header>
        <RecentWork locale={locale} projects={projects} heading={t("allHeading")} sectionId="all-projects" />
      </div>
    </main>
  );
}
