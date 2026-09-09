// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
import { sealSession, openSession } from "@/lib/session";
beforeEach(() => {
  vi.useRealTimers();
  process.env.STAYZY_SESSION_SECRET =
    "test-session-secret-at-least-32-characters";
});
it("encrypts tokens and rejects tampered and expired sessions", async () => {
  const sealed = await sealSession("private-admin-token");
  expect(sealed).not.toContain("private-admin-token");
  expect(await openSession(sealed)).toBe("private-admin-token");
  expect(await openSession(sealed.slice(0, -8) + "tampered")).toBeNull();
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 9 * 60 * 60 * 1000);
  expect(await openSession(sealed)).toBeNull();
  vi.useRealTimers();
});
it("fails closed when missing configuration or cookie", async () => {
  expect(await openSession()).toBeNull();
  delete process.env.STAYZY_SESSION_SECRET;
  await expect(sealSession("token")).rejects.toThrow();
});

it("rejects legacy cookies and honors a shorter backend expiry", async () => {
  const { EncryptJWT } = await import("jose");
  const { createHash } = await import("node:crypto");
  const key = createHash("sha256")
    .update(process.env.STAYZY_SESSION_SECRET!)
    .digest();
  const legacy = await new EncryptJWT({ token: "legacy-shared-token" })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuer("stayzyweb")
    .setAudience("stayzy-admin")
    .setExpirationTime("8h")
    .encrypt(key);
  expect(await openSession(legacy)).toBeNull();
  const short = await sealSession(
    "opaque-session",
    new Date(Date.now() + 60000).toISOString(),
  );
  vi.useFakeTimers();
  vi.setSystemTime(Date.now() + 120000);
  expect(await openSession(short)).toBeNull();
  vi.useRealTimers();
});
