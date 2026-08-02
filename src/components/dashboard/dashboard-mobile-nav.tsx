"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { DashboardNavigation } from "@/components/dashboard/dashboard-sidebar";
import { Link } from "@/i18n/navigation";

export function DashboardMobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const locale = useLocale();
  const t = useTranslations("Dashboard");

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function closeDrawer(returnFocus = false) {
    setIsOpen(false);
    if (returnFocus) {
      menuButtonRef.current?.focus();
    }
  }

  return (
    <div className="lg:hidden">
      <button
        ref={menuButtonRef}
        type="button"
        aria-controls="dashboard-mobile-drawer"
        aria-expanded={isOpen}
        aria-label={isOpen ? t("mobileNav.close") : t("mobileNav.open")}
        className="inline-grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-sm)] text-[var(--foreground)] transition-colors duration-(--transition-fast) hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
        onClick={() => setIsOpen((current) => !current)}
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeWidth="1.7"
        >
          {isOpen ? <path d="m7 7 10 10M17 7 7 17" /> : <path d="M4.5 7.5h15M4.5 12h15M4.5 16.5h15" />}
        </svg>
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50" role="presentation">
          <button
            type="button"
            aria-label={t("mobileNav.close")}
            className="absolute inset-0 cursor-default bg-[color-mix(in_srgb,var(--foreground)_28%,transparent)]"
            onClick={() => closeDrawer(true)}
          />
          <aside
            id="dashboard-mobile-drawer"
            role="dialog"
            aria-modal="true"
            aria-label={t("mobileNav.label")}
            className="dashboard-mobile-drawer relative flex h-full w-[86vw] max-w-80 flex-col border-r border-[var(--border)] bg-[var(--surface)] shadow-[var(--shadow-subtle)]"
          >
            <div className="flex min-h-18 items-center justify-between border-b border-[var(--border)] px-5">
              <Link
                href="/"
                locale={locale}
                className="rounded-[var(--radius-sm)] text-sm font-bold tracking-[-0.035em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
                style={{ fontFamily: "var(--font-display)" }}
                onClick={() => closeDrawer()}
              >
                CREATIVE AI
              </Link>
              <button
                type="button"
                aria-label={t("mobileNav.close")}
                className="inline-grid min-h-11 min-w-11 place-items-center rounded-[var(--radius-sm)] text-[var(--foreground)] transition-colors duration-(--transition-fast) hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
                onClick={() => closeDrawer(true)}
              >
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7">
                  <path d="m7 7 10 10M17 7 7 17" />
                </svg>
              </button>
            </div>
            <div className="flex flex-1 flex-col overflow-y-auto px-3 py-4">
              <DashboardNavigation onNavigate={() => closeDrawer()} />
              <div className="mt-auto space-y-3 border-t border-[var(--border)] pt-4">
                <LanguageSwitcher variant="mobile" onLocaleChange={() => closeDrawer()} />
                <div className="rounded-[var(--radius-sm)] bg-[var(--surface-soft)] px-3 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--foreground-muted)]">
                    {t("account.label")}
                  </p>
                  <p className="mt-1 text-sm font-medium text-[var(--foreground)]">
                    {t("account.description")}
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </div>
  );
}
