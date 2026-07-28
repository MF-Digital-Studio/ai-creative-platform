import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";

import { HeroPromptDemo } from "@/components/sections/hero-prompt-demo";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { getPathname } from "@/i18n/navigation";

type HeroMedia = {
  altKey:
    | "productInputAlt"
    | "jewelryAlt"
    | "fashionAlt"
    | "cosmeticsAlt"
    | "shortVideoAlt";
  className: string;
  labelKey: "productInput" | "jewelry" | "fashion" | "cosmetics" | "shortVideo";
  preload?: boolean;
  sizes: string;
  src: string;
  videoPreview?: boolean;
};

const heroMedia: HeroMedia[] = [
  {
    altKey: "jewelryAlt",
    className: "hero-media-jewelry",
    labelKey: "jewelry",
    sizes: "(min-width: 1280px) 20vw, (min-width: 640px) 30vw, 42vw",
    src: "/hero/jewelry-output.svg",
  },
  {
    altKey: "fashionAlt",
    className: "hero-media-fashion",
    labelKey: "fashion",
    preload: true,
    sizes: "(min-width: 1280px) 40vw, (min-width: 640px) 48vw, 78vw",
    src: "/hero/fashion-output.svg",
  },
  {
    altKey: "cosmeticsAlt",
    className: "hero-media-cosmetics",
    labelKey: "cosmetics",
    sizes: "(min-width: 1280px) 23vw, (min-width: 640px) 32vw, 44vw",
    src: "/hero/cosmetics-output.svg",
  },
  {
    altKey: "productInputAlt",
    className: "hero-media-input",
    labelKey: "productInput",
    sizes: "(min-width: 1280px) 17vw, 24vw",
    src: "/hero/product-input.svg",
  },
  {
    altKey: "shortVideoAlt",
    className: "hero-media-video",
    labelKey: "shortVideo",
    sizes: "(min-width: 1280px) 27vw, 38vw",
    src: "/hero/video-output.svg",
    videoPreview: true,
  },
];

export async function Hero() {
  const locale = await getLocale();
  const t = await getTranslations("Hero");
  const prompts = [t("promptOne"), t("promptTwo"), t("promptThree")];

  return (
    <section
      aria-labelledby="hero-title"
      className="hero-section relative isolate overflow-hidden"
    >
      <Container className="relative py-[clamp(3.5rem,7vw,7rem)]">
        <div className="mx-auto flex w-full max-w-[82rem] flex-col items-center text-center">
          <p className="hero-eyebrow text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
            {t("eyebrow")}
          </p>
          <h1
            id="hero-title"
            className="hero-title mt-5 w-full font-bold py-4 leading-[0.92] tracking-[-0.065em] text-[clamp(3rem,6vw,6.5rem)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="block xl:whitespace-nowrap">{t("titleLead")}</span>
            <span className="block xl:whitespace-nowrap">{t("titleTrail")}</span>
          </h1>
          <p className="hero-copy mt-6 max-w-2xl py-2 text-base leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8">
            {t("description")}
          </p>

          <div
            role="group"
            aria-labelledby="hero-prompt-label"
            className="hero-prompt-shell mt-9 w-full max-w-5xl text-left sm:mt-11"
          >
            <div className="min-w-0 flex-1 px-1 py-1 sm:px-2">
              <p
                id="hero-prompt-label"
                className="mb-2 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--foreground-muted)]"
              >
                {t("promptLabel")}
              </p>
              <HeroPromptDemo prompts={prompts} />
            </div>
            <Button
              href={getPathname({
                href: siteConfig.routes.signup,
                locale,
              })}
              className="w-full sm:w-auto"
              size="lg"
              variant="dark"
            >
              {t("primaryCta")}
            </Button>
          </div>
        </div>

        <div className="hero-work-heading mx-auto mt-14 flex max-w-[82rem] items-center gap-4 sm:mt-20">
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
          <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.13em] text-[var(--foreground-muted)]">
            {t("scrollHelper")}
          </p>
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--border)]" />
        </div>

        <div
          role="group"
          aria-label={t("mediaStageLabel")}
          className="hero-visual-stage relative mx-auto mt-8 h-[31rem] w-full max-w-[82rem] sm:h-[38rem] lg:h-[42rem]"
        >
          {heroMedia.map((media) => (
            <figure
              key={media.src}
              className={`hero-media-card ${media.className}`}
            >
              <Image
                fill
                alt={t(media.altKey)}
                className="object-cover"
                preload={media.preload}
                sizes={media.sizes}
                src={media.src}
              />
              {media.videoPreview ? (
                <span aria-hidden="true" className="hero-video-marker">
                  <span />
                </span>
              ) : null}
              <figcaption className="hero-media-caption">
                <span>{t(media.labelKey)}</span>
                <span>{t("mediaPlaceholder")}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </Container>
    </section>
  );
}
