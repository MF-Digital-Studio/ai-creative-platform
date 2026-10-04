import Image from "next/image";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { siteConfig } from "@/config/site";
import { isSupportedLocale } from "@/i18n/routing";
import { getPathname } from "@/i18n/navigation";

type HomeProps = { params: Promise<{ locale: string }> };

const categories = [
  ["apparel", "/presets/apparel-scenic-editorial.png"],
  ["jewelry", "/presets/jewelry-on-body.png"],
  ["watch", "/presets/watch-on-wrist.png"],
  ["cosmetics", "/presets/cosmetics-aesthetic-setting.png"],
  ["footwear", "/presets/footwear-street-lifestyle.png"],
] as const;

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  setRequestLocale(locale);

  const t = await getTranslations("HomeRedesign");
  const localeValue = await getLocale();
  const signupHref = getPathname({ href: siteConfig.routes.signup, locale: localeValue });
  const dashboardHref = getPathname({ href: "/dashboard", locale: localeValue });

  return (
    <>
      <Navbar />
      <main className="homepage-main">
        <Section className="homepage-hero !pt-[clamp(3rem,6vw,5rem)] overflow-hidden" spacing="compact">
          <Container variant="public">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12">
              <header className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.16em] text-[var(--foreground-muted)]">{t("eyebrow")}</p>
                <h1 className="homepage-hero-title mt-5 text-[clamp(2.5rem,4.4vw,3.5rem)] font-semibold leading-[1] tracking-[-0.04em] text-[var(--foreground)]">{t("heroTitle")}</h1>
                <p className="mt-6 max-w-lg text-base leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8">{t("heroDescription")}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <Button href={signupHref} size="lg">{t("try")}</Button>
                  <a className="inline-flex min-h-12 items-center rounded-[var(--radius-sm)] px-4 text-sm font-medium text-[var(--foreground)] underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]" href="#how-it-works">{t("howLink")}</a>
                </div>
              </header>
              <figure className="relative min-w-0">
                <div className="relative ml-[8%] aspect-[4/3] overflow-hidden bg-[var(--surface-soft)] sm:ml-[10%]">
                  <Image src="/features/product-to-campaign/campaign-output.webp" alt={t("heroOutputAlt")} fill priority sizes="(min-width: 1024px) 58vw, 100vw" className="object-cover" />
                </div>
                <div className="absolute bottom-[8%] left-0 w-[22%] border border-[var(--border)] bg-[var(--surface)] p-1 shadow-[var(--shadow-subtle)] sm:w-[19%] sm:p-1.5">
                  <div className="relative aspect-square bg-[var(--surface-soft)]"><Image src="/features/product-to-campaign/product-input.webp" alt={t("heroProductAlt")} fill sizes="(min-width: 1024px) 18vw, 35vw" className="object-contain" /></div>
                  <figcaption className="px-1 pt-2 text-[0.65rem] font-medium text-[var(--foreground-muted)] sm:text-xs">{t("sourceLabel")}</figcaption>
                </div>
                <figcaption className="mt-3 text-right text-xs text-[var(--foreground-muted)]">{t("outputLabel")}</figcaption>
              </figure>
            </div>
          </Container>
        </Section>

        <Section id="examples" className="bg-[var(--surface-soft)]" spacing="compact">
          <Container variant="public">
            <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)] lg:gap-16">
              <div>
                <SectionHeading className="min-w-0 max-w-none" titleClassName="homepage-section-title" title={t("fidelityTitle")} description={t("fidelityDescription")} />
                <ul className="mt-7 space-y-3 border-t border-[var(--border)] pt-5 text-sm font-medium text-[var(--foreground)]">
                  {["principle1", "principle2", "principle3"].map((key) => <li key={key} className="flex gap-3"><span aria-hidden="true">↗</span>{t(key)}</li>)}
                </ul>
              </div>
              <figure className="grid grid-cols-[0.8fr_1.2fr] items-start gap-2 sm:gap-4">
                <div className="relative aspect-square bg-[var(--surface)]"><Image src="/features/product-fidelity/original-product.webp" alt={t("fidelitySourceAlt")} fill sizes="(min-width: 1024px) 24vw, 38vw" className="object-cover" /><span className="absolute bottom-3 left-3 bg-[var(--surface)] px-3 py-1.5 text-xs">{t("sourceLabel")}</span></div>
                <div className="relative aspect-[2/3] bg-[var(--surface)]"><Image src="/features/product-fidelity/generated-scene.webp" alt={t("fidelityOutputAlt")} fill sizes="(min-width: 1024px) 36vw, 58vw" className="object-cover" /><span className="absolute bottom-3 left-3 bg-[var(--surface)] px-3 py-1.5 text-xs">{t("outputLabel")}</span></div>
              </figure>
            </div>
          </Container>
        </Section>

        <Section id="how-it-works" className="homepage-section-compact" spacing="compact">
          <Container variant="public">
            <SectionHeading className="min-w-0 max-w-none" titleClassName="homepage-section-title" title={t("stepsTitle")} />
            <ol className="mt-10 grid min-h-56 list-none gap-8 border-t border-[var(--border)] p-0 sm:grid-cols-3 sm:gap-8">
              {["step1", "step2", "step3"].map((key, index) => <li key={key} className="pt-6"><p className="text-2xl font-semibold leading-none tracking-[-0.05em] text-[var(--foreground-muted)]">0{index + 1}</p><h3 className="mt-5 text-2xl font-semibold leading-[1.12] tracking-[-0.025em]">{t(`${key}Title`)}</h3><p className="mt-3 max-w-[34ch] text-base leading-7 text-[var(--foreground-muted)]">{t(`${key}Description`)}</p></li>)}
            </ol>
          </Container>
        </Section>

        <Section id="categories" className="homepage-section-compact bg-[var(--surface-soft)]" spacing="compact">
          <Container variant="public">
            <SectionHeading className="min-w-0 max-w-none" titleClassName="homepage-section-title" title={t("categoryTitle")} description={t("categoryDescription")} />
            <div className="homepage-category-grid mt-9 grid grid-cols-2 gap-3 sm:grid-cols-6 sm:gap-4">
              {categories.map(([key, src], index) => <figure id={key} key={key} className={`min-w-0 scroll-mt-[var(--navbar-height)] ${index === 0 ? "homepage-category-featured" : ""}`}><div className="relative h-full min-h-36 overflow-hidden bg-[var(--surface)]"><Image src={src} alt={t(`${key}Alt`)} fill sizes="(min-width: 1024px) 17vw, (min-width: 640px) 32vw, 48vw" className="object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transition-none" /></div><figcaption className="pt-3 text-sm font-medium">{t(key)}</figcaption></figure>)}
            </div>
          </Container>
        </Section>

        <Section className="homepage-section-compact" spacing="compact">
          <Container variant="public">
            <div className="grid items-center gap-9 lg:grid-cols-2 lg:gap-16">
              <div><SectionHeading className="min-w-0 max-w-none" titleClassName="homepage-section-title" title={t("referenceTitle")} description={t("referenceDescription")} /><p className="mt-7 max-w-md text-sm leading-6 text-[var(--foreground-muted)]">{t("referenceNote")}</p></div>
              <div className="grid grid-cols-[0.8fr_auto_1.5fr] items-center gap-3 sm:gap-5">
                <div className="grid grid-cols-2 gap-2">
                  {["/presets/apparel-studio-style.png", "/presets/apparel-scenic-editorial.png"].map((src, index) => <div key={src} className="relative aspect-[3/4] min-w-0 bg-[var(--surface-soft)]"><Image src={src} alt={t(index === 0 ? "presetAlt" : "referenceAlt")} fill sizes="(min-width: 1024px) 12vw, 20vw" className="object-cover" /></div>)}
                </div>
                <span aria-hidden="true" className="text-sm text-[var(--foreground-muted)]">→</span>
                <div className="relative aspect-[4/3] min-w-0 overflow-hidden bg-[var(--surface-soft)]"><Image src="/workspace-demo/fashion/campaign.webp" alt={t("outputAlt")} fill sizes="(min-width: 1024px) 34vw, 50vw" className="object-cover" /></div>
              </div>
            </div>
          </Container>
        </Section>

        <Section className="homepage-campaign-section pb-0" spacing="compact">
          <Container variant="public">
            <div className="mb-10 grid items-end gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
              <h2 className="homepage-section-title min-w-0 font-semibold">{t("campaignTitle")}</h2>
              <p className="max-w-sm text-sm leading-6 text-[var(--foreground-muted)]">{t("campaignDescription")}</p>
            </div>
          </Container>
          <div className="homepage-campaign-gallery grid grid-cols-2 gap-1 sm:grid-cols-3">
            {[
              ["/workspace-demo/fashion/campaign.webp", "campaignAlt1"],
              ["/workspace-demo/jewelry/campaign-hero.webp", "campaignAlt2"],
              ["/workspace-demo/jewelry/campaign.webp", "campaignAlt3"],
            ].map(([src, alt], index) => <figure key={src} className={`relative aspect-[3/2] min-w-0 overflow-hidden bg-[var(--surface-soft)] ${index === 0 ? "col-span-2 sm:col-span-1" : ""}`}><Image src={src} alt={t(alt)} fill sizes="(min-width: 640px) 34vw, (min-width: 375px) 50vw, 100vw" className="object-cover" /></figure>)}
          </div>
        </Section>

        <Section className="homepage-workspace-band" spacing="compact">
          <Container variant="public">
            <div className="grid items-center gap-9 lg:grid-cols-[minmax(0,0.7fr)_minmax(0,1.3fr)] lg:gap-14">
              <div><p className="text-xs font-semibold tracking-[0.16em] opacity-70">{t("workspaceEyebrow")}</p><h2 className="homepage-section-title mt-4 font-semibold">{t("workspaceTitle")}</h2><p className="mt-5 max-w-[38ch] text-base leading-7 opacity-75">{t("workspaceDescription")}</p><Button href={dashboardHref} className="workspace-cta mt-7">{t("workspaceLink")}</Button></div>
              <div className="homepage-workspace-frame">
                <div className="homepage-workspace-topbar"><span aria-hidden="true" className="flex gap-1.5"><i /><i /><i /></span><span className="font-medium">{siteConfig.name}</span><span className="opacity-65">{t("workspaceProject")}</span></div>
                <div className="homepage-workspace-content">
                  <figure className="relative aspect-[16/10] min-w-0 overflow-hidden bg-[var(--surface-soft)]"><Image src="/workspace-demo/fashion/campaign-hero.webp" alt={t("workspaceAlt")} fill sizes="(min-width: 1024px) 48vw, 100vw" className="object-cover" /></figure>
                  <aside className="homepage-workspace-aside"><p>{t("workspacePreview")}</p><div className="relative aspect-square overflow-hidden bg-[var(--surface-soft)]"><Image src="/workspace-demo/fashion/product.webp" alt={t("heroProductAlt")} fill sizes="120px" className="object-cover" /></div><div className="relative aspect-[4/3] overflow-hidden bg-[var(--surface-soft)]"><Image src="/workspace-demo/fashion/social.webp" alt={t("campaignAlt2")} fill sizes="120px" className="object-cover" /></div><span>{t("workspaceHistory")}</span></aside>
                </div>
              </div>
            </div>
          </Container>
        </Section>

        <Section id="faq" className="homepage-section-compact" spacing="compact">
          <Container variant="public">
            <SectionHeading className="min-w-0 max-w-none" titleClassName="homepage-section-title" title={t("faqTitle")} />
            <div className="mt-8 divide-y divide-[var(--border)] border-y border-[var(--border)]">
              {[1, 2, 3, 4, 5, 6].map((index) => <details key={index} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]">{t(`faq${index}Question`)}<span aria-hidden="true" className="text-xl text-[var(--foreground-muted)] group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl pr-8 text-base leading-7 text-[var(--foreground-muted)]">{t(`faq${index}Answer`)}</p></details>)}
            </div>
          </Container>
        </Section>

        <Section className="homepage-section-compact bg-[var(--surface-soft)] text-center" spacing="compact">
          <Container variant="public"><div className="py-5"><h2 className="homepage-section-title font-semibold">{t("ctaTitle")}</h2><p className="mx-auto mt-4 max-w-[52ch] text-base leading-7 text-[var(--foreground-muted)]">{t("ctaDescription")}</p><Button href={signupHref} size="lg" className="mt-6">{t("ctaButton")}</Button></div></Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
