import { getLocale, getTranslations } from "next-intl/server";
import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Link } from "@/i18n/navigation";
import type { DashboardGeneration } from "@/lib/generations/get-dashboard-generations";

export async function RecentGenerations({ generations }: { generations: DashboardGeneration[] }) {
  const t = await getTranslations("Dashboard.generations");
  const locale = await getLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, { dateStyle: "medium" });
  return <section className="dashboard-content-section" aria-labelledby="recent-generations-title">
    <div className="dashboard-section-heading"><h2 id="recent-generations-title">{t("heading")}</h2></div>
    {generations.length === 0 ? <div className="dashboard-empty-state"><div className="dashboard-empty-mark" aria-hidden="true"><DashboardIcon name="assets" /></div><div><h3>{t("emptyHeading")}</h3><p>{t("emptyDescription")}</p></div><Link href="/dashboard#composer" className="dashboard-view-all-button">{t("start")}</Link></div> :
      <ul className="dashboard-generation-grid">{generations.map((generation) => <li key={generation.id}>
        <Link href={`/dashboard/projects/${generation.projectId}`} className="dashboard-generation-card">
          <span className="dashboard-generation-media">{generation.previewUrl ? (
            // Private Storage previews use short-lived signed URLs.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={generation.previewUrl} alt={t("previewAlt", { title: generation.projectTitle ?? t("untitled") })} />
          ) : <DashboardIcon name="assets" />}</span>
          <span className="dashboard-generation-copy"><strong>{generation.projectTitle ?? t("untitled")}</strong><time dateTime={generation.createdAt}>{dateFormatter.format(new Date(generation.createdAt))}</time><StatusBadge status={generation.status} /></span>
        </Link>
      </li>)}</ul>}
  </section>;
}
