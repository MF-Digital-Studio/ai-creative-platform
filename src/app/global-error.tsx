"use client";

import {useEffect, useSyncExternalStore} from "react";
import "./globals.css";

const copy = {
  tr: {title: "Bir şeyler ters gitti", description: "İsteğinizi tamamlayamadık. Tekrar deneyebilirsiniz.", retry: "Tekrar dene", dashboard: "Ana sayfaya dön"},
  en: {title: "Something went wrong", description: "We couldn't complete your request. Please try again.", retry: "Try again", dashboard: "Back to dashboard"},
};

export default function GlobalError({error, unstable_retry}: {error: Error & {digest?: string}; unstable_retry: () => void}) {
  const locale = useSyncExternalStore<"tr" | "en">(() => () => undefined, () => window.location.pathname.startsWith("/en") ? "en" : "tr", () => "tr");
  useEffect(() => { console.error(error); }, [error]);
  const t = copy[locale];
  return <html lang={locale} data-theme="light"><body><title>{t.title} | Klay.ai</title><main className="app-state-page"><section className="app-state" role="alert"><div className="app-state-icon" aria-hidden="true">!</div><h1>{t.title}</h1><p>{t.description}</p><div className="app-state-actions"><button className="app-state-button app-state-button-primary" onClick={unstable_retry}>{t.retry}</button><a className="app-state-button" href={`/${locale}/dashboard`}>{t.dashboard}</a></div></section></main></body></html>;
}
