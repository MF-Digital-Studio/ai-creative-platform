import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { DashboardIcon } from "@/components/dashboard/dashboard-icons";
import type { DashboardTemplate } from "@/data/dashboard-templates";
import { Link } from "@/i18n/navigation";

export async function TemplateCard({ template }: { template: DashboardTemplate }) {
  const t = await getTranslations("Dashboard.templates");
  const title = t(template.titleKey);

  return (
    <Link
      href="/dashboard#composer"
      aria-label={t("useTemplate", { title })}
      className="dashboard-template-card"
    >
      <span className="dashboard-template-media">
        <Image
          src={template.src}
          alt={t(template.altKey)}
          fill
          sizes="(min-width: 1280px) 230px, (min-width: 768px) 210px, 72vw"
          style={{ objectPosition: template.objectPosition }}
        />
        <span className="dashboard-template-shade" />
      </span>
      <span className="dashboard-template-copy">
        <span>
          <small>{t(`types.${template.typeKey}`)}</small>
          <strong>{title}</strong>
          <span>{t(template.descriptorKey)}</span>
        </span>
        <DashboardIcon name="arrow" />
      </span>
    </Link>
  );
}
