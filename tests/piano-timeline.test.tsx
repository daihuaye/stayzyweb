import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { expect, it } from "vitest";
import { pianoTimeline } from "@/lib/piano-timeline";
import { condensedTransitions } from "@/lib/session-insights";
import { PianoTimeline } from "@/components/admin/telemetry/piano-timeline";
import { Timeline } from "@/components/admin/telemetry/timeline";
import type { Detail, EventRecord, PianoCheckpoint } from "@/lib/telemetry";

const point = (
  sequence: number,
  at: number,
  seconds: number,
  run_index = 0,
): PianoCheckpoint => ({ sequence, at, seconds, run_index });
const data = (points: PianoCheckpoint[]) =>
  ({
    session: {
      totals: { piano_play_seconds: 42, piano_tracking_status: "paused" },
    },
    piano_checkpoints: points,
  }) as unknown as Detail;

it("uses differences of cumulative piano counters, retaining zero-increase windows", () => {
  const result = pianoTimeline(
    data([
      point(1, 100, 0),
      point(2, 160, 12),
      point(3, 220, 12),
      point(4, 280, 42),
    ]),
  );
  expect(result.playing.map((w) => w.seconds)).toEqual([12, 30]);
  expect(result.windows.map((w) => w.seconds)).toEqual([12, 0, 30]);
  expect(result.gaps).toBe(0);
});

it("does not invent playing before the first retained observation or across runs, clock anomalies and counter resets", () => {
  const result = pianoTimeline(
    data([
      point(1, 100, 12),
      point(2, 160, 20, 1),
      point(3, 150, 25, 1),
      point(4, 220, 2, 1),
      point(5, 230, 40, 1),
    ]),
  );
  expect(result.playing).toEqual([]);
  expect(result.gaps).toBe(4);
  expect(result.points[0].seconds).toBe(12);
});

it("sorts by session sequence, ignores invalid values and falls back on older API observations", () => {
  const result = pianoTimeline({
    transitions: [
      {
        sequence: 2,
        occurred_at: "2026-11-01T12:01:00Z",
        run_index: 0,
        properties: { piano_play_seconds: 12 },
      },
      {
        sequence: 1,
        occurred_at: "2026-11-01T12:00:00Z",
        run_index: 0,
        properties: { piano_play_seconds: 0 },
      },
      {
        sequence: 3,
        occurred_at: "invalid",
        properties: { piano_play_seconds: 50 },
      },
    ],
    outcomes: [],
  } as unknown as Detail);
  expect(result.playing).toHaveLength(1);
  expect(result.playing[0].seconds).toBe(12);
});

it("shows a chart and time-window measurements without treating focus as playing", () => {
  render(
    <PianoTimeline
      data={data([point(1, 100, 0), point(2, 160, 12), point(3, 220, 42)])}
    />,
  );
  expect(
    screen.getByRole("img", {
      name: "Cumulative piano playing time by local timestamp",
    }),
  ).toBeInTheDocument();
  const table = screen.getByRole("table");
  expect(within(table).getByText("12 seconds")).toBeInTheDocument();
  expect(within(table).getByText("30 seconds")).toBeInTheDocument();
  expect(
    screen.getByText(/Exact playing start\/stop times are not recorded/),
  ).toBeInTheDocument();
});

it("explains totals without timestamped measurements", () => {
  render(<PianoTimeline data={data([])} />);
  expect(
    screen.getByText(/A session total alone cannot show when playing happened/),
  ).toBeInTheDocument();
  expect(screen.queryByRole("img")).not.toBeInTheDocument();
});

it("collapses alternating uncertain/away loops without hiding focused changes or joining app runs", async () => {
  const states = [
    "focused",
    "uncertain",
    "away",
    "uncertain",
    "focused",
    "away",
    "uncertain",
  ];
  const transitions = states.map((state, i) => ({
    event_id: String(i),
    name: "session.state",
    sequence: i,
    run_index: i === 6 ? 1 : 0,
    occurred_at: `2026-11-01T12:00:0${i}Z`,
    properties: { state },
  })) as EventRecord[];
  expect(condensedTransitions(transitions).map((g) => g.length)).toEqual([
    1, 3, 1, 1, 1,
  ]);
  render(
    <Timeline
      data={
        {
          session: { totals_updated_at: transitions[6].occurred_at },
          transitions,
        } as unknown as Detail
      }
    />,
  );
  const summary = screen.getByText("Uncertain / away · 3 changes");
  expect(summary.closest("details")).not.toHaveAttribute("open");
  expect(summary.closest("details")?.querySelectorAll("li")).toHaveLength(0);
  fireEvent.click(summary);
  await waitFor(() =>
    expect(summary.closest("details")?.querySelectorAll("li")).toHaveLength(3),
  );
});

it("bounds rendering even for thousands of collapsed noise events and pages expanded rows", async () => {
  const transitions = Array.from({ length: 1000 }, (_, i) => ({
    event_id: String(i),
    name: "session.state",
    sequence: i,
    run_index: 0,
    occurred_at: new Date(1_790_000_000_000 + i * 1000).toISOString(),
    properties: { state: i % 2 ? "away" : "uncertain" },
  }));
  const { container } = render(
    <Timeline
      data={
        {
          session: { totals_updated_at: transitions[999].occurred_at },
          transitions,
        } as unknown as Detail
      }
    />,
  );
  expect(container.querySelectorAll("li time")).toHaveLength(0);
  fireEvent.click(screen.getByText("Uncertain / away · 1000 changes"));
  await waitFor(() =>
    expect(container.querySelectorAll("li time")).toHaveLength(50),
  );
  expect(
    screen.getByRole("button", { name: "Previous events" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("button", { name: "Next events" }));
  expect(container.querySelector("li time")).toHaveAttribute(
    "datetime",
    transitions[50].occurred_at,
  );
  expect(container.querySelectorAll("li time")).toHaveLength(50);
});

it("keeps explicit empty checkpoints authoritative and uses outcomes on older APIs", () => {
  const events = [0, 12].map((seconds, i) => ({
    event_id: String(i),
    name: "session.outcome",
    run_index: 0,
    sequence: i,
    occurred_at: new Date(1_790_000_000_000 + i * 60_000).toISOString(),
    properties: { piano_play_seconds: seconds },
  }));
  const legacy = { transitions: [], outcomes: events } as unknown as Detail;
  expect(pianoTimeline(legacy).playing[0].seconds).toBe(12);
  expect(pianoTimeline({ ...legacy, piano_checkpoints: [] }).points).toEqual(
    [],
  );
  const valid = point(0, 100, 0);
  expect(
    pianoTimeline(
      data([
        valid,
        point(1, 100, 0),
        point(2, 160, NaN),
        point(3, 170, Infinity),
        point(4, 180, -1),
      ]),
    ).points,
  ).toHaveLength(2);
});

it("explains single measurements and gaps and pages playing windows", () => {
  const { rerender } = render(
    <PianoTimeline data={data([point(0, 100, 12)])} />,
  );
  expect(
    screen.getByText(/was already recorded at the first retained measurement/),
  ).toBeInTheDocument();
  expect(screen.getByText(/At least two measurements/)).toBeInTheDocument();
  rerender(<PianoTimeline data={data([point(0, 100, 0), point(1, 160, 0)])} />);
  expect(screen.getByText(/No increase in piano time/)).toBeInTheDocument();
  rerender(
    <PianoTimeline data={data([point(0, 100, 0), point(1, 160, 12, 1)])} />,
  );
  expect(screen.getByText(/1 measurement gap/)).toBeInTheDocument();
  rerender(
    <PianoTimeline
      data={data(
        Array.from({ length: 23 }, (_, i) => point(i, 100 + i * 60, i * 12)),
      )}
    />,
  );
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(
    21,
  );
  fireEvent.click(screen.getByRole("button", { name: "Next windows" }));
  expect(within(screen.getByRole("table")).getAllByRole("row")).toHaveLength(3);
  expect(screen.getByRole("button", { name: "Next windows" })).toBeDisabled();
});
