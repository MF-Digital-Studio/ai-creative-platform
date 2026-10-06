import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { getPasswordChangeError, hasPasswordIdentity, maskEmail } from "../src/lib/auth/password-change";

const root = process.cwd();
const read = (path: string) => readFileSync(join(root, path), "utf8");

test("password accounts are eligible while OAuth-only accounts are not", () => {
  assert.equal(hasPasswordIdentity(["email"]), true);
  assert.equal(hasPasswordIdentity(["google"]), false);
});

test("password change errors map to safe categories", () => {
  assert.equal(getPasswordChangeError({ status: 429 }), "rateLimited");
  assert.equal(getPasswordChangeError({ message: "Nonce has expired" }), "invalidNonce");
  assert.equal(getPasswordChangeError({ status: 401 }), "sessionExpired");
  assert.equal(getPasswordChangeError({ message: "Password is too weak" }), "weakPassword");
});

test("email masking does not reveal the full local part", () => {
  assert.equal(maskEmail("faruk@example.com"), "f***@example.com");
});

test("password flow uses Supabase reauthentication and nonce update without persistence", () => {
  const source = read("src/app/[locale]/dashboard/account/password-change-control.tsx");
  assert.match(source, /auth\.reauthenticate\(\)/);
  assert.match(source, /auth\.updateUser\(\{ password: newPassword, nonce: code \}\)/);
  assert.match(source, /slice\(0, 8\)/);
  assert.match(source, /maxLength=\{8\}/);
  assert.doesNotMatch(source, /slice\(0, 6\)|maxLength=\{6\}/);
  assert.match(source, /COOLDOWN_SECONDS = 60/);
  assert.match(source, /setCode\(""\); setNewPassword\(""\); setConfirmation\(""\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|auth\.admin|service_role/);
});

test("both locales include the complete security copy", () => {
  for (const locale of ["tr", "en"]) {
    const messages = JSON.parse(read(`src/messages/${locale}.json`)) as { Dashboard: { account: Record<string, string> } };
    for (const key of ["securityHeading", "changePassword", "invalidNonce", "rateLimited", "sessionExpired", "successTitle", "resendCountdown"]) {
      assert.equal(typeof messages.Dashboard.account[key], "string");
    }
  }
});
