import { getLocale, getTranslations } from "next-intl/server";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { pricingPlans, type PricingPlan } from "@/data/pricing";
import { getPathname } from "@/i18n/navigation";
import { isSupportedLocale, routing, type AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/cn";

type PricingTranslator = Awaited<
  ReturnType<typeof getTranslations<"PricingSection">>
>;

type PricingCardProps = {
  plan: PricingPlan;
  locale: AppLocale;
  t: PricingTranslator;
};

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      fill="none"
      className="mt-0.5 size-4 shrink-0 text-[var(--accent)]"
    >
      <path
        d="m3.25 8.25 3 3 6.5-6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function PricingCard({ plan, locale, t }: PricingCardProps) {
  const href = getPathname({ href: plan.href, locale });

  return (
    <article
      className={cn(
        "flex min-w-0 flex-col rounded-[var(--radius-md)] border bg-[var(--surface)] p-5 shadow-[var(--shadow-subtle)] sm:p-7",
        plan.highlighted
          ? "border-[var(--accent)] shadow-[0_10px_28px_color-mix(in_srgb,var(--accent)_14%,transparent)]"
          : "border-[var(--border)]",
      )}
    >
      <div className="flex min-h-8 flex-wrap items-start justify-between gap-3">
        <h3
          className="text-2xl font-medium leading-tight tracking-[-0.04em] text-[var(--foreground)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {t(plan.nameKey)}
        </h3>
        {plan.badgeKey ? (
          <Badge
            variant="accent"
            className="bg-[var(--accent-soft)] text-[var(--foreground)]"
          >
            {t(plan.badgeKey)}
          </Badge>
        ) : null}
      </div>

      <p className="mt-4 min-h-18 text-sm leading-6 text-[var(--foreground-muted)]">
        {t(plan.descriptionKey)}
      </p>

      <p className="mt-7 flex flex-wrap items-baseline gap-x-2 text-[var(--foreground)]">
        <span
          className="text-[clamp(2.75rem,4vw,3.75rem)] font-medium leading-none tracking-[-0.06em]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {plan.price[locale]}
        </span>
        <span className="text-sm text-[var(--foreground-muted)]">
          / {t(plan.billingPeriodKey)}
        </span>
      </p>

      <p className="mt-4 border-b border-[var(--border)] pb-6 text-sm font-semibold leading-6 text-[var(--foreground)]">
        {t(plan.creditsKey)}
      </p>

      <ul className="mt-6 flex-1 space-y-3" role="list">
        {plan.featureKeys.map((featureKey, index) => (
          <li
            key={featureKey}
            className={cn(
              "flex min-w-0 items-start gap-3 text-sm leading-6 text-[var(--foreground-muted)]",
              plan.id !== "starter" &&
                index === 0 &&
                "font-semibold text-[var(--foreground)]",
            )}
          >
            <CheckIcon />
            <span>{t(featureKey)}</span>
          </li>
        ))}
      </ul>

      <Button
        href={href}
        variant={plan.highlighted ? "primary" : "dark"}
        size="lg"
        className="mt-8 w-full"
      >
        {t(plan.ctaKey)}
      </Button>
    </article>
  );
}

export async function Pricing() {
  const currentLocale = await getLocale();
  const locale = isSupportedLocale(currentLocale)
    ? currentLocale
    : routing.defaultLocale;
  const t = await getTranslations("PricingSection");

  return (
    <Section
      id="pricing"
      aria-labelledby="pricing-title"
      className="scroll-mt-[var(--navbar-height)] overflow-x-clip bg-[var(--background)]"
    >
      <Container>
        <header className="grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:items-end lg:gap-16">
          <div className="max-w-4xl">
            <Badge>{t("eyebrow")}</Badge>
            <h2
              id="pricing-title"
              className="mt-5 max-w-3xl text-[clamp(2.5rem,4.75vw,4.5rem)] font-medium leading-[0.94] tracking-[-0.06em] text-[var(--foreground)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("heading")}
            </h2>
          </div>

          <div className="max-w-xl lg:pb-1">
            <p className="whitespace-pre-line text-base leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8">
              {t("description")}
            </p>
            <p className="mt-5 text-sm font-medium leading-6 text-[var(--foreground)]">
              {t("startingCreditsNote")}
            </p>
          </div>
        </header>

        <div className="mt-12 grid items-stretch gap-4 md:grid-cols-2 lg:mt-16 xl:grid-cols-3">
          {pricingPlans.map((plan) => (
            <PricingCard key={plan.id} plan={plan} locale={locale} t={t} />
          ))}
        </div>

        <div className="mx-auto mt-6 max-w-3xl text-center text-xs leading-5 text-[var(--foreground-muted)] sm:text-sm sm:leading-6">
          <p>{t("footnote")}</p>
          <p className="mt-1 text-[0.6875rem] opacity-75">{t("betaNote")}</p>
        </div>
      </Container>
    </Section>
  );
}
