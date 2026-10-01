import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import { isSupportedLocale } from "@/i18n/routing";

type ShowcasePageProps = {
  params: Promise<{ locale: string }>;
};

export default async function ShowcasePage({ params }: ShowcasePageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("ShowcasePage");

  return (
    <>
      <Navbar />
      <main>
        <Section spacing="large" className="bg-[var(--background)]">
          <Container>
            <header className="mx-auto flex max-w-3xl flex-col items-center text-center">
              <Badge>{t("eyebrow")}</Badge>
              <h1
                className="mt-5 text-[clamp(2.5rem,6vw,5rem)] font-semibold leading-[0.96] tracking-[-0.06em] text-[var(--foreground)]"
              >
                {t("heading")}
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-7 text-[var(--foreground-muted)] sm:text-lg sm:leading-8">
                {t("description")}
              </p>
            </header>
          </Container>
        </Section>
      </main>
      <Footer />
    </>
  );
}
