import { getTranslations } from "next-intl/server";

import { DashboardPlaceholderPage } from "@/components/dashboard/dashboard-placeholder-page";

export default async function FilesPage() {
  const t = await getTranslations("Dashboard.placeholders.files");

  return <DashboardPlaceholderPage eyebrow={t("eyebrow")} title={t("title")} description={t("description")} notice={t("notice")} />;
}
