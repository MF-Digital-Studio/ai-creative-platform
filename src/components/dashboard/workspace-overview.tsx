import { getTranslations } from "next-intl/server";

export async function WorkspaceOverview({ projectCount, completedCount, activeCount }: { projectCount: number; completedCount: number; activeCount: number }) {
  const t = await getTranslations("Dashboard.overview");
  const metrics = [
    { key: "completed", value: completedCount },
    { key: "projects", value: projectCount },
    { key: "active", value: activeCount },
  ] as const;

  return <section className="dashboard-overview" aria-labelledby="dashboard-overview-title">
    <div className="dashboard-section-heading">
      <h2 id="dashboard-overview-title">{t("heading")}</h2>
      <p>{t("description")}</p>
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
