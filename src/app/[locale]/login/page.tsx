import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthVisual } from "@/components/auth/auth-visual";
import { LoginForm } from "@/components/auth/login-form";
import { Navbar } from "@/components/layout/navbar";
import { isSupportedLocale } from "@/i18n/routing";

type LoginPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale, namespace: "LoginPage" });

  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const t = await getTranslations("LoginPage");

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
          <LoginForm />
        </AuthShell>
      </main>
    </>
  );
}
