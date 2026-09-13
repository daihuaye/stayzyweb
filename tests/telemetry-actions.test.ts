// @vitest-environment node
import { beforeEach, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`redirect:${path}`);
  }),
}));
vi.mock("next/headers", () => ({ cookies: async () => mocks }));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
import {
  loadOverview,
  loadSessions,
  loadDetail,
} from "@/app/admin/telemetry-actions";
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
it("requires authentication before reporting", async () => {
  await expect(loadOverview({})).rejects.toThrow("redirect:/admin/login");
  expect(fetchMock).not.toHaveBeenCalled();
});
it("uses a server-only bearer header and no-store reads", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("private-token") });
  fetchMock.mockResolvedValue(
    Response.json({
      as_of: "2026-01-01",
      start: "2025-12-25",
      end: "2026-01-01",
      environment: "production",
      items: [],
      next_cursor: null,
    }),
  );
  expect(
    (
      await loadSessions({
        environment: "production",
        tab: "sessions",
        token: "untrusted",
      })
    ).ok,
  ).toBe(true);
  expect(fetchMock).toHaveBeenCalledWith(
    "http://localhost:9999/v1/admin/telemetry/sessions?environment=production",
    expect.objectContaining({
      method: "GET",
      cache: "no-store",
      headers: expect.objectContaining({
        Authorization: "Bearer private-token",
      }),
    }),
  );
});
it("handles expired sessions and required password changes", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("private-token") });
  fetchMock.mockResolvedValueOnce(Response.json({}, { status: 401 }));
  await expect(loadOverview({})).rejects.toThrow("redirect:/admin/login");
  fetchMock.mockResolvedValueOnce(
    Response.json(
      { detail: { code: "password_change_required" } },
      { status: 403 },
    ),
  );
  await expect(loadOverview({})).rejects.toThrow(
    "redirect:/admin/change-password",
  );
});
it("distinguishes missing deployments, invalid filters and malformed responses", async () => {
  mocks.get.mockReturnValue({ value: await sealSession("private-token") });
  fetchMock.mockResolvedValueOnce(Response.json({}, { status: 404 }));
  expect(await loadOverview({})).toMatchObject({
    ok: false,
    error: expect.stringContaining("database migration"),
  });
  fetchMock.mockResolvedValueOnce(Response.json({}, { status: 422 }));
  expect(await loadOverview({})).toMatchObject({
    ok: false,
    error: expect.stringContaining("telemetry dates"),
  });
  fetchMock.mockResolvedValueOnce(Response.json({ summary: {} }));
  expect(await loadOverview({})).toMatchObject({
    ok: false,
    error: expect.stringContaining("unsupported telemetry"),
  });
});
it("rejects malformed identity paths before accessing the backend", async () => {
  expect(await loadDetail("../../auth/me", "invalid", {})).toMatchObject({
    ok: false,
  });
  expect(fetchMock).not.toHaveBeenCalled();
});
