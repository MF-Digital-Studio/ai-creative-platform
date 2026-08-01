"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { navigationItems } from "@/data/navigation";
import { getPathname, Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/cn";

function NavigationLink({
  href,
  isActive,
  label,
  onClick,
}: {
  href: (typeof navigationItems)[number]["href"];
  isActive: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "navbar-link rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]",
        isActive && "font-semibold",
      )}
      onClick={onClick}
    >
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" className="navbar-label-viewport">
        <span className="navbar-label-copy navbar-label-current">{label}</span>
        <span className="navbar-label-copy navbar-label-next">{label}</span>
      </span>
    </Link>
  );
}

export function Navbar() {
  const locale = useLocale();
  const navigationT = useTranslations("Navigation");
  const pathname = usePathname();
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    let frameId: number | undefined;

    function updateState() {
      frameId = undefined;
      const nextIsCompact = window.scrollY > 32;
      setIsCompact((current) =>
        current === nextIsCompact ? current : nextIsCompact,
      );
    }

    function handleScroll() {
      if (frameId === undefined) {
        frameId = window.requestAnimationFrame(updateState);
      }
    }

    updateState();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frameId !== undefined) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  function scrollHomeToTop() {
    if (pathname === "/") {
      window.scrollTo({ top: 0 });
    }
  }

  return (
    <>
      <header
        className="navbar-shell navbar-intro"
        data-state={isCompact ? "compact" : "top"}
      >
        <Container className="navbar-container">
          <nav
            aria-label={navigationT("mainLabel")}
            className="navbar-bar"
          >
          <Link
            href={siteConfig.routes.home}
            aria-label={navigationT("homeLabel", { brand: siteConfig.name })}
            className="navbar-brand"
            style={{ fontFamily: "var(--font-display)" }}
            onClick={scrollHomeToTop}
          >
            {siteConfig.name}
          </Link>

          <div className="navbar-desktop-nav">
            {navigationItems.map((item) => (
              <NavigationLink
                key={item.href}
                href={item.href}
                isActive={"activePath" in item && pathname === item.activePath}
                label={navigationT(item.key)}
                onClick={item.key === "home" ? scrollHomeToTop : undefined}
              />
            ))}
          </div>

          <div className="navbar-desktop-actions">
            <Link
              href={siteConfig.routes.login}
              className="rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium transition-colors duration-(--transition-fast) hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
            >
              {navigationT("signIn")}
            </Link>
            <LanguageSwitcher />
            <Button
              href={getPathname({
                href: siteConfig.routes.signup,
                locale,
              })}
              variant="dark"
              size="sm"
              className="navbar-cta"
            >
              {navigationT("tryForFree")}
            </Button>
          </div>

            <MobileNavigation />
          </nav>
        </Container>
      </header>
      <div aria-hidden="true" className="navbar-spacer" />
    </>
  );
}
