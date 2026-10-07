import { getLocale, getTranslations } from "next-intl/server";
import { RecentGenerationsGallery } from "@/components/dashboard/recent-generations-gallery";
import type { DashboardGeneration } from "@/lib/generations/get-dashboard-generations";
import { toggleGenerationFavorite } from "@/app/[locale]/dashboard/favorite-actions";
import type { AppLocale } from "@/i18n/routing";

export async function RecentGenerations({ generations }: { generations: DashboardGeneration[] }) {
  const t = await getTranslations("Dashboard.generations");
  const locale = await getLocale();
  const messages = {
    heading: t("heading"), emptyHeading: t("emptyHeading"), emptyDescription: t("emptyDescription"),
    start: t("start"), untitled: t("untitled"), previewAlt: t("previewAlt", { title: "{title}" }),
    fullscreen: t("fullscreen"), project: t("openProject"), edit: t("edit"),
    closeFullscreen: t("closeFullscreen"), zoomIn: t("zoomIn"), zoomOut: t("zoomOut"), resetZoom: t("resetZoom"),
    favoriteAdd: t("favoriteAdd"), favoriteRemove: t("favoriteRemove"), favoriteError: t("favoriteError"),
  };
  return <RecentGenerationsGallery generations={generations} messages={messages} locale={locale} favoriteAction={toggleGenerationFavorite.bind(null, locale as AppLocale)} />;
}
