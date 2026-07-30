"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { navigationItems } from "@/data/navigation";
import { getPathname, Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

const mobileMenuId = "mobile-navigation-panel";

export function MobileNavigation() {
  const locale = useLocale();
  const navigationT = useTranslations("Navigation");
  const commonT = useTranslations("Common");
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("keydown", handleEscape);

    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  function closeMenu() {
    setIsOpen(false);
  }

  function handleNavigation(key: (typeof navigationItems)[number]["key"]) {
    closeMenu();

    if (key === "home" && pathname === "/") {
      window.scrollTo({ top: 0 });
    }
  }

  return (
    <div className="justify-self-end xl:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="group inline-flex h-11 items-center gap-3 rounded-[var(--radius-sm)] px-3 text-sm font-medium text-[var(--foreground)] shadow-[var(--shadow-subtle)] transition-colors duration-(--transition-fast) hover:bg-[var(--surface-soft)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
        aria-controls={mobileMenuId}
        aria-expanded={isOpen}
        aria-label={isOpen ? commonT("closeMenu") : commonT("openMenu")}
        onClick={() => setIsOpen((current) => !current)}
      >
        <span>{commonT("menu")}</span>
        <span aria-hidden="true" className="relative block h-4 w-5">
          <span
            className={cn(
              "absolute left-0 top-1 h-px w-5 bg-current transition-transform duration-(--navbar-transition-duration) ease-(--button-transition-ease) motion-reduce:transition-none",
              isOpen && "translate-y-1 rotate-45",
            )}
          />
          <span
            className={cn(
              "absolute bottom-1 left-0 h-px w-5 bg-current transition-transform duration-(--navbar-transition-duration) ease-(--button-transition-ease) motion-reduce:transition-none",
              isOpen && "-translate-y-1 -rotate-45",
            )}
          />
        </span>
      </button>

      {isOpen ? (
        <div
          id={mobileMenuId}
          className="absolute inset-x-0 top-full border-b border-[var(--border)] bg-[var(--surface)]"
        >
          <div className="py-3">
            <div className="flex flex-col">
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={
                    "activePath" in item && pathname === item.activePath
                      ? "page"
                      : undefined
                  }
                  className={cn(
                    "flex min-h-12 items-center rounded-[var(--radius-sm)] px-3 text-base font-medium tracking-[-0.01em] transition-colors duration-(--transition-fast) hover:bg-[var(--surface-soft)] hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]",
                    "activePath" in item &&
                      pathname === item.activePath &&
                      "font-semibold",
                  )}
                  onClick={() => handleNavigation(item.key)}
                >
                  {navigationT(item.key)}
                </Link>
              ))}
            </div>

            <div className="mt-3 flex items-center gap-3 border-t border-[var(--border)] px-3 pt-4">
              <Link
                href={siteConfig.routes.login}
                className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] px-2 text-sm font-medium transition-colors duration-(--transition-fast) hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
                onClick={closeMenu}
              >
                {navigationT("signIn")}
              </Link>
              <Button
                href={getPathname({
                  href: siteConfig.routes.signup,
                  locale,
                })}
                variant="dark"
                size="sm"
                onClick={closeMenu}
              >
                {navigationT("tryForFree")}
              </Button>
            </div>

            <div className="mt-3 border-t border-[var(--border)] px-3 pt-3">
              <LanguageSwitcher
                variant="mobile"
                onLocaleChange={closeMenu}
              />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
