import { getTranslations } from "next-intl/server";

import { TemplateCard } from "@/components/dashboard/template-card";
import { dashboardTemplates } from "@/data/dashboard-templates";

export async function TemplateRail() {
  const t = await getTranslations("Dashboard.templates");

  return (
    <section id="templates" className="dashboard-content-section" aria-labelledby="dashboard-templates-heading">
      <div className="dashboard-section-heading">
        <h2 id="dashboard-templates-heading">{t("heading")}</h2>
        <p>{t("description")}</p>
      </div>
      <div className="dashboard-template-rail">
        {dashboardTemplates.map((template) => (
          <TemplateCard key={template.id} template={template} />
        ))}
      </div>
    </section>
  );
}
