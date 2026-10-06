export type PasswordChangeError =
  | "invalidNonce"
  | "network"
  | "rateLimited"
  | "sessionExpired"
  | "unknown"
  | "weakPassword";

type SupabaseLikeError = {
  code?: string;
  message?: string;
  status?: number;
};

export function getPasswordChangeError(error: SupabaseLikeError | null | undefined): PasswordChangeError {
  const message = error?.message?.toLowerCase() ?? "";
  const code = error?.code?.toLowerCase() ?? "";

  if (error?.status === 401 || error?.status === 403 || /session|not authenticated|jwt/.test(message)) return "sessionExpired";
  if (error?.status === 429 || /rate limit|too many|request limit/.test(message)) return "rateLimited";
  if (/nonce|reauth|verification code|otp|expired code/.test(`${code} ${message}`)) return "invalidNonce";
  if (/password.*(weak|short|invalid)|weak password/.test(message)) return "weakPassword";
  if (/network|fetch|failed to fetch/.test(message)) return "network";
  return "unknown";
}

export function maskEmail(email: string): string {
  const [localPart, domain] = email.split("@");
  if (!localPart || !domain) return "***";
  return `${localPart.slice(0, 1)}***@${domain}`;
}

export function hasPasswordIdentity(providers: readonly string[]): boolean {
  return providers.includes("email");
}
