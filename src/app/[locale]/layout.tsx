import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isSupportedLocale, routing } from "@/i18n/routing";

import "../globals.css";

const interDisplay = localFont({
  variable: "--font-sans",
  display: "swap",
  src: [
    { path: "../../../public/ttf/InterDisplay-Thin.ttf", weight: "100", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-ExtraLight.ttf", weight: "200", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-Light.ttf", weight: "300", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-Regular.ttf", weight: "400", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-Medium.ttf", weight: "500", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-SemiBold.ttf", weight: "600", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-Bold.ttf", weight: "700", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-ExtraBold.ttf", weight: "800", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-Black.ttf", weight: "900", style: "normal" },
    { path: "../../../public/ttf/InterDisplay-Italic.ttf", weight: "400", style: "italic" },
    { path: "../../../public/ttf/InterDisplay-LightItalic.ttf", weight: "300", style: "italic" },
    { path: "../../../public/ttf/InterDisplay-MediumItalic.ttf", weight: "500", style: "italic" },
    { path: "../../../public/ttf/InterDisplay-SemiBoldItalic.ttf", weight: "600", style: "italic" },
    { path: "../../../public/ttf/InterDisplay-BoldItalic.ttf", weight: "700", style: "italic" },
    { path: "../../../public/ttf/InterDisplay-ExtraBoldItalic.ttf", weight: "800", style: "italic" },
    { path: "../../../public/ttf/InterDisplay-BlackItalic.ttf", weight: "900", style: "italic" },
    { path: "../../../public/ttf/InterDisplay-ExtraLightItalic.ttf", weight: "200", style: "italic" },
    { path: "../../../public/ttf/InterDisplay-ThinItalic.ttf", weight: "100", style: "italic" },
  ],
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
    title: t("title"),
    description: t("description"),
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
      <body className={interDisplay.variable}>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
