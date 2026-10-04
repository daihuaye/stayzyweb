import { createStore } from "zustand/vanilla";
import type { Result } from "./experiments";
import type { Health, Overview, Query, SessionPage } from "./telemetry";

export type TelemetryTab = "overview" | "sessions" | "health";
export type Report = Overview | Health | SessionPage;
export function reportKey(query: Query, tab: TelemetryTab) {
  return JSON.stringify([
    tab,
    Object.entries(query)
      .filter(([key, value]) => key !== "tab" && value)
      .sort(([a], [b]) => a.localeCompare(b)),
  ]);
}
export type TelemetryState = {
  reports: Record<string, Result<Report>>;
  pending: Record<string, boolean>;
  load: (key: string, loader: () => Promise<Result<Report>>) => Promise<void>;
};
// One store per workspace/snapshot, never shared between server requests or users.
// Selectors subscribe only to the visible report; concurrent requests are deduplicated.
export function createTelemetryStore(reports: TelemetryState["reports"] = {}) {
  const requests = new Map<string, Promise<void>>();
  return createStore<TelemetryState>((set, get) => ({
    reports,
    pending: {},
    load: (key, loader) => {
      if (get().reports[key]?.ok) return Promise.resolve();
      const existing = requests.get(key);
      if (existing) return existing;
      set((state) => ({ pending: { ...state.pending, [key]: true } }));
      const request = Promise.resolve()
        .then(loader)
        .then((result) => {
          set((state) => ({ reports: { ...state.reports, [key]: result } }));
        })
        .catch(() => {
          set((state) => ({
            reports: {
              ...state.reports,
              [key]: {
                ok: false,
                error:
                  "The report could not be received. Check your connection and retry.",
              },
            },
          }));
        })
        .finally(() => {
          requests.delete(key);
          set((state) => ({ pending: { ...state.pending, [key]: false } }));
        });
      requests.set(key, request);
      return request;
    },
  }));
}
