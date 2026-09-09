// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  set: vi.fn(),
  delete: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("next/headers", () => ({ cookies: async () => mocks }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import { createRule, saveRule, loadRules } from "@/app/admin/actions";
import {
  loginAction,
  logoutAction,
  changePasswordAction,
  forgotPasswordAction,
  resetPasswordAction,
  listAccounts,
  createAccountAction,
  updateAccount,
} from "@/app/admin/auth-actions";
import { sealSession } from "@/lib/session";
const fetchMock = vi.fn();
const account = {
  id: "1",
  email: "owner@example.com",
  role: "owner",
  active: true,
  must_change_password: false,
  created_at: "2026-01-01T00:00:00Z",
};
function form(values: Record<string, string>) {
  const data = new FormData();
  for (const [k, v] of Object.entries(values)) data.set(k, v);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  process.env.STAYZY_SESSION_SECRET =
    "test-session-secret-at-least-32-characters";
  process.env.STAYZY_API_BASE_URL = "http://localhost:9999";
  mocks.get.mockReturnValue(undefined);
});
it("blocks operations without authentication", async () => {
  expect(
    await createRule({ key: "test", enabled: false, rolloutPercentage: 0 }),
  ).toMatchObject({ ok: false, code: "unauthorized" });
  expect(
    await saveRule("test", { enabled: true, rolloutPercentage: 50 }),
  ).toMatchObject({ ok: false, code: "unauthorized" });
  expect(await loadRules()).toMatchObject({ ok: false, code: "unauthorized" });
  await expect(listAccounts()).rejects.toThrow("redirect:/admin/login");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("clears rejected sessions but does not mislabel forbidden access", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("session") });
  fetchMock.mockResolvedValueOnce(
    Response.json({ detail: { code: "admin_unauthorized" } }, { status: 401 }),
  );
  expect(await loadRules()).toMatchObject({ ok: false, code: "unauthorized" });
  expect(mocks.delete).toHaveBeenCalledWith("stayzy_admin_v2");
  mocks.delete.mockClear();
  fetchMock.mockResolvedValueOnce(
    Response.json({ detail: { code: "owner_required" } }, { status: 403 }),
  );
  expect(await listAccounts()).toMatchObject({
    ok: false,
    code: "owner_required",
  });
  expect(mocks.delete).not.toHaveBeenCalled();
});
it("logs in with exact password bytes and sets cookie aligned to backend expiry", async () => {
  const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  fetchMock.mockResolvedValueOnce(
    Response.json({ session_token: "opaque", expires_at: expires, account }),
  );
  await expect(
    loginAction(
      { error: "" },
      form({ email: "owner@example.com", password: "  exact password  " }),
    ),
  ).rejects.toThrow("redirect:/admin");
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:9999/v1/admin/auth/login",
    expect.objectContaining({
      body: JSON.stringify({
        email: "owner@example.com",
        password: "  exact password  ",
      }),
    }),
  );
  expect(mocks.set).toHaveBeenCalledWith(
    "stayzy_admin_v2",
    expect.any(String),
    expect.objectContaining({
      httpOnly: true,
      sameSite: "strict",
      expires: new Date(expires),
    }),
  );
});
it("redirects temporary passwords to required change screen", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({
      session_token: "opaque",
      expires_at: new Date(Date.now() + 3600000).toISOString(),
      account: { ...account, must_change_password: true },
    }),
  );
  await expect(
    loginAction(
      { error: "" },
      form({ email: "owner@example.com", password: "temporary password" }),
    ),
  ).rejects.toThrow("redirect:/admin/change-password");
});
it("distinguishes bad credentials, unavailable configuration, and outages", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({ detail: { code: "invalid_credentials" } }, { status: 401 }),
  );
  expect(
    await loginAction(
      { error: "" },
      form({ email: "owner@example.com", password: "wrong" }),
    ),
  ).toEqual({ error: "Email or password was not accepted." });
  fetchMock.mockRejectedValueOnce(new Error("network"));
  expect(
    (
      await loginAction(
        { error: "" },
        form({ email: "owner@example.com", password: "password" }),
      )
    ).error,
  ).toContain("could not reach");
  delete process.env.STAYZY_SESSION_SECRET;
  expect(
    (
      await loginAction(
        { error: "" },
        form({ email: "owner@example.com", password: "password" }),
      )
    ).error,
  ).toContain("STAYZY_SESSION_SECRET");
});
it("changes passwords, invalidates cookie, and enforces confirmation", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("session") });
  expect(
    (
      await changePasswordAction(
        { error: "" },
        form({
          current_password: "old",
          new_password: "new long password 123",
          confirm_password: "different",
        }),
      )
    ).error,
  ).toContain("do not match");
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(
    changePasswordAction(
      { error: "" },
      form({
        current_password: "old",
        new_password: "new long password 123",
        confirm_password: "new long password 123",
      }),
    ),
  ).rejects.toThrow("redirect:/admin/login?notice=password-changed");
  expect(mocks.delete).toHaveBeenCalledWith("stayzy_admin_v2");
});
it("requests recovery and submits reset tokens only through POST bodies", async () => {
  fetchMock.mockResolvedValueOnce(
    Response.json({ status: "accepted" }, { status: 202 }),
  );
  expect(
    await forgotPasswordAction(
      { error: "" },
      form({ email: "owner@example.com" }),
    ),
  ).toHaveProperty("success");
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(
    resetPasswordAction(
      { error: "" },
      form({
        reset_token: "private-reset",
        new_password: "new long password 123",
        confirm_password: "new long password 123",
      }),
    ),
  ).rejects.toThrow("redirect:/admin/login?notice=password-changed");
  expect(fetchMock.mock.calls[1][0]).not.toContain("private-reset");
  expect(fetchMock.mock.calls[1][1].body).toContain("private-reset");
});
it("revokes backend session before logout and reports uncertain revocation", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("session") });
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(logoutAction()).rejects.toThrow("redirect:/admin/login");
  expect(fetchMock.mock.calls[0][0]).toContain("/auth/logout");
  fetchMock.mockRejectedValueOnce(new Error("offline"));
  await expect(logoutAction()).rejects.toThrow(
    "redirect:/admin/login?notice=logout-unconfirmed",
  );
});
it("validates new account passwords and relays owner authorization errors", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("session") });
  expect(
    (
      await createAccountAction(
        { error: "" },
        form({
          email: "new@example.com",
          role: "admin",
          temporary_password: "short",
        }),
      )
    ).error,
  ).toContain("15–128");
  expect(fetchMock).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(
    Response.json({ detail: { code: "owner_required" } }, { status: 403 }),
  );
  expect(await updateAccount("1", { active: false })).toMatchObject({
    ok: false,
    code: "owner_required",
  });
});
