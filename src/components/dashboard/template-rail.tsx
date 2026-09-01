import { getTranslations } from "next-intl/server";

import { CreativePresetRail } from "@/components/dashboard/creative-preset-rail";
import { InspirationGrid } from "@/components/dashboard/inspiration-grid";

export async function TemplateRail() {
  const t = await getTranslations("Dashboard.presets");

  return (
    <section id="templates" className="dashboard-content-section" aria-labelledby="dashboard-templates-heading">
      <div className="dashboard-section-heading">
        <h2 id="dashboard-templates-heading">{t("heading")}</h2>
        <p>{t("description")}</p>
      </div>
      <CreativePresetRail />
      <InspirationGrid />
    </section>
  );
}
