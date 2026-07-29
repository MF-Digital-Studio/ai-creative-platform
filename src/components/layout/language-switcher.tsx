"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import { useLocale, useTranslations } from "next-intl";

import { usePathname, useRouter } from "@/i18n/navigation";
import {
  isSupportedLocale,
  routing,
  type AppLocale,
} from "@/i18n/routing";
import { cn } from "@/lib/cn";

type LanguageSwitcherProps = {
  onLocaleChange?: () => void;
  variant?: "desktop" | "mobile";
};

export function LanguageSwitcher({
  onLocaleChange,
  variant = "desktop",
}: LanguageSwitcherProps) {
  const locale = useLocale();
  const t = useTranslations("LanguageSwitcher");
  const pathname = usePathname();
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [isOpen, setIsOpen] = useState(false);

  const activeLocale = isSupportedLocale(locale)
    ? locale
    : routing.defaultLocale;
  const activeIndex = routing.locales.indexOf(activeLocale);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    optionRefs.current[activeIndex]?.focus();

    function handlePointerDown(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !rootRef.current?.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [activeIndex, isOpen]);

  function selectLocale(nextLocale: AppLocale) {
    setIsOpen(false);
    onLocaleChange?.();

    if (nextLocale === activeLocale) {
      triggerRef.current?.focus();
      return;
    }

    const locationSuffix = `${window.location.search}${window.location.hash}`;
    router.replace(`${pathname}${locationSuffix}`, { locale: nextLocale });
  }

  function handleOptionKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    let nextIndex: number | undefined;

    if (event.key === "ArrowDown") {
      nextIndex = (index + 1) % routing.locales.length;
    } else if (event.key === "ArrowUp") {
      nextIndex =
        (index - 1 + routing.locales.length) % routing.locales.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = routing.locales.length - 1;
    }

    if (nextIndex !== undefined) {
      event.preventDefault();
      optionRefs.current[nextIndex]?.focus();
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn("relative", variant === "mobile" && "w-full")}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-controls={menuId}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label={t("label")}
        className={cn(
          "inline-flex min-h-11 items-center justify-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold uppercase tracking-[0.08em] transition-colors duration-(--transition-fast) hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]",
          variant === "mobile" && "w-full justify-between normal-case tracking-normal",
        )}
        onClick={() => setIsOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setIsOpen(true);
          }
        }}
      >
        {variant === "mobile" ? (
          <span>{`${t("label")}: ${activeLocale.toUpperCase()}`}</span>
        ) : (
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-[1.125rem] w-[1.125rem]"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          >
            <circle cx="12" cy="12" r="8.5" />
            <path d="M3.9 12h16.2M12 3.5c2.1 2.3 3.2 5.16 3.2 8.5S14.1 18.2 12 20.5C9.9 18.2 8.8 15.34 8.8 12S9.9 5.8 12 3.5Z" />
          </svg>
        )}
        <svg
          aria-hidden="true"
          viewBox="0 0 12 8"
          className={cn(
            "h-2 w-3 transition-transform duration-(--transition-fast) motion-reduce:transition-none",
            isOpen && "rotate-180",
          )}
        >
          <path
            d="M1 1.25 6 6.25l5-5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </button>

      {isOpen ? (
        <div
          id={menuId}
          role="menu"
          aria-label={t("menuLabel")}
          className={cn(
            "language-menu absolute top-[calc(100%+0.5rem)] z-60 min-w-44 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-subtle)]",
            variant === "desktop" ? "right-0" : "inset-x-0 w-full",
          )}
        >
          {routing.locales.map((optionLocale, index) => {
            const isActive = optionLocale === activeLocale;
            const label = t(`localeNames.${optionLocale}`);

            return (
              <button
                key={optionLocale}
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                aria-current={isActive ? "true" : undefined}
                aria-label={`${t("switchTo")} ${label}`}
                className={cn(
                  "flex min-h-11 w-full items-center justify-between gap-4 rounded-[var(--radius-sm)] px-3 text-left text-sm transition-colors duration-(--transition-fast) hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]",
                  isActive && "font-semibold text-[var(--accent)]",
                )}
                onClick={() => selectLocale(optionLocale)}
                onKeyDown={(event) => handleOptionKeyDown(event, index)}
              >
                <span>{label}</span>
                {isActive ? (
                  <span
                    aria-hidden="true"
                    className="h-1.5 w-1.5 rounded-full bg-current"
                  />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
