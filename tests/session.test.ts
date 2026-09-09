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
