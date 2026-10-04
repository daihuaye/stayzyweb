import { expect, it, vi } from "vitest";
import { createTelemetryStore, reportKey } from "@/lib/telemetry-store";
import { overview } from "./fixtures/telemetry";

it("deduplicates concurrent requests and reuses successful reports", async () => {
  const store = createTelemetryStore();
  const loader = vi.fn(async () => ({ ok: true as const, data: overview }));
  const key = reportKey({ as_of: overview.as_of }, "overview");
  const first = store.getState().load(key, loader);
  expect(store.getState().pending[key]).toBe(true);
  await Promise.all([first, store.getState().load(key, loader)]);
  await store.getState().load(key, loader);
  expect(loader).toHaveBeenCalledTimes(1);
  expect(store.getState().pending[key]).toBe(false);
});

it("isolates snapshots, filters, pagination, and administrator workspaces", async () => {
  const key = reportKey({ as_of: "first", status: "failed" }, "sessions");
  expect(key).toBe(
    reportKey({ status: "failed", as_of: "first", tab: "health" }, "sessions"),
  );
  for (const query of [
    { as_of: "second", status: "failed" },
    { as_of: "first", status: "completed" },
    { as_of: "first", status: "failed", cursor: "next" },
  ]) {
    expect(reportKey(query, "sessions")).not.toBe(key);
  }
  const first = createTelemetryStore({ [key]: { ok: true, data: overview } });
  const second = createTelemetryStore();
  expect(first.getState().reports[key]).toBeDefined();
  expect(second.getState().reports[key]).toBeUndefined();
});

it("allows failed reports to retry and settles network failures", async () => {
  const store = createTelemetryStore();
  const loader = vi
    .fn()
    .mockRejectedValueOnce(new Error("offline"))
    .mockResolvedValueOnce({ ok: true, data: overview });
  await store.getState().load("report", loader);
  expect(store.getState().reports.report.ok).toBe(false);
  expect(store.getState().pending.report).toBe(false);
  await store.getState().load("report", loader);
  expect(store.getState().reports.report.ok).toBe(true);
});
