import { number, type Detail, type Interval } from "./telemetry";

export const stateGroups = [
  {
    key: "focus",
    title: "Focus",
    explanation: "The app recorded a focused state.",
    kinds: ["focused"],
    color: "#087e83",
  },
  {
    key: "setup",
    title: "Preparing to focus",
    explanation: "Permission, camera startup, and initial recognition.",
    kinds: ["permission_waiting", "camera_starting", "acquiring", "warming_up"],
    color: "#8b642f",
  },
  {
    key: "recovery",
    title: "Detection recovery",
    explanation: "Camera interruption, recovery, or waiting after relaunch.",
    kinds: ["recovering", "camera_interrupted", "relaunch_waiting"],
    color: "#b32d37",
  },
  {
    key: "break",
    title: "Manual breaks",
    explanation: "An explicit break, separate from technical waiting.",
    kinds: ["manual_break"],
    color: "#986785",
  },
  {
    key: "other",
    title: "Other states",
    explanation: "Away, exit confirmation, and other recorded states.",
    kinds: [] as string[],
    color: "#65716d",
  },
];

export function usableIntervals(intervals: Interval[]) {
  return intervals
    .filter(
      (i) =>
        number(i.started_at) !== null &&
        number(i.duration) !== null &&
        i.duration >= 0,
    )
    .map((i) => ({
      ...i,
      ended_at:
        number(i.ended_at) !== null && i.ended_at! >= i.started_at
          ? i.ended_at
          : i.started_at + i.duration,
    }));
}
export function sessionInsights(data: Detail) {
  // Match the state lane source. Snapshot states are alternative measurements,
  // never an additional source to add to transition-derived intervals.
  const intervals = usableIntervals(data.state_intervals);
  const known = stateGroups.flatMap((g) => g.kinds);
  const groups = stateGroups
    .map((group) => {
      const rows = intervals.filter((i) =>
        group.kinds.length
          ? group.kinds.includes(i.kind)
          : !known.includes(i.kind),
      );
      return {
        ...group,
        count: rows.length,
        seconds: rows.reduce((sum, i) => sum + i.duration, 0),
        rows,
      };
    })
    .filter((g) => g.count > 0);
  const latestOutcome = [...data.outcomes].sort(
    (a, b) => b.sequence - a.sequence,
  )[0];
  const first = Date.parse(data.session.created_at);
  const last = Date.parse(data.session.last_activity);
  const observedSpan =
    Number.isFinite(first) && Number.isFinite(last) && last >= first
      ? (last - first) / 1000
      : null;
  const snapshot = data.selected_snapshot;
  const coverage = !snapshot
    ? "No outcome snapshot"
    : snapshot.complete
      ? "Complete snapshot"
      : "Partial snapshot";
  return { groups, latestOutcome, observedSpan, coverage };
}
