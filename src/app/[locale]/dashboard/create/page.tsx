import { getTranslations } from "next-intl/server";

import { DashboardPlaceholderPage } from "@/components/dashboard/dashboard-placeholder-page";

export default async function CreatePage() {
  const t = await getTranslations("Dashboard.placeholders.create");

  return <DashboardPlaceholderPage eyebrow={t("eyebrow")} title={t("title")} description={t("description")} notice={t("notice")} />;
}
