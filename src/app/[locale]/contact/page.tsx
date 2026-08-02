import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactForm } from "@/components/contact/contact-form";
import { Navbar } from "@/components/layout/navbar";
import { isSupportedLocale } from "@/i18n/routing";

type ContactPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "ContactPage" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("ContactPage");

  return (
    <>
      <Navbar />
      <main className="contact-page">
        <div className="contact-shell">
          <aside className="contact-visual" aria-label={t("visualLabel")}>
            <Image
              src="/auth/fashion-dress-campaign.webp"
              alt={t("visualAlt")}
              fill
              preload
              sizes="(min-width: 1100px) 56vw, (min-width: 861px) 50vw, 100vw"
              className="contact-visual-image"
            />
            <div aria-hidden="true" className="contact-visual-gradient" />
            <div className="contact-visual-copy">
              <p className="contact-visual-eyebrow">{t("visualEyebrow")}</p>
              <div className="contact-visual-heading-mask">
                <h2 className="contact-visual-heading">{t("visualHeading")}</h2>
              </div>
              <p className="contact-visual-description">
                {t("visualDescription")}
              </p>
            </div>
          </aside>

          <section className="contact-form-panel" aria-labelledby="contact-heading">
            <ContactForm />
          </section>
        </div>
      </main>
    </>
  );
}
