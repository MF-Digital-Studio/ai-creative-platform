import { getLocale, getTranslations } from "next-intl/server";

import { DashboardEmptyState } from "@/components/dashboard/dashboard-empty-state";
import { Link } from "@/i18n/navigation";

export type RecentProject = {
  id: string;
  title: string;
};

export async function RecentProjects({
  projects,
}: {
  projects: readonly RecentProject[];
}) {
  const [locale, t] = await Promise.all([
    getLocale(),
    getTranslations("Dashboard"),
  ]);

  return (
    <section className="dashboard-section" aria-labelledby="recent-projects-heading">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 id="recent-projects-heading" className="text-lg font-semibold tracking-[-0.035em] text-[var(--foreground)]">
          {t("home.recentProjects")}
        </h2>
        <Link href="/dashboard/projects" locale={locale} className="rounded-[var(--radius-sm)] py-2 text-sm font-semibold text-[var(--foreground-muted)] transition-colors duration-(--transition-fast) hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]">
          {t("home.viewAll")}
        </Link>
      </div>
      {projects.length === 0 ? (
        <DashboardEmptyState
          title={t("emptyStates.projectsTitle")}
          description={t("emptyStates.projectsDescription")}
          action={{ href: `/${locale}/dashboard/create`, label: t("emptyStates.projectsAction") }}
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2" role="list">
          {projects.map((project) => (
            <li key={project.id} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-4 text-sm font-medium text-[var(--foreground)]">
              {project.title}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
