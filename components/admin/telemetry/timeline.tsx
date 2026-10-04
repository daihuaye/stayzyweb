"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  date as formatDate,
  format,
  number,
  duration,
  label,
  percent,
  type Detail,
  type Interval,
} from "@/lib/telemetry";
import { useLocalTimeZone } from "./local-time";
import { stateGroups, usableIntervals } from "@/lib/session-insights";
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
  return (
    stateGroups.find((g) => g.kinds.includes(kind)) ||
    stateGroups[stateGroups.length - 1]
  ).color;
}
export function Timeline({ data }: { data: Detail }) {
  const timeZone = useLocalTimeZone();
  const date = (value: string | number) => formatDate(value, timeZone);
  const [page, setPage] = useState(0);
  const [showBuddies, setShowBuddies] = useState(false);
  const [inspection, setInspection] = useState<string | null>(null);
  const snapshotIntervals = data.selected_snapshot?.intervals || [];
  // State snapshots and transition-derived state intervals are alternative measurements.
  const intervals: (Interval & { lane: string })[] = [
    ...usableIntervals(data.state_intervals).map((i) => ({
      ...i,
      lane: "State",
    })),
    ...usableIntervals(snapshotIntervals)
      .filter((i) => i.lane !== "state")
      .map((i) => ({
        ...i,
        lane:
          i.kind === "buddy_visit" || i.kind === "unknown_visit"
            ? `Buddy ${i.participant_id?.slice(0, 8) || "unknown"} · epoch ${i.recognition_epoch_id?.slice(0, 8) || "unavailable"}`
            : "Presence / breaks",
      })),
  ].sort((a, b) => a.started_at - b.started_at);
  const markers = data.markers
    .map((m) => ({
      ...m,
      at: new Date(m.occurred_at).getTime() / 1000,
    }))
    .filter((m) => Number.isFinite(m.at));
  const allTimes = [
    ...intervals.flatMap((i) => [
      i.started_at,
      i.ended_at ?? i.started_at + i.duration,
    ]),
    ...markers.map((m) => m.at),
    ...data.checkpoints.map((c) => c.at),
  ].filter((time) => Number.isFinite(time));
  if (!allTimes.length)
    return <Empty>No retained timeline or checkpoints are available.</Empty>;
  const start = allTimes.reduce((a, b) => Math.min(a, b), Infinity),
    end = allTimes.reduce((a, b) => Math.max(a, b), start),
    span = end - start;
  const x = (t: number) =>
    180 + Math.max(0, Math.min(1, (t - start) / Math.max(1, span))) * 720;
  const visibleIntervals = intervals.filter(
    (i) => showBuddies || !i.lane.startsWith("Buddy "),
  );
  const lanes = Array.from(new Set(visibleIntervals.map((i) => i.lane)));
  const buddyCount = new Set(
    intervals.filter((i) => i.lane.startsWith("Buddy ")).map((i) => i.lane),
  ).size;
  const height = (lanes.length + 1) * 44 + 100;
  const selected = intervals.slice(page * 50, (page + 1) * 50);
  const checkpoints = data.checkpoints.filter(
    (c) => number(c.at) !== null && number(c.progress) !== null,
  );
  return (
    <div className="space-y-4">
      <p className="text-xs leading-5 text-muted-foreground">
        Blank space is unobserved time. Overlapping lanes measure different
        things and must not be added. Times are in your local timezone.
      </p>
      {buddyCount > 0 && (
        <label className="flex min-h-11 items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={showBuddies}
            onChange={(e) => setShowBuddies(e.target.checked)}
            className="size-4 accent-primary"
          />
          Show buddy lanes ({buddyCount})
        </label>
      )}
      <p className="text-xs text-muted-foreground">
        Recorded timeline span: {duration(span)}. Select an interval or marker
        to inspect it.
      </p>
      <div
        className="flex flex-wrap gap-4 text-xs text-muted-foreground"
        aria-label="State lane legend"
      >
        {[
          ["Focused", "#087e83"],
          ["Preparation", "#8b642f"],
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
      <div
        role="region"
        aria-label="Session timeline diagram"
        tabIndex={0}
        className="max-h-[32rem] overflow-auto rounded-xl focus-visible:outline-2 focus-visible:outline-primary"
      >
        <svg
          role="group"
          aria-label="Session timeline with state, presence, buddy and diagnostic lanes. Complete interval values are in the table below."
          viewBox={`0 0 940 ${height}`}
          className="min-w-[760px] w-full"
        >
          <title>{`Session timeline from ${date(start)} to ${date(end)}`}</title>
          {lanes.map((lane, index) => (
            <g key={lane}>
              <text
                x="0"
                y={index * 44 + 25}
                fill="var(--muted-foreground)"
                fontSize="11"
              >
                {lane.slice(0, 27)}
              </text>
              <line
                x1="180"
                x2="900"
                y1={index * 44 + 20}
                y2={index * 44 + 20}
                stroke="var(--border)"
              />
              {visibleIntervals
                .filter((i) => i.lane === lane)
                .map((i) => (
                  <rect
                    key={i.id}
                    role="button"
                    tabIndex={0}
                    aria-label={`Inspect ${label(i.kind)}: ${duration(i.duration)}, ${date(i.started_at)}`}
                    className="cursor-pointer focus:outline-2 focus:outline-primary"
                    onClick={() =>
                      setInspection(
                        `${i.lane}: ${label(i.kind)}. Started ${date(i.started_at)}. Recorded duration: ${duration(i.duration)}.`,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setInspection(
                          `${i.lane}: ${label(i.kind)}. Started ${date(i.started_at)}. Recorded duration: ${duration(i.duration)}.`,
                        );
                      }
                    }}
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
          <text
            x="0"
            y={lanes.length * 44 + 25}
            fill="var(--muted-foreground)"
            fontSize="11"
          >
            Diagnostics / outcomes
          </text>
          {markers.map((m) => (
            <circle
              key={m.event_id}
              role="button"
              tabIndex={0}
              aria-label={`Inspect ${m.name} at ${date(m.at)}`}
              className="cursor-pointer focus:outline-2 focus:outline-primary"
              onClick={() =>
                setInspection(
                  `${m.name}: ${String(m.properties.reason || m.properties.status || "No reason recorded")}. ${date(m.at)} (sequence ${m.sequence}).`,
                )
              }
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setInspection(
                    `${m.name}: ${String(m.properties.reason || m.properties.status || "No reason recorded")}. ${date(m.at)} (sequence ${m.sequence}).`,
                  );
                }
              }}
              cx={x(m.at)}
              cy={lanes.length * 44 + 20}
              r="5"
              fill={m.name.includes("error") ? "#b32d37" : "#526d8e"}
            >
              <title>{`${m.name} · ${String(m.properties.reason || m.properties.status || "")} · ${date(m.at)}`}</title>
            </circle>
          ))}
          <text
            x="180"
            y={height - 25}
            fontSize="10"
            fill="var(--muted-foreground)"
          >
            {date(start)}
          </text>
          <text
            x="900"
            y={height - 25}
            textAnchor="end"
            fontSize="10"
            fill="var(--muted-foreground)"
          >
            {date(end)}
          </text>
        </svg>
      </div>
      {inspection && (
        <p
          role="status"
          className="rounded-xl border border-border bg-muted/50 p-4 text-sm leading-6"
        >
          {inspection}
        </p>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer py-3 text-sm">
          Inspect interval values ({intervals.length})
        </summary>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[650px] text-left text-xs tabular-nums">
            <thead>
              <tr className="border-b border-border">
                {[
                  "Lane",
                  "Kind",
                  "Started · local time",
                  "Recorded duration",
                ].map((h) => (
                  <th className="py-3" key={h}>
                    {h}
                  </th>
                ))}
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
        Each point is a reported measurement. No progress is inferred between
        observations; both diagrams use the same time axis.
      </p>
      {!checkpoints.length ? (
        <Empty>No measured progress checkpoints available.</Empty>
      ) : (
        <div
          role="region"
          aria-label="Session progress diagram"
          tabIndex={0}
          className="overflow-auto focus-visible:outline-2 focus-visible:outline-primary"
        >
          <svg
            role="img"
            aria-label="Recorded progress checkpoints from zero to one hundred percent"
            viewBox="0 0 940 160"
            className="min-w-[760px] w-full"
          >
            <title>Recorded progress checkpoints</title>
            <line x1="180" x2="900" y1="110" y2="110" stroke="var(--border)" />
            <line
              x1="180"
              x2="900"
              y1="15"
              y2="15"
              stroke="var(--border)"
              strokeDasharray="4 4"
            />
            {Array.from({ length: 5 }, (_, i) => (
              <text
                key={i}
                x={180 + i * 180}
                y="140"
                textAnchor={i === 4 ? "end" : "start"}
                fontSize="11"
                fill="var(--muted-foreground)"
              >
                {format((span * i) / 4 / 60, 1)} min
              </text>
            ))}
            <text x="0" y="20" fontSize="11">
              100%
            </text>
            <text x="20" y="115" fontSize="11">
              0%
            </text>
            {checkpoints.map((c) => (
              <circle
                key={c.sequence}
                cx={x(c.at)}
                cy={110 - Math.max(0, Math.min(1, c.progress!)) * 95}
                r="3"
                fill="#087e83"
              >
                <title>{`${date(c.at)} · ${percent(c.progress)}`}</title>
              </circle>
            ))}
          </svg>
        </div>
      )}
      <details>
        <summary className="min-h-11 cursor-pointer py-3 text-xs">
          View checkpoint data
        </summary>
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr>
                <th>Time · local</th>
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
