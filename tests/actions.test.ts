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
import {
  createRule,
  saveRule,
  loadRules,
  loginAction,
  logoutAction,
} from "@/app/admin/actions";
import { sealSession } from "@/lib/session";
const fetchMock = vi.fn();
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  process.env.STAYZY_SESSION_SECRET =
    "test-session-secret-at-least-32-characters";
  process.env.STAYZY_API_BASE_URL = "http://localhost:9999";
  mocks.get.mockReturnValue(undefined);
});
it("blocks direct operations without authentication", async () => {
  expect(
    await createRule({ key: "test", enabled: false, rolloutPercentage: 0 }),
  ).toMatchObject({ ok: false, code: "unauthorized" });
  expect(
    await saveRule("test", { enabled: true, rolloutPercentage: 50 }),
  ).toMatchObject({ ok: false, code: "unauthorized" });
  expect(await loadRules()).toMatchObject({ ok: false, code: "unauthorized" });
  expect(fetchMock).not.toHaveBeenCalled();
});
it("clears cookie after upstream authentication rejection", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("valid") });
  fetchMock.mockResolvedValue(new Response("", { status: 401 }));
  expect(await loadRules()).toMatchObject({ ok: false, code: "unauthorized" });
  expect(mocks.delete).toHaveBeenCalledWith("stayzy_admin");
});
it("rejects invalid tokens and accepts valid login with secure cookie properties", async () => {
  const form = new FormData();
  form.set("token", "secret");
  fetchMock.mockResolvedValueOnce(new Response("", { status: 401 }));
  expect(await loginAction({ error: "" }, form)).toHaveProperty("error");
  expect(mocks.set).not.toHaveBeenCalled();
  fetchMock.mockResolvedValueOnce(
    Response.json({ schemaVersion: 1, rules: {} }),
  );
  await expect(loginAction({ error: "" }, form)).rejects.toThrow(
    "redirect:/admin",
  );
  expect(mocks.set).toHaveBeenCalledWith(
    "stayzy_admin",
    expect.any(String),
    expect.objectContaining({
      httpOnly: true,
      sameSite: "strict",
      maxAge: 28800,
    }),
  );
});
it("handles outages and unavailable creation without clearing drafts", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("valid") });
  fetchMock.mockRejectedValueOnce(new Error("network"));
  expect(
    await createRule({ key: "test", enabled: false, rolloutPercentage: 0 }),
  ).toMatchObject({ ok: false, uncertain: true });
  fetchMock.mockResolvedValueOnce(new Response("", { status: 404 }));
  expect(
    await createRule({ key: "test", enabled: false, rolloutPercentage: 0 }),
  ).toMatchObject({ ok: false, code: "unavailable" });
});
it("clears session on logout", async () => {
  await expect(logoutAction()).rejects.toThrow("redirect:/admin/login");
  expect(mocks.delete).toHaveBeenCalledWith("stayzy_admin");
});
