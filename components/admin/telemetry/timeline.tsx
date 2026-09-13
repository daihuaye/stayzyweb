"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  date,
  format,
  label,
  percent,
  type Detail,
  type Interval,
} from "@/lib/telemetry";
import { Empty } from "./charts";
const colors = [
  "#087e83",
  "#b3803f",
  "#526d8e",
  "#986785",
  "#71854b",
  "#b32d37",
];
function stateColor(kind: string) {
  if (kind === "focused") return "#087e83";
  if (kind === "manual_break") return "#986785";
  if (["recovering", "camera_interrupted", "failed"].includes(kind))
    return "#b32d37";
  if (
    [
      "permission_waiting",
      "camera_starting",
      "acquiring",
      "warming_up",
      "confirming_exit",
      "relaunch_waiting",
    ].includes(kind)
  )
    return "#b3803f";
  return "#65716d";
}
export function Timeline({ data }: { data: Detail }) {
  const [page, setPage] = useState(0);
  const snapshotIntervals = data.selected_snapshot?.intervals || [];
  // State snapshots and transition-derived state intervals are alternative measurements.
  const intervals: (Interval & { lane: string })[] = [
    ...data.state_intervals.map((i) => ({ ...i, lane: "State" })),
    ...snapshotIntervals
      .filter((i) => i.lane !== "state")
      .map((i) => ({
        ...i,
        lane:
          i.kind === "buddy_visit" || i.kind === "unknown_visit"
            ? `Buddy ${i.participant_id?.slice(0, 8) || "unknown"} · epoch ${i.recognition_epoch_id?.slice(0, 8) || "unavailable"}`
            : "Presence / breaks",
      })),
  ].sort((a, b) => a.started_at - b.started_at);
  const markers = data.markers.map((m) => ({
    ...m,
    at: new Date(m.occurred_at).getTime() / 1000,
  }));
  const allTimes = [
    ...intervals.flatMap((i) => [
      i.started_at,
      i.ended_at ?? i.started_at + i.duration,
    ]),
    ...markers.map((m) => m.at),
    ...data.checkpoints.map((c) => c.at),
  ];
  if (!allTimes.length)
    return <Empty>No retained timeline or checkpoints are available.</Empty>;
  const start = allTimes.reduce((a, b) => Math.min(a, b), Infinity),
    end = allTimes.reduce((a, b) => Math.max(a, b), start + 1),
    span = end - start;
  const x = (t: number) =>
    180 + Math.max(0, Math.min(1, (t - start) / span)) * 720;
  const lanes = Array.from(new Set(intervals.map((i) => i.lane)));
  const height = (lanes.length + 1) * 44 + 100;
  const selected = intervals.slice(page * 50, (page + 1) * 50);
  return (
    <div className="space-y-4">
      <p className="text-xs leading-5 text-muted-foreground">
        Blank space is unobserved time. Overlapping lanes measure different
        things and must not be added. Times are UTC.
      </p>
      <div
        className="flex flex-wrap gap-4 text-xs text-muted-foreground"
        aria-label="State lane legend"
      >
        {[
          ["Focused", "#087e83"],
          ["Waiting", "#b3803f"],
          ["Manual break", "#986785"],
          ["Technical", "#b32d37"],
          ["Other / away", "#65716d"],
        ].map(([name, color]) => (
          <span key={name} className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {name}
          </span>
        ))}
      </div>
      <div className="overflow-x-auto">
        <svg
          role="img"
          aria-label="Session timeline with state, presence, buddy and diagnostic lanes. Complete interval values are in the table below."
          viewBox={`0 0 940 ${height}`}
          className="min-w-[760px] w-full"
        >
          <title>{`Session timeline from ${date(start)} to ${date(end)}`}</title>
          {lanes.map((lane, index) => (
            <g key={lane}>
              <text x="0" y={index * 44 + 25} fill="#65716d" fontSize="11">
                {lane.slice(0, 27)}
              </text>
              <line
                x1="180"
                x2="900"
                y1={index * 44 + 20}
                y2={index * 44 + 20}
                stroke="#dedfd8"
              />
              {intervals
                .filter((i) => i.lane === lane)
                .map((i) => (
                  <rect
                    key={i.id}
                    x={x(i.started_at)}
                    y={index * 44 + 8}
                    width={Math.max(
                      2,
                      x(i.ended_at ?? i.started_at + i.duration) -
                        x(i.started_at),
                    )}
                    height="24"
                    rx="3"
                    fill={
                      lane === "State"
                        ? stateColor(i.kind)
                        : colors[index % colors.length]
                    }
                  >
                    <title>{`${label(i.kind)} · ${format(i.duration, 2)}s · ${date(i.started_at)}`}</title>
                  </rect>
                ))}
            </g>
          ))}
          <text x="0" y={lanes.length * 44 + 25} fill="#65716d" fontSize="11">
            Diagnostics / outcomes
          </text>
          {markers.map((m) => (
            <circle
              key={m.event_id}
              cx={x(m.at)}
              cy={lanes.length * 44 + 20}
              r="5"
              fill={m.name.includes("error") ? "#b32d37" : "#526d8e"}
            >
              <title>{`${m.name} · ${String(m.properties.reason || m.properties.status || "")} · ${date(m.at)}`}</title>
            </circle>
          ))}
          <text x="180" y={height - 25} fontSize="10" fill="#65716d">
            {date(start)}
          </text>
          <text
            x="900"
            y={height - 25}
            textAnchor="end"
            fontSize="10"
            fill="#65716d"
          >
            {date(end)}
          </text>
        </svg>
      </div>
      <details>
        <summary className="min-h-11 cursor-pointer py-3 text-sm">
          Inspect interval values ({intervals.length})
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-border">
                {["Lane", "Kind", "Started · UTC", "Recorded duration"].map(
                  (h) => (
                    <th className="py-3" key={h}>
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {selected.map((i) => (
                <tr
                  key={`${i.lane}/${i.id}`}
                  className="border-b border-border/60"
                >
                  <td className="py-3">{i.lane}</td>
                  <td>{label(i.kind)}</td>
                  <td>{date(i.started_at)}</td>
                  <td>{format(i.duration, 2)} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button
            variant="ghost"
            disabled={!page}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-xs">Page {page + 1}</span>
          <Button
            variant="ghost"
            disabled={(page + 1) * 50 >= intervals.length}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </details>
      <h3 className="pt-3 text-sm font-medium">Progress checkpoints</h3>
      <p className="text-xs text-muted-foreground">
        {data.checkpoints.length} of {data.checkpoint_count} checkpoints shown.
        Lines stop at each checkpoint; no progress is invented between
        observations.
      </p>
      <svg
        role="img"
        aria-label="Recorded progress checkpoints from zero to one hundred percent"
        viewBox="0 0 940 140"
        className="w-full"
      >
        <title>Recorded progress checkpoints</title>
        <line x1="60" x2="900" y1="110" y2="110" stroke="#dedfd8" />
        <text x="0" y="20" fontSize="11">
          100%
        </text>
        <text x="20" y="115" fontSize="11">
          0%
        </text>
        {data.checkpoints
          .filter((c) => c.progress !== null)
          .map((c) => (
            <circle
              key={c.sequence}
              cx={60 + ((c.at - start) / span) * 840}
              cy={110 - (c.progress || 0) * 95}
              r="3"
              fill="#087e83"
            >
              <title>{`${date(c.at)} · ${percent(c.progress)}`}</title>
            </circle>
          ))}
      </svg>
      <details>
        <summary className="min-h-11 cursor-pointer py-3 text-xs">
          View checkpoint data
        </summary>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th>Time · UTC</th>
                <th>Progress</th>
                <th>Confirmed present</th>
              </tr>
            </thead>
            <tbody>
              {data.checkpoints.map((c) => (
                <tr key={c.sequence}>
                  <td className="py-2">{date(c.at)}</td>
                  <td>{percent(c.progress)}</td>
                  <td>{format(c.present_seconds, 1)} s</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
