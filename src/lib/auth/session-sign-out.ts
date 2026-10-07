export type SessionSignOutScope = "local" | "others" | "global";

export function signOutWithScope(
  auth: { signOut: (options: { scope: SessionSignOutScope }) => Promise<{ error: unknown | null }> },
  scope: SessionSignOutScope,
) {
  return auth.signOut({ scope });
}
