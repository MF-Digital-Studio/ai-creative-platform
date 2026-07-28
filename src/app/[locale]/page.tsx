import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { SectionHeading } from "@/components/ui/section-heading";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isSupportedLocale } from "@/i18n/routing";

type HomeProps = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: HomeProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "Preview" });

  return (
    <>
      <Navbar />
      <main>
        <h1 className="sr-only">{t("title")}</h1>
        <Section spacing="large" aria-label={t("ariaLabel")}>
          <Container>
            <div className="border-y border-[var(--border)] py-[var(--section-space-compact)]">
              <SectionHeading
                eyebrow={t("foundation")}
                title={t("title")}
                description={t("description")}
                align="center"
                className="mx-auto"
              />
            </div>
          </Container>
        </Section>

        <Section spacing="compact" aria-labelledby="actions-title">
          <Container>
            <div className="grid gap-10 border-b border-[var(--border)] pb-[var(--section-space-compact)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                  {t("actions")}
                </p>
                <h2
                  id="actions-title"
                  className="mt-3 text-2xl tracking-[-0.035em]"
                >
                  {t("buttonVariants")}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button>{t("primaryAction")}</Button>
                <Button variant="secondary">{t("secondaryAction")}</Button>
                <Button variant="ghost">{t("ghostAction")}</Button>
                <Button variant="dark">{t("darkAction")}</Button>
                <Button disabled>{t("disabledAction")}</Button>
              </div>
            </div>
          </Container>
        </Section>

        <Section spacing="compact" aria-labelledby="tags-title">
          <Container>
            <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] lg:items-start">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--foreground-muted)]">
                  {t("categories")}
                </p>
                <h2
                  id="tags-title"
                  className="mt-3 text-2xl tracking-[-0.035em]"
                >
                  {t("badgeVariants")}
                </h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Badge>{t("jewelry")}</Badge>
                <Badge variant="accent">{t("fashion")}</Badge>
                <Badge variant="outline">{t("cosmetics")}</Badge>
              </div>
            </div>
          </Container>
        </Section>
      </main>
      <div className="mt-[var(--section-space)]">
        <Footer />
      </div>
    </>
  );
}
