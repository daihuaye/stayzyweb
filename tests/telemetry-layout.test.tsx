import { expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import {
  OverviewPanel,
  SessionsPanel,
} from "@/components/admin/telemetry/dashboard";
import { overview } from "./fixtures/telemetry";
import type { Session, SessionPage } from "@/lib/telemetry";
vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
const query = { environment: overview.environment, as_of: overview.as_of };

it("groups startup and recovery waits without losing unknown or missing states", () => {
  render(
    <OverviewPanel
      query={query}
      data={{
        ...overview,
        waits: [
          { label: "camera_starting", value: 60 },
          { label: "warming_up", value: 120 },
          { label: "recovering", value: null },
          { label: "new_wait_state", value: 30 },
        ],
      }}
    />,
  );
  expect(
    screen.getByText("Preparing to focus").closest("details"),
  ).toHaveTextContent("3 minutes");
  expect(
    screen.getByText("Restoring detection").closest("details"),
  ).toHaveTextContent("Unavailable");
  expect(
    screen.getByText("Other recorded waits").closest("details"),
  ).toHaveTextContent("30 seconds");
  const summary = screen.getByRole("region", { name: "Report summary" });
  expect(summary).toHaveTextContent(
    "Largest recorded wait: warming up (2 minutes)",
  );
  expect(within(summary).getByRole("link")).toHaveAttribute(
    "href",
    expect.stringContaining("wait_state=warming_up"),
  );
  expect(
    screen.getByRole("navigation", { name: "Report sections" }),
  ).toHaveTextContent("Activity & waiting");
});

it("summarizes the loaded page by latest outcome without implying total cohort counts", () => {
  const base = {
    installation_id: "i",
    session_id: "s",
    status: "completed",
    totals: {},
    configuration_available: false,
    last_activity: overview.start,
    last_received: overview.end,
    run_count: 1,
  } as Session;
  render(
    <SessionsPanel
      query={query}
      data={
        {
          ...overview,
          items: [base, { ...base, session_id: "s2", status: "failed" }],
          next_cursor: "more",
        } as SessionPage
      }
    />,
  );
  expect(screen.getByText("2 sessions on this page")).toBeInTheDocument();
  expect(
    screen.getByText(/Additional pages are not included/),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("region", { name: "Session results" }),
  ).toHaveAttribute("tabindex", "0");
});
