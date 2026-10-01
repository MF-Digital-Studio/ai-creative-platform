import assert from "node:assert/strict";
import test from "node:test";

import {
  getInvalidPersistedSupabaseAuthCookieNames,
  isValidPersistedSupabaseAuthCookie,
} from "../src/lib/supabase/persisted-auth-cookie";

function encodedJson(value: unknown): string {
  return `base64-${Buffer.from(JSON.stringify(value)).toString("base64url")}`;
}

test("a truncated Supabase persisted auth cookie is rejected before dashboard session refresh", () => {
  const cookie = { name: "sb-project-auth-token.0", value: "base64-eyJhY2Nlc3NfdG9rZW4iOiI" };

  assert.equal(isValidPersistedSupabaseAuthCookie(cookie), false);
  assert.deepEqual(getInvalidPersistedSupabaseAuthCookieNames([cookie]), [cookie.name]);
});

test("valid Supabase auth state and unrelated cookies are retained", () => {
  const authCookie = { name: "sb-project-auth-token", value: encodedJson({ access_token: "token" }) };
  const unrelatedCookie = { name: "preferences", value: "incomplete-json{" };

  assert.equal(isValidPersistedSupabaseAuthCookie(authCookie), true);
  assert.equal(isValidPersistedSupabaseAuthCookie(unrelatedCookie), true);
  assert.deepEqual(getInvalidPersistedSupabaseAuthCookieNames([authCookie, unrelatedCookie]), []);
});

test("valid chunked Supabase auth state is combined before it is parsed", () => {
  const value = encodedJson({ access_token: "token", refresh_token: "refresh" });
  const midpoint = Math.ceil(value.length / 2);
  const chunks = [
    { name: "sb-project-auth-token.0", value: value.slice(0, midpoint) },
    { name: "sb-project-auth-token.1", value: value.slice(midpoint) },
  ];

  assert.deepEqual(getInvalidPersistedSupabaseAuthCookieNames(chunks), []);
});
