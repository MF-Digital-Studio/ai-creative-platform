import { getTranslations } from "next-intl/server";

import { BeforeAfterSlider } from "@/components/sections/before-after-slider";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export async function BeforeAfter() {
  const t = await getTranslations("BeforeAfterSection");

  return (
    <Section
      id="templates"
      aria-labelledby="before-after-title"
      spacing="large"
      className="scroll-mt-[var(--navbar-height)] overflow-x-clip bg-[var(--background)]"
    >
      <Container>
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1.3fr)_minmax(18rem,0.7fr)] lg:items-end lg:gap-16">
          <div className="max-w-4xl">
            <Badge>{t("eyebrow")}</Badge>
            <h2
              id="before-after-title"
              className="mt-5 whitespace-pre-line text-[clamp(2.5rem,4.75vw,4.5rem)] font-medium leading-[0.94] tracking-[-0.06em] text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("heading")}
            </h2>
          </div>
          <p className="max-w-xl text-base leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8 lg:pb-1">
            {t("description")}
          </p>
        </header>

        <div className="mt-12 sm:mt-16">
          <BeforeAfterSlider
            beforeAlt={t("beforeAlt")}
            beforeCaption={t("beforeCaption")}
            beforeLabel={t("beforeLabel")}
            afterAlt={t("afterAlt")}
            afterCaption={t("afterCaption")}
            afterLabel={t("afterLabel")}
            handleLabel={t("handleLabel")}
          />
        </div>
      </Container>
    </Section>
  );
}
