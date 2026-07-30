import { getLocale, getTranslations } from "next-intl/server";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { navigationItems } from "@/data/navigation";
import { getPathname, Link } from "@/i18n/navigation";

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="footer-link inline-flex w-fit rounded-[var(--radius-sm)] py-1 text-sm text-[var(--background)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
    >
      {label}
    </Link>
  );
}

export async function Footer() {
  const locale = await getLocale();
  const footerT = await getTranslations("Footer");
  const navigationT = await getTranslations("Navigation");
  const footerNavigation = [
    {
      title: footerT("platform"),
      links: navigationItems.map((item) => ({
        label: navigationT(item.key),
        href: item.href,
      })),
    },
    {
      title: footerT("industries"),
      links: [
        { label: footerT("jewelry"), href: "#jewelry" },
        { label: footerT("fashion"), href: "#fashion" },
        { label: footerT("cosmetics"), href: "#cosmetics" },
      ],
    },
    {
      title: footerT("company"),
      links: [
        { label: footerT("about"), href: siteConfig.routes.about },
        { label: footerT("contact"), href: siteConfig.routes.contact },
        { label: footerT("privacy"), href: siteConfig.routes.privacy },
        { label: footerT("terms"), href: siteConfig.routes.terms },
      ],
    },
  ];
  const socialLinks = [
    {
      label: footerT("instagramLabel"),
      href: siteConfig.links.instagram,
    },
    {
      label: footerT("linkedinLabel"),
      href: siteConfig.links.linkedin,
    },
    { label: footerT("xLabel"), href: siteConfig.links.x },
  ].filter((link) => link.href);

  return (
    <footer className="w-full max-w-[100vw] overflow-hidden bg-[var(--foreground)] text-[var(--background)]">
      <Container>
        <section className="grid grid-cols-1 gap-10 border-b border-[var(--footer-border)] py-[var(--section-space)] lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] lg:items-end lg:gap-16">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--footer-muted)]">
              {footerT("eyebrow")}
            </p>
            <h2
              className="mt-5 max-w-full text-[clamp(2.25rem,4.1vw,4rem)] font-medium leading-[0.98] tracking-[-0.06em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="block">{footerT("ctaTitleLead")}</span>
              <span className="block">{footerT("ctaTitleTrail")}</span>
            </h2>
          </div>

          <div className="min-w-0 max-w-md lg:pb-1">
            <p className="text-base leading-7 text-[var(--footer-muted)]">
              {footerT("description")}
            </p>
            <Button
              href={getPathname({
                href: siteConfig.routes.signup,
                locale,
              })}
              className="mt-7"
              size="lg"
            >
              {footerT("cta")}
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-12 border-b border-[var(--footer-border)] py-[var(--section-space-compact)] lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.55fr))] lg:gap-8">
          <div className="max-w-xs">
            <p
              className="text-sm font-bold tracking-[-0.025em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {siteConfig.name}
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--footer-muted)]">
              {footerT("shortDescription")}
            </p>
          </div>

          <nav
            aria-label={footerT("navigationLabel")}
            className="grid grid-cols-2 gap-x-7 gap-y-10 sm:grid-cols-3 lg:col-span-3 lg:gap-8"
          >
            {footerNavigation.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-medium uppercase tracking-[0.16em] text-[var(--footer-muted)]">
                  {group.title}
                </h3>
                <ul className="mt-4 space-y-2" role="list">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <FooterLink {...link} />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </section>

        <div className="overflow-hidden py-8 sm:py-10 lg:py-12">
          <p
            aria-hidden="true"
            className="whitespace-nowrap text-center text-[clamp(1.875rem,9vw,10rem)] font-semibold leading-[0.82] tracking-[-0.075em] text-[var(--footer-wordmark)] sm:text-[clamp(2.25rem,11.25vw,10rem)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {siteConfig.name}
          </p>
        </div>

        <div className="flex flex-col gap-5 border-t border-[var(--footer-border)] py-6 text-sm text-[var(--footer-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>
            {footerT("copyright", {
              year: 2026,
              brand: siteConfig.name,
            })}
          </p>
          {socialLinks.length > 0 ? (
            <nav aria-label={footerT("socialNavigationLabel")}>
              <ul className="flex flex-wrap gap-x-5 gap-y-2" role="list">
                {socialLinks.map((link) => (
                  <li key={link.label}>
                    <FooterLink {...link} />
                  </li>
                ))}
              </ul>
            </nav>
          ) : null}
        </div>
      </Container>
    </footer>
  );
}
