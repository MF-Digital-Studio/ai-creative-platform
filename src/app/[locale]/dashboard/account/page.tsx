import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getOrCreateProfile } from "@/lib/profile/get-or-create-profile";
import { isSupportedLocale } from "@/i18n/routing";

import { ProfileForm } from "./profile-form";

type AccountPageProps = {
  params: Promise<{ locale: string }>;
};

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error("Unable to load account.");
  }

  const [profile, t] = await Promise.all([
    getOrCreateProfile(userId),
    getTranslations({ locale, namespace: "Dashboard.account" }),
  ]);

  setRequestLocale(locale);

  return (
    <main className="dashboard-main">
      <div className="dashboard-main-inner">
        <section className="mx-auto grid w-full max-w-xl gap-8" aria-labelledby="account-heading">
          <div className="grid gap-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--dashboard-muted)]">
              {t("eyebrow")}
            </p>
            <div className="grid gap-3">
              <h1 id="account-heading" className="text-4xl font-medium tracking-[-0.045em] text-[var(--dashboard-foreground)] sm:text-5xl">
                {t("heading")}
              </h1>
              <p className="max-w-lg text-base leading-7 text-[var(--dashboard-muted)]">
                {t("description")}
              </p>
            </div>
          </div>

          <div className="rounded-[var(--radius-md)] border border-[var(--dashboard-border-strong)] bg-[var(--dashboard-surface)] p-5 sm:p-6">
            <ProfileForm
              displayName={profile.display_name}
              messages={{
                displayNameLabel: t("displayNameLabel"),
                displayNameHelper: t("displayNameHelper"),
                save: t("save"),
                saving: t("saving"),
                validationError: t("validationError"),
                saveError: t("saveError"),
                saveSuccess: t("saveSuccess"),
              }}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
