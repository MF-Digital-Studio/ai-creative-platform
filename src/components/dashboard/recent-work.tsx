import { getTranslations } from "next-intl/server";

import { createProject } from "@/app/[locale]/dashboard/actions";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { NewProjectButton } from "@/components/dashboard/new-project-button";
import { Button } from "@/components/ui/button";
import { Link, getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import type { Project } from "@/lib/projects/get-projects";

type RecentWorkProps = {
  locale: AppLocale;
  projects: Project[];
};

export async function RecentWork({ locale, projects }: RecentWorkProps) {
  const t = await getTranslations("Dashboard.recentWork");
  const composerHref = `${getPathname({ href: "/dashboard", locale })}#composer`;
  const createProjectAction = createProject.bind(null, locale);
  const dateFormatter = new Intl.DateTimeFormat(locale, {dateStyle: "medium"});

  return (
    <section id="recent-work" className="dashboard-content-section dashboard-recent-section" aria-labelledby="dashboard-recent-heading">
      <div className="dashboard-section-heading flex flex-wrap items-start justify-between gap-3">
        <h2 id="dashboard-recent-heading">{t("heading")}</h2>
        <NewProjectButton
          action={createProjectAction}
          messages={{
            create: t("newProject"),
            creating: t("creating"),
            error: t("createError"),
          }}
        />
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
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <li key={project.id} className="rounded-[var(--radius-md)] border border-[var(--dashboard-border)] bg-[var(--dashboard-surface)] p-4">
              <Link
                href={`/dashboard/projects/${project.id}`}
                className="block rounded-[var(--radius-sm)] outline-none transition-colors hover:text-[var(--dashboard-foreground)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--dashboard-focus)]"
              >
                <p className="truncate text-sm font-medium text-[var(--dashboard-foreground)]">
                  {project.title ?? t("untitledProject")}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[var(--dashboard-muted)]">
                  <span>{t(`status.${project.status}`)}</span>
                  <time dateTime={project.created_at}>{dateFormatter.format(new Date(project.created_at))}</time>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
