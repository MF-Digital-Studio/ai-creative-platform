import { getTranslations } from "next-intl/server";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { Link } from "@/i18n/navigation";

export async function WorkspaceOverview({ projectCount, completedCount, activeCount }: { projectCount: number; completedCount: number; activeCount: number }) {
  const t = await getTranslations("Dashboard.overview");
  const metrics = [
    { key: "completed", value: completedCount },
    { key: "projects", value: projectCount },
    { key: "active", value: activeCount },
  ] as const;

  return <section className="dashboard-overview" aria-labelledby="dashboard-overview-title">
    <div className="dashboard-section-heading dashboard-overview-heading">
      <div><h2 id="dashboard-overview-title">{t("heading")}</h2><p>{t("description")}</p></div>
      <Link href="/dashboard/projects" className="dashboard-overview-link">{t("openProjects")}<DashboardIcon name="arrow" /></Link>
    </div>
    <dl className="dashboard-overview-summary">
      {metrics.map(({ key, value }) => <div className="dashboard-overview-metric" key={key}>
        <dd>{value}</dd>
        <dt>{t(key)}</dt>
        <p>{t(`${key}Description`)}</p>
      </div>)}
    </dl>
  </section>;
}
