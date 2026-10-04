import { getTranslations } from "next-intl/server";

import { createProject } from "@/app/[locale]/dashboard/actions";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { ProjectCardMenu } from "@/components/projects/project-card-menu";
import { NewProjectButton } from "@/components/dashboard/new-project-button";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Link, getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import type { Project } from "@/lib/projects/get-projects";

type RecentWorkProps = {
  locale: AppLocale;
  projects: Project[];
  hasMore?: boolean;
  heading?: string;
  sectionId?: string;
};

export async function RecentWork({
  locale,
  projects,
  hasMore = false,
  heading,
  sectionId = "recent-work",
}: RecentWorkProps) {
  const t = await getTranslations("Dashboard.recentWork");
  const composerHref = `${getPathname({ href: "/dashboard", locale })}#composer`;
  const createProjectAction = createProject.bind(null, locale);
  const dateFormatter = new Intl.DateTimeFormat(locale, {dateStyle: "medium"});

  return (
    <section id={sectionId} className="dashboard-content-section dashboard-recent-section" aria-labelledby={`${sectionId}-heading`}>
      <div className="dashboard-section-heading flex flex-wrap items-start justify-between gap-3">
        <h2 id={`${sectionId}-heading`}>{heading ?? t("heading")}</h2>
        <div className="dashboard-recent-actions">
          {hasMore ? (
            <Link href="/dashboard/projects" className="dashboard-view-all-button">
              <span>{t("viewAll")}</span>
              <DashboardIcon name="arrow" />
            </Link>
          ) : null}
          {sectionId === "all-projects" ? <NewProjectButton
            action={createProjectAction}
            messages={{
              create: t("newBlankProject"),
              creating: t("creating"),
              error: t("createError"),
            }}
          /> : null}
        </div>
      </div>
      {projects.length === 0 ? (
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
      ) : (
        <ul className="dashboard-recent-grid">
          {projects.map((project) => {
            const title = project.title?.trim() || t("untitledProject");
            const activityDate = project.latest_generation?.created_at ?? project.updated_at;

            return (
              <li key={project.id} className="dashboard-project-item">
                <Link href={`/dashboard/projects/${project.id}`} className="dashboard-project-card">
                  <span className="dashboard-project-media">
                    {project.thumbnail_url ? (
                      // Private Storage previews reuse the existing signed URL pattern.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={project.thumbnail_url} alt={t("thumbnailAlt", {title})} />
                    ) : (
                      <span className="dashboard-project-placeholder" aria-hidden="true">
                        <DashboardIcon name="assets" />
                        <i />
                      </span>
                    )}
                    <span className="dashboard-project-type-badge">{project.thumbnail_source === "generation" ? t("types.image") : t("types.project")}</span>
                  </span>
                  <span className="dashboard-project-copy">
                    <strong title={title}>{title}</strong>
                    <span className="dashboard-project-meta">
                      <StatusBadge status={project.latest_generation?.status ?? project.status} kind={project.latest_generation ? "generation" : "project"} />
                      <time dateTime={activityDate}>{dateFormatter.format(new Date(activityDate))}</time>
                    </span>
                  </span>
                </Link>
                <ProjectCardMenu projectId={project.id} locale={locale} menuLabel={t("projectActions")} deleteMessages={{title: t("deleteHeading"), description: t("deleteDescription"), menuItem: t("deleteProject"), cancel: t("cancel"), confirm: t("deleteProject"), deleting: t("deleting"), error: t("deleteError")}} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
