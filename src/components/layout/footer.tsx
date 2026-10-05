import { getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { navigationItems } from "@/data/navigation";
import { Link } from "@/i18n/navigation";

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
        { label: footerT("fashion"), href: "#apparel" },
        { label: footerT("watch"), href: "#watch" },
        { label: footerT("cosmetics"), href: "#cosmetics" },
        { label: footerT("footwear"), href: "#footwear" },
        { label: footerT("bags"), href: "#bags" },
      ],
    },
    {
      title: footerT("company"),
      links: [
        { label: footerT("contact"), href: siteConfig.routes.contact },
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
    <footer className="public-footer w-full max-w-[100vw] overflow-hidden bg-[var(--foreground)] text-[var(--background)]">
      <Container variant="public">
        <section className="grid grid-cols-1 gap-12 border-b border-[var(--footer-border)] py-[clamp(4rem,6vw,6rem)] lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.55fr))] lg:gap-12">
          <div className="max-w-xs">
            <p
              className="text-lg font-bold tracking-[-0.035em]"
            >
              {siteConfig.name}
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--footer-muted)]">
              {footerT("shortDescription")}
            </p>
          </div>

          <nav
            aria-label={footerT("navigationLabel")}
            className="grid grid-cols-2 gap-x-7 gap-y-10 sm:grid-cols-3 lg:col-span-3 lg:gap-8"
          >
            {footerNavigation.map((group) => (
              <div key={group.title}>
                <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--footer-muted)]">
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
