import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { isSupportedLocale } from "@/i18n/routing";
import { hasPasswordIdentity } from "@/lib/auth/password-change";
import { getAuthenticatedUserId } from "@/lib/auth/require-user";
import { getOrCreateProfile } from "@/lib/profile/get-or-create-profile";
import { createClient } from "@/lib/supabase/server";

import { AppearanceControl } from "./appearance-control";
import { PasswordChangeControl } from "./password-change-control";
import { ProfileForm } from "./profile-form";
import { SessionManagement } from "./session-management";

type AccountPageProps = { params: Promise<{ locale: string }> };
type SettingsIconName = "account" | "security" | "sessions" | "appearance";

function SettingsIcon({ name }: { name: SettingsIconName }) {
  const paths = {
    account: <><circle cx="12" cy="8" r="3" /><path d="M5.5 20a6.5 6.5 0 0 1 13 0" /></>,
    security: <><path d="M12 3 5 6v5c0 4.5 2.8 8 7 10 4.2-2 7-5.5 7-10V6l-7-3Z" /><path d="m9.5 12 1.6 1.6 3.5-3.7" /></>,
    sessions: <><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8m-4-4v4" /></>,
    appearance: <><path d="M12 3a9 9 0 1 0 9 9c0-1.1-.9-2-2-2h-1.1a2 2 0 0 1-1.7-3l.5-.9A2 2 0 0 0 15 3.2 9 9 0 0 0 12 3Z" /><circle cx="7.5" cy="11" r=".7" /><circle cx="10" cy="7" r=".7" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { locale } = await params;
  if (!isSupportedLocale(locale)) notFound();
  const userId = await getAuthenticatedUserId();
  if (!userId) throw new Error("Unable to load account.");

  const [profile, t, supabase] = await Promise.all([
    getOrCreateProfile(userId),
    getTranslations({ locale, namespace: "Dashboard.account" }),
    createClient(),
  ]);
  const { data: { user } } = await supabase.auth.getUser();
  const providers = user?.identities?.map((identity) => identity.provider) ?? [];
  const passwordEmail = user?.email;
  const canChangePassword = Boolean(passwordEmail && hasPasswordIdentity(providers));
  const displayName = profile.display_name || t("unnamedUser");
  const signInMethod = providers.includes("google") ? t("googleSignIn") : t("emailSignIn");
  setRequestLocale(locale);

  const passwordMessages = {
    cancel: t("cancel"), changePassword: t("changePassword"), codeLabel: t("codeLabel"), confirmPassword: t("confirmPassword"),
    done: t("done"), emailVerificationDescription: t("emailVerificationDescription"), invalidNonce: t("invalidNonce"), network: t("network"),
    newPassword: t("newPassword"), passwordMismatch: t("passwordMismatch"), passwordRequired: t("passwordRequired"), rateLimited: t("rateLimited"),
    requestSent: t("requestSent"), resend: t("resend"), resendCountdown: t("resendCountdown", { seconds: "{seconds}" }), sendCode: t("sendCode"),
    sendingCode: t("sendingCode"), sessionExpired: t("sessionExpired"), sessionExpiredAction: t("sessionExpiredAction"), successDescription: t("successDescription"),
    successTitle: t("successTitle"), unknown: t("unknown"), updatePassword: t("updatePassword"), updatingPassword: t("updatingPassword"),
    verifyTitle: t("verifyTitle"), weakPassword: t("weakPassword"),
  };

  return <main className="dashboard-main"><div className="dashboard-main-inner dashboard-container">
    <section className="dashboard-settings" aria-labelledby="account-heading">
      <header className="account-hero">
        <div className="account-hero-copy"><p className="account-eyebrow">{t("eyebrow")}</p><h1 id="account-heading" className="dashboard-settings-title">{t("heading")}</h1><p>{t("description")}</p></div>
        <dl className="account-summary" aria-label={t("summaryLabel")}>
          <div className="account-summary-primary"><dt>{t("displayNameLabel")}</dt><dd>{displayName}</dd></div>
          <div><dt>{t("signInMethod")}</dt><dd>{signInMethod}</dd></div>
          <div><dt>{t("accountStatus")}</dt><dd className="account-status"><span />{t("activeStatus")}</dd></div>
        </dl>
      </header>
      <div className="dashboard-settings-layout">
        <nav className="dashboard-settings-nav" aria-label={t("settingsNavigation")}>
          <p>{t("settingsNavigation")}</p>
          <a href="#account-settings" aria-current="page"><SettingsIcon name="account" /><span><strong>{t("heading")}</strong><small>{t("accountNavDescription")}</small></span></a>
          <a href="#security-settings"><SettingsIcon name="security" /><span><strong>{t("securityNavLabel")}</strong><small>{t("securityNavDescription")}</small></span></a>
          <a href="#appearance-settings"><SettingsIcon name="appearance" /><span><strong>{t("appearanceHeading")}</strong><small>{t("appearanceNavDescription")}</small></span></a>
        </nav>
        <div className="dashboard-settings-content">
          <div className="dashboard-settings-primary-grid">
          <section id="account-settings" className="dashboard-settings-card account-profile-card" aria-labelledby="profile-heading">
            <div className="account-section-header"><span className="account-section-icon"><SettingsIcon name="account" /></span><div><p>{t("profileEyebrow")}</p><h2 id="profile-heading">{t("profileHeading")}</h2><span>{t("profileDescription")}</span></div></div>
            <ProfileForm displayName={profile.display_name} messages={{ profileLabel: t("profileLabel"), displayNameLabel: t("displayNameLabel"), displayNameHelper: t("displayNameHelper"), save: t("save"), saving: t("saving"), validationError: t("validationError"), saveError: t("saveError"), saveSuccess: t("saveSuccess") }} />
          </section>
          <section id="security-settings" className="dashboard-settings-card" aria-labelledby="security-heading">
            <div className="account-section-header"><span className="account-section-icon"><SettingsIcon name="security" /></span><div><p>{t("securityEyebrow")}</p><h2 id="security-heading">{t("securityHeading")}</h2><span>{t("securityDescription")}</span></div></div>
            {canChangePassword ? <div className="security-action-row"><span className="security-action-icon"><SettingsIcon name="security" /></span><div><h3>{t("passwordHeading")}</h3><p>{t("passwordDescription")}</p></div><PasswordChangeControl email={passwordEmail!} signInHref={`/${locale}/login`} messages={passwordMessages} /></div> : null}
          </section>
          </div>
          <section className="dashboard-settings-card account-sessions-card" aria-labelledby="sessions-section-heading">
            <div className="account-section-header"><span className="account-section-icon"><SettingsIcon name="sessions" /></span><div><p>{t("sessionsEyebrow")}</p><h2 id="sessions-section-heading">{t("sessionsHeading")}</h2><span>{t("sessionsDescription")}</span></div></div>
            <SessionManagement signInHref={`/${locale}/login`} messages={{
              sessions: t("sessions"), currentSession: t("currentSession"), activeNow: t("activeNow"), current: t("current"),
              signOutDevice: t("signOutDevice"), signingOut: t("signingOut"), signOutOthers: t("signOutOthers"),
              signOutOthersDescription: t("signOutOthersDescription"), signingOutOthers: t("signingOutOthers"),
              signOutEverywhere: t("signOutEverywhere"), signingOutEverywhere: t("signingOutEverywhere"),
              othersTitle: t("othersTitle"), othersBody: t("othersBody"), confirmOthers: t("confirmOthers"),
              globalTitle: t("globalTitle"), globalBody: t("globalBody"), confirmGlobal: t("confirmGlobal"),
              cancel: t("sessionsCancel"), error: t("sessionsError"), localDescription: t("signOutDeviceDescription"),
              dangerZone: t("dangerZone"), globalDescription: t("signOutEverywhereDescription"),
            }} />
          </section>
          <section id="appearance-settings" className="dashboard-settings-card" aria-labelledby="appearance-heading">
            <div className="account-section-header"><span className="account-section-icon"><SettingsIcon name="appearance" /></span><div><p>{t("appearanceEyebrow")}</p><h2 id="appearance-heading">{t("appearanceHeading")}</h2><span>{t("appearanceDescription")}</span></div></div>
            <AppearanceControl labels={{ group: t("appearanceHeading"), system: t("system"), dark: t("dark"), light: t("light") }} />
          </section>
        </div>
      </div>
    </section>
  </div></main>;
}
