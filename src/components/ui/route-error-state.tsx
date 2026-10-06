"use client";

import {useEffect} from "react";
import {useLocale, useTranslations} from "next-intl";

import {AppState} from "@/components/ui/app-state";
import {Button} from "@/components/ui/button";

export function RouteErrorState({error, retry}: {error: Error & {digest?: string}; retry: () => void}) {
  const locale = useLocale();
  const t = useTranslations("AppStates.error");

  useEffect(() => { console.error(error); }, [error]);

  return <main className="app-state-page"><AppState icon="warning" role="alert" title={t("title")} description={t("description")} actions={<><Button onClick={retry}>{t("retry")}</Button><Button href={`/${locale}/dashboard`} variant="secondary">{t("dashboard")}</Button></>} /></main>;
}

