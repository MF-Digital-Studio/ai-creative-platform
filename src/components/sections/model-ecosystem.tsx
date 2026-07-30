import Image from "next/image";

import { getTranslations } from "next-intl/server";

import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { modelRailItems } from "@/data/model-ecosystem";

export async function ModelEcosystem() {
  const t = await getTranslations("ModelEcosystem");
  return (
    <Section
      id="models"
      aria-labelledby="model-ecosystem-title"
      className="w-full max-w-[100vw] overflow-x-hidden bg-[var(--background)]"
    >
      <Container>
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end lg:gap-16">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--accent)]">
              {t("eyebrow")}
            </p>
            <h2
              id="model-ecosystem-title"
              className="mt-5 text-[clamp(2.5rem,5.2vw,4rem)] font-medium leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              <span className="block">{t("titleLead")}</span>
              <span className="block">{t("titleTrail")}</span>
            </h2>
          </div>
          <div className="max-w-xl lg:pb-1">
            <p className="text-base leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8">
              {t("description")}
            </p>
            <p className="mt-5 text-xs font-medium text-[var(--foreground-muted)]">
              {t("status")}
            </p>
          </div>
        </header>

        <ul
          className="mt-16 grid grid-cols-2 gap-x-4 gap-y-12 px-1 py-10 sm:grid-cols-3 sm:gap-x-6 sm:px-2 lg:grid-cols-7 lg:gap-x-4 lg:gap-y-0 lg:px-4 lg:py-12"
          role="list"
        >
          {modelRailItems.map((item) => (
            <li
              key={item.id}
              className="model-rail-item flex min-h-28 min-w-0 flex-col items-center text-center last:col-span-2 sm:last:col-span-3 lg:last:col-span-1"
            >
              <div className="flex size-11 items-center justify-center">
                {item.logoSrc ? (
                  <Image
                    src={item.logoSrc}
                    alt=""
                    width={44}
                    height={44}
                    className={`h-auto max-h-10 w-auto max-w-10 object-contain opacity-90 ${item.logoScaleClassName ?? ""}`}
                  />
                ) : (
                  <p className="text-lg font-semibold leading-none tracking-[-0.055em] text-[var(--foreground)]">
                    {item.wordmark}
                  </p>
                )}
              </div>
              <p className="mt-5 min-h-4 whitespace-nowrap text-sm font-semibold leading-none tracking-[-0.035em] text-[var(--foreground)]">
                {item.name}
              </p>
              <p className="model-rail-role mt-2 min-h-4 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-[var(--foreground-muted)]">
                {t(`roles.${item.roleKey}`)}
              </p>
            </li>
          ))}
        </ul>
      </Container>
    </Section>
  );
}
