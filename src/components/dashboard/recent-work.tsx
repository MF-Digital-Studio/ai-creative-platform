import { getTranslations } from "next-intl/server";

import { createProject, deleteProject } from "@/app/[locale]/dashboard/actions";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { DeleteProjectButton } from "@/components/dashboard/delete-project-button";
import { NewProjectButton } from "@/components/dashboard/new-project-button";
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
          <NewProjectButton
            action={createProjectAction}
            messages={{
              create: t("newProject"),
              creating: t("creating"),
              error: t("createError"),
            }}
          />
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
            const title = project.title ?? t("untitledProject");
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
                    <span className="dashboard-project-type-badge">
                      {project.latest_generation
                        ? t(`types.${project.latest_generation.generation_type}`)
                        : t("types.project")}
                    </span>
                  </span>
                  <span className="dashboard-project-copy">
                    <strong title={title}>{title}</strong>
                    <span className="dashboard-project-meta">
                      <span>
                        {project.latest_generation
                          ? `${t(`types.${project.latest_generation.generation_type}`)} · ${t(`generationStatus.${project.latest_generation.status}`)}`
                          : `${t("types.project")} · ${t(`status.${project.status}`)}`}
                      </span>
                      <time dateTime={activityDate}>{dateFormatter.format(new Date(activityDate))}</time>
                    </span>
                  </span>
                </Link>
                <DeleteProjectButton
                  action={deleteProject.bind(null, locale, project.id)}
                  messages={{
                    label: t("delete"),
                    confirmHeading: t("deleteHeading"),
                    confirm: t("deleteConfirm", {title}),
                    cancel: t("cancel"),
                    deleting: t("deleting"),
                    error: t("deleteError"),
                  }}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
