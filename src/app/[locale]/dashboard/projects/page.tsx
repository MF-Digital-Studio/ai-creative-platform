import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {getTranslations, setRequestLocale} from "next-intl/server";

import {createProject} from "@/app/[locale]/dashboard/actions";
import {NewProjectButton} from "@/components/dashboard/new-project-button";
import {ProjectGalleryCard} from "@/components/projects/project-gallery-card";
import {ProjectsToolbar} from "@/components/projects/projects-toolbar";
import {Link, getPathname} from "@/i18n/navigation";
import {isSupportedLocale} from "@/i18n/routing";
import {getAuthenticatedUserId} from "@/lib/auth/require-user";
import {getProjectsPage, type ProjectSort, type ProjectStatus} from "@/lib/projects/get-projects";

type ProjectsPageProps = {
  params: Promise<{locale: string}>;
  searchParams: Promise<{q?: string; status?: string; sort?: string; page?: string}>;
};

export async function generateMetadata({params}: ProjectsPageProps): Promise<Metadata> {
  const {locale} = await params;
  if (!isSupportedLocale(locale)) notFound();
  const t = await getTranslations({locale, namespace: "Dashboard.projectsIndex"});
  return {title: t("title")};
}

export default async function ProjectsPage({params, searchParams}: ProjectsPageProps) {
  const {locale} = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale);

  const query = await searchParams;
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 100) : "";
  const status: ProjectStatus | null = query.status === "draft" || query.status === "active" || query.status === "completed" ? query.status : null;
  const sort: ProjectSort = query.sort === "newest" || query.sort === "oldest" ? query.sort : "updated";
  const parsedPage = Number(query.page);
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const userId = await getAuthenticatedUserId();
  const [result, t, tRecent, tPresets] = await Promise.all([
    userId ? getProjectsPage(userId, {page, pageSize: 16, search, status, sort}) : Promise.resolve({projects: [], totalCount: 0, resultCount: 0, page: 1, pageCount: 1}),
    getTranslations({locale, namespace: "Dashboard.projectsIndex"}),
    getTranslations({locale, namespace: "Dashboard.recentWork"}),
    getTranslations({locale, namespace: "Dashboard.presets"}),
  ]);
  const basePath = getPathname({href: "/dashboard/projects", locale});
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (status) params.set("status", status);
    if (sort !== "updated") params.set("sort", sort);
    params.set("page", String(target));
    return `/dashboard/projects?${params}`;
  };
  const cardMessages = {
    untitled: tRecent("untitledProject"),
    previewAlt: tRecent.raw("thumbnailAlt") as string,
    noPreview: t("noPreview"),
    open: t("open"),
    projectActions: tRecent("projectActions"),
    updated: t("updatedLabel"),
    delete: tRecent("delete"),
    deleteProject: tRecent("deleteProject"),
    deleteHeading: tRecent("deleteHeading"),
    deleteDescription: tRecent("deleteDescription"),
    cancel: tRecent("cancel"),
    deleting: tRecent("deleting"),
    deleteError: tRecent("deleteError"),
  };

  return (
    <main className="dashboard-main">
      <div className="dashboard-main-inner dashboard-container dashboard-project-index">
        <header className="projects-index-header">
          <div><h1>{t("title")}</h1><p>{t("count", {count: result.totalCount})}</p></div>
          <NewProjectButton action={createProject.bind(null, locale)} variant="primary" className="projects-create-button" messages={{create: tRecent("newProject"), creating: tRecent("creating"), error: tRecent("createError")}} />
        </header>

        {result.totalCount > 0 ? <ProjectsToolbar action={basePath} search={search} status={status ?? ""} sort={sort} messages={{search: t("search"), searchPlaceholder: t("searchPlaceholder"), status: t("status"), allStatuses: t("allStatuses"), draft: t("draft"), active: t("active"), completed: t("completed"), sort: t("sort"), updated: t("updated"), newest: t("newest"), oldest: t("oldest")}} /> : null}

        {result.projects.length > 0 ? (
          <section aria-label={t("title")} className="projects-gallery-section">
            <p className="projects-result-count">{t("resultCount", {count: result.resultCount})}</p>
            <ul className="projects-gallery-grid">
              {result.projects.map((project) => <ProjectGalleryCard key={project.id} project={project} locale={locale} verticals={tPresets.raw("categories") as Record<string, string>} messages={cardMessages} />)}
            </ul>
          </section>
        ) : (
          <section className="projects-index-empty" aria-live="polite">
            <span className="projects-index-empty-mark" aria-hidden="true">K</span>
            <h2>{result.totalCount === 0 ? t("emptyTitle") : t("noResults")}</h2>
            <p>{result.totalCount === 0 ? t("emptyDescription") : t("noResultsDescription")}</p>
            {result.totalCount === 0 ? <NewProjectButton action={createProject.bind(null, locale)} variant="primary" className="projects-create-button" messages={{create: t("firstProject"), creating: tRecent("creating"), error: tRecent("createError")}} /> : <Link href="/dashboard/projects" className="projects-empty-action">{t("clearFilters")}</Link>}
          </section>
        )}

        {result.pageCount > 1 ? <nav className="projects-pagination" aria-label={t("title")}>{result.page > 1 ? <Link href={pageHref(result.page - 1)}>{t("previous")}</Link> : <span className="projects-pagination-disabled">{t("previous")}</span>}<span>{t("page", {page: result.page, total: result.pageCount})}</span>{result.page < result.pageCount ? <Link href={pageHref(result.page + 1)}>{t("next")}</Link> : <span className="projects-pagination-disabled">{t("next")}</span>}</nav> : null}
      </div>
    </main>
  );
}
