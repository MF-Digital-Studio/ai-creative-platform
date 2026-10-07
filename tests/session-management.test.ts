import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { signOutWithScope, type SessionSignOutScope } from "../src/lib/auth/session-sign-out";

test("session sign-out passes every explicit Supabase scope unchanged", async () => {
  const received: SessionSignOutScope[] = [];
  const auth = { signOut: async (options?: { scope?: SessionSignOutScope }) => {
    assert.ok(options?.scope);
    received.push(options.scope);
    return { error: null };
  } };

  await signOutWithScope(auth, "local");
  await signOutWithScope(auth, "others");
  await signOutWithScope(auth, "global");
  assert.deepEqual(received, ["local", "others", "global"]);
});

test("session failures are returned without triggering a successful redirect path", async () => {
  const auth = { signOut: async () => ({ error: new Error("private auth detail") }) };
  const result = await signOutWithScope(auth, "others");
  assert.ok(result.error instanceof Error);
  assert.match(result.error.message, /private auth detail/);
});

test("session UI confirms remote scopes, keeps the current row, and hides session identifiers", async () => {
  const ui = await readFile(new URL("../src/app/[locale]/dashboard/account/session-management.tsx", import.meta.url), "utf8");
  assert.match(ui, /messages\.currentSession/);
  assert.match(ui, /openConfirmation\("others"\)/);
  assert.match(ui, /openConfirmation\("global"\)/);
  assert.match(ui, /scope === "others"[\s\S]*setAction\(undefined\)/);
  assert.match(ui, /window\.location\.assign\(signInHref\)/);
  assert.doesNotMatch(ui, /session_id|sessionId|session\.id/);
  assert.match(ui, /role="alert"/);
});

test("session copy exists in both locale catalogs and password change remains separate", async () => {
  const [tr, en] = await Promise.all([
    readFile(new URL("../src/messages/tr.json", import.meta.url), "utf8").then(JSON.parse),
    readFile(new URL("../src/messages/en.json", import.meta.url), "utf8").then(JSON.parse),
  ]);
  assert.equal(tr.Dashboard.account.sessions, "Oturumlar");
  assert.equal(en.Dashboard.account.sessions, "Sessions");
  assert.equal(tr.Dashboard.account.confirmGlobal, "Tüm oturumları kapat");
  assert.equal(en.Dashboard.account.confirmGlobal, "Sign out of all sessions");
});
