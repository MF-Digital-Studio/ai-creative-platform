import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const footerNavigation = [
  {
    title: "Platform",
    links: [
      { label: "Ürün", href: "#product" },
      { label: "Nasıl Çalışır", href: "#how-it-works" },
      { label: "Şablonlar", href: "#templates" },
      { label: "Örnekler", href: "#showcase" },
      { label: "Fiyatlandırma", href: "#pricing" },
    ],
  },
  {
    title: "Sektörler",
    links: [
      { label: "Takı", href: "#jewelry" },
      { label: "Giyim", href: "#fashion" },
      { label: "Kozmetik", href: "#cosmetics" },
    ],
  },
  {
    title: "Şirket",
    links: [
      { label: "Hakkımızda", href: "/about" },
      { label: "İletişim", href: "/contact" },
      { label: "Gizlilik", href: "/privacy" },
      { label: "Kullanım Koşulları", href: "/terms" },
    ],
  },
] as const;

const socialLinks = [
  { label: "Instagram", href: "#" },
  { label: "LinkedIn", href: "#" },
  { label: "X", href: "#" },
] as const;

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

export function Footer() {
  return (
    <footer className="mt-[var(--section-space)] w-full max-w-[100vw] overflow-hidden bg-[var(--foreground)] text-[var(--background)]">
      <Container>
        <section className="grid grid-cols-1 gap-10 border-b border-[var(--footer-border)] py-[var(--section-space)] lg:grid-cols-[minmax(0,1.35fr)_minmax(16rem,0.65fr)] lg:items-end lg:gap-16">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--footer-muted)]">
              Kampanyanı oluştur
            </p>
            <h2
              className="mt-5 max-w-full text-[clamp(2.25rem,4.1vw,4rem)] font-medium leading-[0.98] tracking-[-0.06em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="block">Bir ürün fotoğrafı.</span>
              <span className="block">
                Baştan sona bir <span className="block lg:inline">kampanya.</span>
              </span>
            </h2>
          </div>

          <div className="min-w-0 max-w-md lg:pb-1">
            <p className="text-base leading-7 text-[var(--footer-muted)]">
              Takı, giyim ve kozmetik ürünlerinizi gerçekçi görsellere ve kısa
              videolara dönüştürün.
            </p>
            <Button href="/signup" className="mt-7" size="lg">
              Ücretsiz Dene →
            </Button>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-12 border-b border-[var(--footer-border)] py-[var(--section-space-compact)] lg:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,0.55fr))] lg:gap-8">
          <div className="max-w-xs">
            <p
              className="text-sm font-extrabold tracking-[-0.025em]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              CREATIVE AI
            </p>
            <p className="mt-4 text-sm leading-6 text-[var(--footer-muted)]">
              Ürün fotoğraflarından kampanyaya hazır içerikler.
            </p>
          </div>

          <nav
            aria-label="Footer platform navigasyonu"
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

        <div className="overflow-hidden py-8 sm:py-10 lg:py-12">
          <p
            aria-hidden="true"
            className="whitespace-nowrap text-center text-[clamp(1.875rem,9vw,10rem)] font-semibold leading-[0.82] tracking-[-0.075em] text-[var(--footer-wordmark)] sm:text-[clamp(2.25rem,11.25vw,10rem)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            CREATIVE AI
          </p>
        </div>

        <div className="flex flex-col gap-5 border-t border-[var(--footer-border)] py-6 text-sm text-[var(--footer-muted)] sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Creative AI. Tüm hakları saklıdır.</p>
          <nav aria-label="Sosyal medya bağlantıları">
            <ul className="flex flex-wrap gap-x-5 gap-y-2" role="list">
              {socialLinks.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
