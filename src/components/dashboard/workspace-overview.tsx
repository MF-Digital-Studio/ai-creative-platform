import { getTranslations } from "next-intl/server";

export async function WorkspaceOverview({ projectCount, completedCount, activeCount }: { projectCount: number; completedCount: number; activeCount: number }) {
  const t = await getTranslations("Dashboard.overview");
  return <section className="dashboard-overview" aria-labelledby="dashboard-overview-title">
    <div className="dashboard-section-heading"><h2 id="dashboard-overview-title">{t("heading")}</h2></div>
    <div className="dashboard-overview-grid">
      {([ ["projects", projectCount], ["completed", completedCount], ["active", activeCount] ] as const).map(([key, value]) => <div className="dashboard-overview-stat" key={key}><span>{t(key)}</span><strong>{value}</strong></div>)}
    </div>
  </section>;
}
