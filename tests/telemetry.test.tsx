import { overview, health } from "./fixtures/telemetry";
import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  Filters,
  Refresh,
  SessionFilters,
} from "@/components/admin/telemetry/controls";
import {
  ReportingError,
  OverviewPanel,
  HealthPanel,
  SessionsPanel,
} from "@/components/admin/telemetry/dashboard";
import { Bars, Funnel } from "@/components/admin/telemetry/charts";
import { Timeline } from "@/components/admin/telemetry/timeline";
import { RecordedTime } from "@/components/admin/telemetry/session-summary";
import { AdminShell } from "@/components/admin/shell";
import {
  apiQuery,
  date,
  duration,
  rate,
  pianoTelemetry,
  reportQuery,
  type Detail,
  type Session,
  type SessionPage,
} from "@/lib/telemetry";
const router = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
vi.mock("next/navigation", () => ({
  useRouter: () => router,
  usePathname: () => "/admin/telemetry",
}));
vi.mock("@/app/admin/auth-actions", () => ({ logoutAction: vi.fn() }));
beforeEach(() => vi.clearAllMocks());
const query = {
  range: "7",
  environment: "production",
  as_of: "2026-09-12T12:00:00Z",
  start: "2026-09-05T12:00:00Z",
  end: "2026-09-12T12:00:00Z",
};
const session: Session = {
  installation_id: "11111111-1111-4111-8111-111111111111",
  session_id: "22222222-2222-4222-8222-222222222222",
  created_at: query.start,
  last_activity: query.start,
  last_received: query.end,
  app_version: "1",
  status: "inProgress",
  state: "focused",
  configuration: null,
  configuration_available: false,
  buddy_tracking: null,
  possible_drop_off: false,
  error_count: 0,
  run_count: 2,
  totals: { progress: 0.3 },
};

it("shows piano duration and tracking status in the session list and detail measurements", () => {
  const pianoSession = {
    ...session,
    totals: {
      present_seconds: 10,
      piano_play_seconds: 42.5,
      piano_tracking_status: "paused",
    },
  };
  render(
    <SessionsPanel
      query={query}
      data={
        { ...query, items: [pianoSession], next_cursor: null } as SessionPage
      }
    />,
  );
  expect(screen.getByText("Piano: 42.5 seconds")).toBeInTheDocument();
  expect(screen.getByText("Paused")).toBeInTheDocument();
  render(<RecordedTime data={{ session: pianoSession }} />);
  expect(
    screen.getByText("Piano playing time").parentElement,
  ).toHaveTextContent("42.5 seconds");
  expect(
    screen.getByText(/Paused. Measured independently/),
  ).toBeInTheDocument();
});

it("distinguishes missing piano telemetry, measured zero, and unavailable tracking", () => {
  expect(pianoTelemetry({}).duration).toBe("Unavailable");
  expect(pianoTelemetry({ piano_play_seconds: 0 }).duration).toBe("0 seconds");
  expect(
    pianoTelemetry({
      piano_play_seconds: 0,
      piano_tracking_status: "listening",
    }).duration,
  ).toBe("0 seconds");
  for (const status of [
    "unavailable",
    "permissionDenied",
    "notTracked",
    "needsValidation",
  ]) {
    expect(
      pianoTelemetry({ piano_play_seconds: 0, piano_tracking_status: status })
        .duration,
    ).toBe("Unavailable");
    expect(
      pianoTelemetry({
        piano_play_seconds: 42.5,
        piano_tracking_status: status,
      }).duration,
    ).toBe("42.5 seconds");
  }
  render(<RecordedTime data={{ session }} />);
  expect(
    screen.getByText("Piano playing time").parentElement,
  ).toHaveTextContent("Unavailable");
});
it("defaults to a seven-day production snapshot and excludes UI-only API parameters", () => {
  expect(reportQuery({ as_of: query.as_of })).toMatchObject({
    environment: "production",
    start: "2026-09-05T12:00:00.000Z",
    end: "2026-09-12T12:00:00.000Z",
  });
  expect(
    apiQuery({ tab: "health", environment: "production", token: "secret" }),
  ).toBe("environment=production");
});
it("refreshes only on click and starts a new snapshot without a stale cursor", () => {
  render(<Refresh query={{ ...query, cursor: "old" }} />);
  expect(router.replace).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  const next = new URL(router.replace.mock.calls[0][0], "https://test");
  expect(next.searchParams.get("as_of")).not.toBe(query.as_of);
  expect(next.searchParams.has("cursor")).toBe(false);
  expect(next.searchParams.has("start")).toBe(false);
});
it("preserves custom dates on refresh", () => {
  render(<Refresh query={{ ...query, range: "custom" }} />);
  fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
  expect(
    new URL(router.replace.mock.calls[0][0], "https://test").searchParams.get(
      "start",
    ),
  ).toBe(query.start);
});
it("applies URL filters explicitly", async () => {
  render(<Filters query={query} versions={["1", "2"]} />);
  fireEvent.keyDown(screen.getByRole("combobox", { name: "App version" }), {
    key: " ",
  });
  fireEvent.click(await screen.findByRole("option", { name: "2" }));
  expect(router.push).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Apply filters" }));
  const next = new URL(router.push.mock.calls[0][0], "https://test");
  expect(next.searchParams.get("app_version")).toBe("2");
  expect(next.searchParams.get("environment")).toBe("production");
});
it("session search keeps the snapshot and includes only chosen filters", async () => {
  render(<SessionFilters query={{ ...query, tab: "sessions" }} />);
  fireEvent.change(screen.getByLabelText("Session UUID"), {
    target: { value: session.session_id },
  });
  fireEvent.keyDown(screen.getByRole("combobox", { name: "Activity" }), {
    key: " ",
  });
  fireEvent.click(
    await screen.findByRole("option", { name: "Possible drop-off · 24 hours" }),
  );
  fireEvent.click(screen.getByRole("button", { name: "Find sessions" }));
  const next = new URL(router.push.mock.calls[0][0], "https://test");
  expect(next.searchParams.get("session_id")).toBe(session.session_id);
  expect(next.searchParams.get("as_of")).toBe(query.as_of);
  expect(next.searchParams.get("possible_drop_off")).toBe("true");
});
it("provides chart data tables and drill-down links without fake zero measurements", () => {
  render(
    <Bars
      horizontal
      items={[
        {
          label: "Recovery",
          value: null,
          href: "/admin/telemetry?tab=sessions&wait_state=recovering",
        },
      ]}
      unit="seconds"
    />,
  );
  expect(screen.getByRole("img")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Recovery: Unavailable/ }),
  ).toHaveAttribute("href", expect.stringContaining("wait_state=recovering"));
  fireEvent.click(screen.getByText("View chart data"));
  expect(screen.getByRole("table")).toHaveTextContent("Unavailable");
});
it("does not link pre-session taps to an unrelated session cohort", () => {
  render(
    <Funnel
      items={[
        { label: "Start tapped", value: 10 },
        {
          label: "Session created",
          value: 5,
          href: "/admin/telemetry?stage=started",
        },
      ]}
    />,
  );
  expect(screen.getAllByRole("link")).toHaveLength(1);
  expect(screen.getByRole("link")).toHaveTextContent("Session created");
});
it("links session identities and reports missing configuration", () => {
  render(
    <SessionsPanel
      query={query}
      data={{ ...query, items: [session], next_cursor: "next" } as SessionPage}
    />,
  );
  expect(
    screen.getByRole("link", { name: session.session_id }),
  ).toHaveAttribute(
    "href",
    expect.stringContaining(
      `/${session.installation_id}/${session.session_id}`,
    ),
  );
  expect(screen.getByText("Original config unavailable")).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /Next 50 sessions/ }),
  ).toHaveAttribute("href", expect.stringContaining("cursor=next"));
});
it("renders an explicit empty state and actionable errors", () => {
  render(
    <>
      <SessionsPanel
        query={query}
        data={{ ...query, items: [], next_cursor: null } as SessionPage}
      />
      <ReportingError message="Deploy the Stayzy API reporting endpoints and run the database migration." />
    </>,
  );
  expect(
    screen.getByText("No telemetry matches these filters."),
  ).toBeInTheDocument();
  expect(screen.getByRole("alert")).toHaveTextContent("database migration");
});
it("keeps snapshot state intervals out of the presence lane", () => {
  const interval = {
    id: "state",
    kind: "focused",
    started_at: 100,
    duration: 10,
    ended_at: 110,
    lane: "state",
  };
  const data = {
    state_intervals: [interval],
    selected_snapshot: { intervals: [interval] },
    checkpoints: [{ at: 110, progress: 0.5, present_seconds: 10, sequence: 1 }],
    markers: [],
    checkpoint_count: 1,
  } as unknown as Detail;
  render(<Timeline data={data} />);
  expect(screen.getByText("Inspect interval values (1)")).toBeInTheDocument();
  expect(screen.queryByText("Presence / breaks")).not.toBeInTheDocument();
  expect(
    screen.getByRole("group", { name: /Session timeline with state/ }),
  ).toBeInTheDocument();
  expect(screen.getAllByRole("img")).toHaveLength(2);
});
it("shows Telemetry navigation to ordinary administrators", () => {
  render(
    <AdminShell
      account={{
        id: "1",
        email: "admin@example.test",
        role: "admin",
        active: true,
        must_change_password: false,
        created_at: "2026-01-01",
      }}
    >
      Content
    </AdminShell>,
  );
  expect(screen.getByRole("link", { name: "Telemetry" })).toHaveAttribute(
    "href",
    "/admin/telemetry",
  );
  expect(
    screen.queryByRole("link", { name: "Administrators" }),
  ).not.toBeInTheDocument();
});

it("hydrates SVG title labels without text-node mismatches", async () => {
  const { renderToString } = await import("react-dom/server");
  const { hydrateRoot } = await import("react-dom/client");
  const { act } = await import("react");
  const element = (
    <Bars items={[{ label: "2026-09-12", value: 12.5 }]} unit="hours" />
  );
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  document.body.appendChild(container);
  const error = vi.fn();
  let root: ReturnType<typeof hydrateRoot>;
  await act(async () => {
    root = hydrateRoot(container, element, { onRecoverableError: error });
  });
  expect(error).not.toHaveBeenCalled();
  await act(async () => root.unmount());
  container.remove();
});

it("formats UTC instants and epoch seconds in Pacific time with daylight saving", () => {
  expect(date("2026-01-15T02:03:04Z", "America/Los_Angeles")).toBe(
    "2026-01-14 18:03:04 PST",
  );
  expect(date("2026-07-15T02:03:04Z", "America/Los_Angeles")).toBe(
    "2026-07-14 19:03:04 PDT",
  );
  expect(
    date(Date.parse("2026-01-15T02:03:04Z") / 1000, "America/Los_Angeles"),
  ).toBe("2026-01-14 18:03:04 PST");
  expect(date("invalid", "America/Los_Angeles")).toBe("Unavailable");
});

it("hydrates timestamps into the browser timezone without mismatches", async () => {
  const { LocalTime } = await import("@/components/admin/telemetry/local-time");
  const { renderToString } = await import("react-dom/server");
  const { hydrateRoot } = await import("react-dom/client");
  const { act } = await import("react");
  const options = Intl.DateTimeFormat().resolvedOptions();
  const zone = vi
    .spyOn(Intl.DateTimeFormat.prototype, "resolvedOptions")
    .mockReturnValue({
      ...options,
      timeZone: "America/Los_Angeles",
    });
  const element = <LocalTime value="2026-01-15T02:03:04Z" />;
  const container = document.createElement("div");
  container.innerHTML = renderToString(element);
  expect(container).toHaveTextContent("2026-01-15 02:03:04 UTC");
  document.body.appendChild(container);
  const error = vi.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(async () => {
      root = hydrateRoot(container, element, { onRecoverableError: error });
    });
    expect(container).toHaveTextContent("2026-01-14 18:03:04 PST");
    expect(error).not.toHaveBeenCalled();
  } finally {
    await act(async () => root?.unmount());
    container.remove();
    zone.mockRestore();
  }
});

it("uses readable duration units and preserves missing rate measurements", () => {
  expect(duration(0)).toBe("0 seconds");
  expect(duration(45)).toBe("45 seconds");
  expect(duration(90)).toBe("1.5 minutes");
  expect(duration(7200)).toBe("2 hours");
  expect(duration(null)).toBe("Unavailable");
  expect(rate(0, 10)).toBe("0%");
  expect(rate(null, 10)).toBe("Unavailable");
  expect(rate(1, 0)).toBe("Unavailable");
});
it("summarizes the actual session denominator and makes chart and delivery units explicit", () => {
  render(<OverviewPanel data={overview} query={query} />);
  const summary = screen.getByRole("region", { name: "Report summary" });
  expect(summary).toHaveTextContent(
    "30 of 50 observed sessions completed (60%)",
  );
  expect(summary).toHaveTextContent("15 hours of foreground app use");
  expect(
    screen.getByRole("link", { name: /Completion rate/ }),
  ).toHaveTextContent("60%");
  expect(screen.getByText("Unit: sessions")).toBeInTheDocument();
  expect(screen.getByText("Unit: % of target")).toBeInTheDocument();
  expect(
    screen.getByText("Average delivery delay").nextElementSibling,
  ).toHaveTextContent("1.5 minutes");
});
it("does not present a missing completion count as a zero percent rate", () => {
  render(
    <OverviewPanel
      data={{ ...overview, summary: { ...overview.summary, completed: null } }}
      query={query}
    />,
  );
  expect(
    screen.getByRole("link", { name: /Completion rate/ }),
  ).toHaveTextContent("Unavailable");
  expect(
    screen.getByRole("region", { name: "Report summary" }),
  ).toHaveTextContent("Completion rate is unavailable");
});
it("explains health measurements with sample counts and distinct latency units", () => {
  render(<HealthPanel data={health} query={query} />);
  const summary = screen.getByRole("region", { name: "Report summary" });
  expect(summary).toHaveTextContent(
    "35 first frames recorded across 40 camera startup attempts",
  );
  expect(summary).toHaveTextContent("18.4 milliseconds across 9,000 samples");
  expect(screen.getByText("Unit: errors")).toBeInTheDocument();
  expect(screen.getAllByText("Unit: milliseconds")).toHaveLength(2);
});

it("shows timestamped state changes without legacy checkpoint details", () => {
  const data = {
    session: { ...session, totals_updated_at: query.end },
    transitions: [
      {
        event_id: "a",
        occurred_at: query.start,
        properties: { state: "focused" },
      },
      { event_id: "b", occurred_at: query.end, properties: { state: "away" } },
    ],
    checkpoints: [{ at: 110, sequence: 1 }],
  } as unknown as Detail;
  const { container } = render(<Timeline data={data} />);
  expect(
    screen.getByRole("heading", { name: "State changes" }),
  ).toBeInTheDocument();
  expect(container.querySelectorAll("li time")).toHaveLength(2);
  expect(container.querySelector("li time")).toHaveAttribute(
    "datetime",
    query.start,
  );
  expect(screen.getByText(/Updated at/)).toBeInTheDocument();
  expect(screen.queryByText("View checkpoint data")).not.toBeInTheDocument();
});

it("keeps filtered transitions separate from measured focus and piano time", () => {
  const data = {
    session: {
      ...session,
      totals: {
        present_seconds: 12,
        uncertain_seconds: 2,
        piano_play_seconds: 9,
        piano_tracking_status: "paused",
      },
    },
    transitions: [
      {
        event_id: "a",
        occurred_at: query.start,
        properties: { state: "focused", duration: 0 },
      },
      {
        event_id: "b",
        occurred_at: query.end,
        properties: { state: "away", previous_state: "focused", duration: 120 },
      },
    ],
  } as unknown as Detail;
  const { container } = render(
    <>
      <Timeline data={data} />
      <RecordedTime data={data} />
    </>,
  );
  expect(container.querySelectorAll("li time")).toHaveLength(2);
  expect(screen.queryByText("Checking presence")).not.toBeInTheDocument();
  expect(screen.getByText("Confirmed focus").parentElement).toHaveTextContent(
    "12 seconds",
  );
  expect(
    screen.getByText("Piano playing time").parentElement,
  ).toHaveTextContent("9 seconds");
});
