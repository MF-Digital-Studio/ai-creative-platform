import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthShell } from "@/components/auth/auth-shell";
import { AuthVisual } from "@/components/auth/auth-visual";
import { LoginForm } from "@/components/auth/login-form";
import { Navbar } from "@/components/layout/navbar";
import { isSupportedLocale } from "@/i18n/routing";
import { createClient } from "@/lib/supabase/server";

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

  let isAuthenticated = false;

  try {
    const supabase = await createClient();
    const {data, error} = await supabase.auth.getClaims();
    isAuthenticated = !error && Boolean(data?.claims);
  } catch {
    // Auth failures should leave the public login page available.
  }

  if (isAuthenticated) {
    redirect(`/${locale}/dashboard`);
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
