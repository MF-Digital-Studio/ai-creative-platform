import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getOrCreateProfile } from "@/lib/profile/get-or-create-profile";
import { isSupportedLocale } from "@/i18n/routing";

import { ProfileForm } from "./profile-form";
import { AppearanceControl } from "./appearance-control";

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
      <div className="dashboard-main-inner dashboard-container">
        <section className="dashboard-settings" aria-labelledby="account-heading">
          <div className="grid gap-3">
            <p className="text-xs font-semibold tracking-[0.12em] text-[var(--dashboard-muted)]">
              {t("eyebrow")}
            </p>
            <div className="grid gap-3">
              <h1 id="account-heading" className="dashboard-settings-title">
                {t("heading")}
              </h1>
              <p className="max-w-lg text-base leading-7 text-[var(--dashboard-muted)]">
                {t("description")}
              </p>
            </div>
          </div>

          <div className="dashboard-settings-layout">
            <nav className="dashboard-settings-nav" aria-label={t("heading")}><a href="#account-settings" aria-current="page">{t("heading")}</a><a href="#appearance-settings">{t("appearanceHeading")}</a></nav>
            <div className="dashboard-settings-sections">
            <div id="account-settings" className="dashboard-settings-card">
              <h2>{t("heading")}</h2>
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
            <section id="appearance-settings" className="dashboard-settings-card" aria-labelledby="appearance-heading">
              <h2 id="appearance-heading">{t("appearanceHeading")}</h2>
              <p className="appearance-description">{t("appearanceDescription")}</p>
              <AppearanceControl labels={{ group: t("appearanceHeading"), system: t("system"), dark: t("dark"), light: t("light") }} />
            </section>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
