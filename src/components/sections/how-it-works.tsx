import Image from "next/image";
import { getTranslations } from "next-intl/server";

import { HowItWorksChat } from "@/components/sections/how-it-works-chat";
import { RevealGroup } from "@/components/motion/reveal-group";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";

const media = {
  product: "/auth/fashion-dress-product.webp",
  onModel: "/auth/fashion-dress-campaign.webp",
  videoPoster: "/auth/fashion-dress-campaign.webp",
} as const;

type StepHeaderProps = {
  number: string;
  title: string;
  description: string;
};

function StepHeader({ number, title, description }: StepHeaderProps) {
  return (
    <header>
      <p className="text-xs font-semibold tracking-[0.14em] text-[var(--accent)]">
        {number}
      </p>
      <h3
        className="mt-4 text-2xl font-semibold leading-tight tracking-[-0.04em] text-[var(--foreground)]"
        style={{ fontFamily: "var(--font-display)" }}
      >
        {title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-[var(--foreground-muted)]">
        {description}
      </p>
    </header>
  );
}

export async function HowItWorks() {
  const t = await getTranslations("HowItWorksSection");

  return (
    <Section
      id="how-it-works"
      spacing="compact"
      className="scroll-mt-[var(--navbar-height)] bg-[var(--background)]"
    >
      <Container>
          <SectionHeading
            eyebrow={t("eyebrow")}
            title={t("heading")}
            description={t("description")}
            className="how-it-works-heading max-w-3xl gap-4"
          />

          <RevealGroup className="mt-12 sm:mt-14" stagger={85}>
          <ol className="grid list-none gap-4 p-0 md:grid-cols-2 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.38fr)_minmax(0,1fr)]">
          <li className="motion-group-item how-it-works-card group flex min-w-0 flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
            <StepHeader
              number={t("cards.idea.number")}
              title={t("cards.idea.title")}
              description={t("cards.idea.description")}
            />

            <div className="mt-8 flex min-h-72 flex-1 flex-col rounded-[var(--radius-sm)] bg-[var(--workspace-canvas)] p-3 text-[var(--workspace-text)]">
              <div className="flex items-center gap-3 border-b border-[var(--workspace-line)] pb-3">
                <div className="relative size-12 shrink-0 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-soft)]">
                  <Image
                    src={media.product}
                    alt={t("cards.product.studioAlt")}
                    fill
                    sizes="48px"
                    className="object-cover"
                  />
                </div>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-[var(--workspace-muted)]">
                  {t("cards.idea.label")}
                </p>
              </div>

              <HowItWorksChat
                prompt={t("cards.idea.prompt")}
                response={t("cards.idea.response")}
                sendLabel={t("cards.idea.send")}
              />
            </div>
          </li>

          <li className="motion-group-item how-it-works-card group flex min-w-0 flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6 md:col-span-2 lg:col-span-1">
            <StepHeader
              number={t("cards.product.number")}
              title={t("cards.product.title")}
              description={t("cards.product.description")}
            />

            <div className="relative mt-8 min-h-72 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--workspace-canvas)] p-3 sm:min-h-80">
              <figure className="how-it-works-model-output absolute inset-y-3 right-3 left-[24%] overflow-hidden rounded-[var(--radius-sm)] bg-[var(--surface-soft)]">
                <Image
                  src={media.onModel}
                  alt={t("cards.product.outputAlt")}
                  fill
                  sizes="(min-width: 1024px) 32vw, (min-width: 768px) 70vw, 75vw"
                  className="how-it-works-model-image object-cover"
                />
                <figcaption className="how-it-works-model-label absolute top-3 right-3 rounded-[var(--radius-sm)] bg-[var(--workspace-video-control)] px-2.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                  {t("cards.product.outputLabel")}
                </figcaption>
              </figure>

              <div className="how-it-works-product-entry absolute bottom-4 left-4 w-[42%] sm:w-[38%]">
                <figure className="how-it-works-product-card overflow-hidden rounded-[var(--radius-sm)] border border-[var(--workspace-line-strong)] bg-[var(--surface-soft)] shadow-[var(--shadow-subtle)]">
                  <div className="relative aspect-square">
                    <Image
                      src={media.product}
                      alt={t("cards.product.studioAlt")}
                      fill
                      sizes="(min-width: 1024px) 16vw, (min-width: 640px) 30vw, 42vw"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="border-t border-[var(--border)] bg-[var(--surface)] px-2.5 py-2 text-[0.625rem] font-semibold uppercase tracking-[0.1em] text-[var(--foreground)]">
                    {t("cards.product.productLabel")}
                  </figcaption>
                </figure>
              </div>

              <span
                aria-hidden="true"
                className="absolute top-1/2 left-[18%] flex size-7 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--workspace-line-strong)] bg-[var(--workspace-panel)] text-sm text-[var(--workspace-text)]"
              >
                +
              </span>
            </div>
          </li>

          <li className="motion-group-item how-it-works-card group flex min-w-0 flex-col rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-6">
            <StepHeader
              number={t("cards.video.number")}
              title={t("cards.video.title")}
              description={t("cards.video.description")}
            />

            <figure className="relative mt-8 min-h-72 flex-1 overflow-hidden rounded-[var(--radius-sm)] bg-[var(--workspace-canvas)]">
              <Image
                src={media.videoPoster}
                alt={t("cards.video.posterAlt")}
                fill
                sizes="(min-width: 1024px) 28vw, (min-width: 768px) 45vw, 100vw"
                className="object-cover"
              />
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-[linear-gradient(to_top,var(--workspace-media-shade),transparent_48%)]"
              />
              <p className="absolute top-3 left-3 rounded-[var(--radius-sm)] bg-[var(--workspace-video-control)] px-2.5 py-1.5 text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-white backdrop-blur-sm">
                {t("cards.video.label")}
              </p>
              <span
                aria-hidden="true"
                className="how-it-works-play absolute top-1/2 left-1/2 flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/30 bg-[var(--workspace-video-control)] text-white backdrop-blur-sm"
              >
                <svg viewBox="0 0 20 20" className="ml-0.5 size-4" fill="none">
                  <path
                    d="m7.25 5.75 7 4.25-7 4.25v-8.5Z"
                    fill="currentColor"
                  />
                </svg>
              </span>
              <figcaption className="absolute right-3 bottom-3 left-3 text-xs font-medium text-white">
                {t("cards.video.fallbackLabel")}
              </figcaption>
            </figure>
          </li>
        </ol>
        </RevealGroup>
      </Container>
    </Section>
  );
}
