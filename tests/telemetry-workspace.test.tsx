import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TelemetryWorkspace } from "@/components/admin/telemetry/workspace";
import { overview, health } from "./fixtures/telemetry";
const state = vi.hoisted(() => ({
  search: "",
  health: vi.fn(),
  sessions: vi.fn(),
  overview: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(state.search),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/admin/telemetry",
}));
vi.mock("@/app/admin/telemetry-actions", () => ({
  loadHealth: state.health,
  loadSessions: state.sessions,
  loadOverview: state.overview,
}));
const query = {
  range: "7",
  environment: overview.environment,
  as_of: overview.as_of,
  start: overview.start,
  end: overview.end,
};
const props = {
  query,
  overview: { ok: true as const, data: overview },
  health: null,
  sessions: null,
};
beforeEach(() => {
  vi.clearAllMocks();
  state.search = "";
  state.health.mockResolvedValue({ ok: true, data: health });
});
it("loads a view on demand and reuses it when returning to the same snapshot", async () => {
  const { rerender } = render(<TelemetryWorkspace {...props} />);
  expect(state.health).not.toHaveBeenCalled();
  state.search = "tab=health";
  rerender(<TelemetryWorkspace {...props} />);
  await waitFor(() =>
    expect(
      screen.getByRole("heading", { name: "Camera performance" }),
    ).toBeInTheDocument(),
  );
  state.search = "tab=overview";
  rerender(<TelemetryWorkspace {...props} />);
  expect(
    screen.getByRole("heading", { name: "Session results" }),
  ).toBeInTheDocument();
  state.search = "tab=health";
  rerender(<TelemetryWorkspace {...props} />);
  expect(
    screen.getByRole("heading", { name: "Camera performance" }),
  ).toBeInTheDocument();
  expect(state.health).toHaveBeenCalledTimes(1);
});
it("offers a retry when a lazy view fails", async () => {
  state.health.mockResolvedValueOnce({
    ok: false,
    error: "Service unavailable",
  });
  state.search = "tab=health";
  render(<TelemetryWorkspace {...props} />);
  await screen.findByText("Service unavailable");
  fireEvent.click(screen.getByRole("button", { name: "Retry report" }));
  await screen.findByRole("heading", { name: "Camera performance" });
  expect(state.health).toHaveBeenCalledTimes(2);
});
it("fetches the first-page overview when switching away from a paginated session URL", async () => {
  state.overview.mockResolvedValue({ ok: true, data: overview });
  const initial = {
    ...props,
    query: { ...query, tab: "sessions", cursor: "next" },
    sessions: {
      ok: true as const,
      data: { ...overview, items: [], next_cursor: null },
    },
  };
  state.search = "tab=sessions&cursor=next";
  const { rerender } = render(<TelemetryWorkspace {...initial} />);
  state.search = "tab=overview";
  rerender(<TelemetryWorkspace {...initial} />);
  await screen.findByRole("heading", { name: "Session results" });
  expect(state.overview).toHaveBeenCalledWith(
    expect.objectContaining({ cursor: undefined, tab: "overview" }),
  );
});
