import Link from "next/link";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { navigationItems } from "@/data/navigation";

function NavigationLink({
  href,
  label,
}: (typeof navigationItems)[number]) {
  return (
    <Link
      href={href}
      className="navbar-link rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium tracking-[-0.01em] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
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
  return (
    <header className="sticky top-0 z-50 bg-[var(--navbar-surface)]">
      <Container>
        <nav
          aria-label="Ana navigasyon"
          className="relative grid h-[var(--navbar-height)] grid-cols-[1fr_auto] items-center border-b border-[var(--border)] xl:grid-cols-[1fr_auto_1fr]"
        >
          <Link
            href="/"
            aria-label="Creative AI ana sayfa"
            className="w-max whitespace-nowrap rounded-[var(--radius-sm)] py-2 pr-2 text-sm font-extrabold tracking-[-0.025em] transition-opacity duration-(--transition-fast) hover:opacity-65 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CREATIVE AI
          </Link>

          <div className="hidden items-center justify-center gap-2 xl:flex">
            {navigationItems.map((item) => (
              <NavigationLink key={item.href} {...item} />
            ))}
          </div>

          <div className="hidden items-center justify-self-end gap-3 xl:flex">
            <Link
              href="/login"
              className="rounded-[var(--radius-sm)] px-2 py-2 text-sm font-medium transition-colors duration-(--transition-fast) hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
            >
              Giriş Yap
            </Link>
            <Button href="/signup" variant="dark" size="sm">
              Ücretsiz Dene
            </Button>
          </div>

          <MobileNavigation />
        </nav>
      </Container>
    </header>
  );
}
