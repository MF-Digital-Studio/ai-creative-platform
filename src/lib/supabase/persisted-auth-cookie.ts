const authCookieNamePattern = /^sb-[a-z0-9-]+-auth-token(?:\.\d+)?$/i;
const authCookieChunkPattern = /^(sb-[a-z0-9-]+-auth-token)(?:\.(\d+))?$/i;
const base64Prefix = "base64-";

function decodeBase64Url(value: string): string | null {
  try {
    const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
    return atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  } catch {
    return null;
  }
}

/**
 * Supabase SSR persists auth state as JSON in base64url cookie chunks. A
 * truncated chunk used to surface as `Unexpected end of JSON input` while the
 * dashboard refreshed its session. Only these known persisted auth values are
 * inspected; unrelated cookies are never parsed or altered.
 */
export function isValidPersistedSupabaseAuthCookie(cookie: { name: string; value: string }): boolean {
  if (!authCookieNamePattern.test(cookie.name) || !cookie.value.startsWith(base64Prefix)) return true;

  const decoded = decodeBase64Url(cookie.value.slice(base64Prefix.length));
  if (decoded === null) return false;

  try {
    JSON.parse(decoded);
    return true;
  } catch {
    return false;
  }
}

export function getInvalidPersistedSupabaseAuthCookieNames(
  cookies: ReadonlyArray<{ name: string; value: string }>,
): string[] {
  const groups = new Map<string, Array<{ name: string; value: string; chunk: number }>>();
  cookies.forEach((cookie) => {
    const match = cookie.name.match(authCookieChunkPattern);
    if (!match) return;
    const group = groups.get(match[1]) ?? [];
    group.push({ name: cookie.name, value: cookie.value, chunk: Number(match[2] ?? 0) });
    groups.set(match[1], group);
  });

  return [...groups.values()].flatMap((group) => {
    const value = group.sort((left, right) => left.chunk - right.chunk).map((cookie) => cookie.value).join("");
    return isValidPersistedSupabaseAuthCookie({ name: group[0].name.replace(/\.\d+$/, ""), value })
      ? []
      : group.map((cookie) => cookie.name);
  });
}
