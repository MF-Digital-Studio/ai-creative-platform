import { getTranslations } from "next-intl/server";

import { CreativePresetRail } from "@/components/dashboard/creative-preset-rail";
import type { SupportedVertical } from "@/lib/verticals/supported-verticals";

export async function TemplateRail({ vertical }: { vertical?: SupportedVertical | null }) {
  const t = await getTranslations("Dashboard.presets");

  return (
    <section id="templates" className="dashboard-content-section" aria-labelledby="dashboard-templates-heading">
      <div className="dashboard-section-heading">
        <h2 id="dashboard-templates-heading">{vertical ? t("recommendedHeading") : t("heading")}</h2>
        <p>{vertical ? t("recommendedDescription") : t("description")}</p>
      </div>
      <CreativePresetRail vertical={vertical} />
    </section>
  );
}
