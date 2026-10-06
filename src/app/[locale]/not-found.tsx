import type {Metadata} from "next";
import {getLocale, getTranslations} from "next-intl/server";

import {AppState} from "@/components/ui/app-state";
import {Button} from "@/components/ui/button";
import {isSupportedLocale} from "@/i18n/routing";

export const metadata: Metadata = {title: "Page not found | Klay.ai"};

export default async function NotFound() {
  const requestedLocale = await getLocale();
  const locale = isSupportedLocale(requestedLocale) ? requestedLocale : "tr";
  const t = await getTranslations({locale, namespace: "AppStates.notFound"});
  return <main className="app-state-page"><AppState code="404" icon="search" title={t("title")} description={t("description")} actions={<><Button href={`/${locale}/dashboard`}>{t("dashboard")}</Button><Button href={`/${locale}/dashboard/projects`} variant="secondary">{t("projects")}</Button></>} /></main>;
}

