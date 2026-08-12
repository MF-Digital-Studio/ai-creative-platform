import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthVisual } from "@/components/auth/auth-visual";
import { SignupForm } from "@/components/auth/signup-form";
import { Navbar } from "@/components/layout/navbar";
import { isSupportedLocale } from "@/i18n/routing";

type SignupPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
};

export async function generateMetadata({
  params,
}: SignupPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "SignupPage" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function SignupPage({
  params,
  searchParams,
}: SignupPageProps) {
  const { locale } = await params;
  const { error } = await searchParams;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("SignupPage");

  return (
    <>
      <Navbar />
      <main className="signup-page">
        <AuthShell
          visual={
            <AuthVisual
              label={t("visualLabel")}
              alt={t("visualAlt")}
              eyebrow={t("visualEyebrow")}
              heading={t("visualHeading")}
              description={t("visualDescription")}
            />
          }
        >
          <SignupForm showConfirmationError={error === "confirmation"} />
        </AuthShell>
      </main>
    </>
  );
}
