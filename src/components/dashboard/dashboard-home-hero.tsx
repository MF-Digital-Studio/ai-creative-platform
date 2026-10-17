import { getTranslations } from "next-intl/server";

export async function DashboardHomeHero() {
  const t = await getTranslations("Dashboard.home");

  return (
    <header className="dashboard-home-hero">
      <div className="dashboard-home-hero-copy">
        <p className="dashboard-home-eyebrow"><span aria-hidden="true" />{t("eyebrow")}</p>
        <h1>{t("title")}</h1>
        <p className="dashboard-home-description">{t("description")}</p>
      </div>
    </header>
  );
}
