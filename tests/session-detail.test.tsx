import { expect, it } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { sessionInsights } from "@/lib/session-insights";
import { DetailPanel } from "@/components/admin/telemetry/detail";
import { Timeline } from "@/components/admin/telemetry/timeline";
import { sessionDetail as data } from "./fixtures/session-detail";

it("groups measured states using only transition intervals, preserving unknown states", () => {
  const insights = sessionInsights({
    ...data,
    state_intervals: [
      ...data.state_intervals,
      { id: "new", kind: "future_state", started_at: 100, duration: 10 },
      { id: "invalid", kind: "focused", started_at: 100, duration: NaN },
    ],
    selected_snapshot: {
      ...data.selected_snapshot!,
      intervals: [
        {
          id: "duplicate",
          lane: "state",
          kind: "focused",
          started_at: 100,
          duration: 999,
        },
      ],
    },
  });
  expect(insights.groups.find((g) => g.key === "focus")?.seconds).toBe(600);
  expect(insights.groups.find((g) => g.key === "setup")?.seconds).toBe(27);
  expect(insights.groups.find((g) => g.key === "other")?.seconds).toBe(10);
  expect(insights.observedSpan).toBe(690);
});
it("preserves unavailable focus time and warns about partial snapshots", () => {
  render(
    <DetailPanel
      data={{
        ...data,
        session: { ...data.session, totals: { progress: null } },
        selected_snapshot: {
          ...data.selected_snapshot!,
          complete: false,
          received_parts: 1,
        },
      }}
    />,
  );
  const summary = screen.getByRole("region", { name: "Session at a glance" });
  expect(summary).toHaveTextContent("Partial snapshot");
  expect(summary).toHaveTextContent("Target progressUnavailable");
  expect(summary).toHaveTextContent("Confirmed focusUnavailable");
  expect(summary).toHaveTextContent("Missing data does not establish a crash");
});
it("offers exact interval inspection and optional buddy lanes", () => {
  render(<Timeline data={data} />);
  const diagram = screen.getByRole("region", {
    name: "Session timeline diagram",
  });
  expect(within(diagram).queryByText(/Buddy example/)).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/Show buddy lanes/));
  expect(within(diagram).getByText(/Buddy example/)).toBeInTheDocument();
  fireEvent.keyDown(
    screen.getByRole("button", { name: /Inspect camera starting/ }),
    { key: "Enter" },
  );
  expect(screen.getByRole("status")).toHaveTextContent(
    "Recorded duration: 12 seconds",
  );
});
it("shows an empty progress state rather than plotting missing values at zero", () => {
  render(
    <Timeline
      data={{
        ...data,
        checkpoints: [{ ...data.checkpoints[0], progress: null }],
      }}
    />,
  );
  expect(
    screen.getByText("No measured progress checkpoints available."),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("img", {
      name: "Recorded progress checkpoints from zero to one hundred percent",
    }),
  ).not.toBeInTheDocument();
});

it("uses the same time coordinates for timeline intervals and progress measurements", () => {
  render(<Timeline data={data} />);
  const timeline = screen.getByRole("region", {
    name: "Session timeline diagram",
  });
  const progress = screen.getByRole("region", {
    name: "Session progress diagram",
  });
  const lastFocus = within(timeline).getByRole("button", {
    name: /Inspect Focused: 5.7 minutes/,
  });
  const lastPoint = progress.querySelectorAll("circle")[1];
  const intervalEnd =
    Number(lastFocus.getAttribute("x")) +
    Number(lastFocus.getAttribute("width"));
  expect(Number(lastPoint.getAttribute("cx"))).toBeCloseTo(intervalEnd);
});

it("does not apply an earlier failure reason to a resumed session", () => {
  render(
    <DetailPanel
      data={{
        ...data,
        session: { ...data.session, status: "inProgress" },
        outcomes: [
          {
            ...data.outcomes[0],
            properties: { status: "failed", reason: "camera_error" },
          },
        ],
      }}
    />,
  );
  expect(
    screen.getByRole("region", { name: "Session at a glance" }),
  ).not.toHaveTextContent("camera error");
});
