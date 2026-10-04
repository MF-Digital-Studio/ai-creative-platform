import { getTranslations } from "next-intl/server";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { ProjectCardMenu } from "@/components/projects/project-card-menu";
import { Link } from "@/i18n/navigation";
import type { ProjectDetail } from "@/lib/projects/get-project";
import type { AppLocale } from "@/i18n/routing";
import { ProjectTitleEditor } from "@/components/projects/project-title-editor";

export async function ProjectHeader({ project, locale }: { project: ProjectDetail; locale: AppLocale }) {
  const t = await getTranslations("Dashboard.project");
  const updated = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(project.updated_at));
  return <header className="project-page-header">
    <Link href="/dashboard/projects" className="project-back-link"><svg aria-hidden="true" viewBox="0 0 20 20" fill="none"><path d="M12.5 4.5 7 10l5.5 5.5M7.5 10h9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>{t("backToProjects")}</Link>
    <div className="project-title-row">
      <div className="project-title-copy"><ProjectTitleEditor projectId={project.id} locale={locale} title={project.title} fallback={t("untitledProject")} messages={{edit: t("rename.edit"), description: t("rename.description"), label: t("rename.label"), placeholder: t("rename.placeholder"), save: t("rename.save"), cancel: t("rename.cancel"), saving: t("rename.saving"), error: t("rename.error")}} /><span className="project-updated"><time dateTime={project.updated_at}>{t("updated", { date: updated })}</time></span></div>
      <div className="project-header-actions"><StatusBadge status={project.status} kind="project" /><ProjectCardMenu projectId={project.id} locale={locale} menuLabel={t("actionsFor")} redirectOnSuccess deleteMessages={{title: t("deleteHeading"), description: t("deleteDescription"), menuItem: t("deleteProject"), cancel: t("cancel"), confirm: t("deleteProject"), deleting: t("deleting"), error: t("deleteError")}} /></div>
    </div>
  </header>;
}
