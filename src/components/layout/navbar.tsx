"use client";

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

  function scrollHomeToTop() {
    if (pathname === "/") {
      window.scrollTo({ top: 0 });
    }
  }

  return (
    <header className="sticky top-0 z-50 bg-[var(--navbar-surface)]">
      <Container>
        <nav
          aria-label={navigationT("mainLabel")}
          className="relative grid h-[var(--navbar-height)] grid-cols-[1fr_auto] items-center border-b border-[var(--border)] xl:grid-cols-[1fr_auto_1fr]"
        >
          <Link
            href={siteConfig.routes.home}
            aria-label={navigationT("homeLabel", { brand: siteConfig.name })}
            className="w-max whitespace-nowrap rounded-[var(--radius-sm)] py-2 pr-2 text-sm font-bold tracking-[-0.025em] transition-opacity duration-(--transition-fast) hover:opacity-65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {siteConfig.name}
          </Link>

          <div className="hidden items-center justify-center gap-2 xl:flex">
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

          <div className="hidden items-center justify-self-end gap-3 xl:flex">
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
            >
              {navigationT("tryForFree")}
            </Button>
          </div>

          <MobileNavigation />
        </nav>
      </Container>
    </header>
  );
}
