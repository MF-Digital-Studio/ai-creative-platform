import { getTranslations } from "next-intl/server";

import { FaqAccordion } from "@/components/sections/faq-accordion";
import { AnimatedHeading } from "@/components/motion/animated-heading";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { faqItems } from "@/data/faq";
import { Link } from "@/i18n/navigation";

export async function Faq() {
  const t = await getTranslations("FaqSection");
  const translatedItems = faqItems.map((item) => ({
    id: item.id,
    question: t(item.questionKey),
    answer: t(item.answerKey),
  }));

  return (
    <Section
      id="faq"
      aria-labelledby="faq-title"
      className="scroll-mt-[var(--navbar-height)] overflow-x-clip bg-[var(--background)]"
    >
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1fr)] lg:gap-20 xl:gap-28">
          <header className="min-w-0 max-w-xl">
            <Reveal variant="fade"><Badge>{t("eyebrow")}</Badge></Reveal>
            <AnimatedHeading
              id="faq-title"
              lines={t("heading").split("\n")}
              className="mt-5 whitespace-pre-line text-[clamp(2.5rem,4.5vw,4.5rem)] font-semibold leading-[0.94] tracking-[-0.06em] text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            />
            <Reveal delay={100} className="mt-6 max-w-lg"><p className="text-base leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8">
              {t("description")}
            </p></Reveal>
            <Reveal delay={180} className="mt-7 max-w-xs">
              <p className="text-sm leading-6 text-[var(--foreground-muted)]">
                {t("supportText")}
              </p>
              <Link
                href="/contact"
                className="group mt-2 inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-sm)] font-semibold text-[var(--foreground)] transition-colors duration-[var(--transition-fast)] hover:text-[var(--foreground)] hover:underline hover:decoration-[var(--accent)] hover:underline-offset-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--focus-ring)]"
              >
                {t("supportLink")}
                <span aria-hidden="true">→</span>
              </Link>
            </Reveal>
          </header>

          <Reveal delay={130} className="min-w-0">
            <FaqAccordion items={translatedItems} />
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
