import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isSupportedLocale, routing } from "@/i18n/routing";

import "../globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  display: "swap",
  subsets: ["latin"],
});

type LocaleLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: Pick<LocaleLayoutProps, "params">): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "Metadata" });

  return {
    title: {
      default: t("title"),
      template: "%s | Klay.ai",
    },
    applicationName: "Klay.ai",
    description: t("description"),
    openGraph: {
      title: "Klay.ai",
      description: t("description"),
      siteName: "Klay.ai",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: "Klay.ai",
      description: t("description"),
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: Readonly<LocaleLayoutProps>) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale}>
      <body className={outfit.variable}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
