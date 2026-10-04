import {
  AlertTriangle,
  ArrowDownRight,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";
import {
  duration,
  format,
  label,
  number,
  percent,
  type Detail,
} from "@/lib/telemetry";
import { sessionInsights } from "@/lib/session-insights";
import { LocalTime } from "./local-time";
import { Empty } from "./charts";

export function SessionSummary({ data }: { data: Detail }) {
  const s = data.session;
  const insights = sessionInsights(data);
  const reason = insights.latestOutcome?.properties.reason;
  const matchesOutcome =
    insights.latestOutcome?.properties.status === s.status ||
    insights.latestOutcome?.name === `session.${s.status}`;
  const outcomeReason =
    matchesOutcome && typeof reason === "string" ? label(reason) : null;
  const metrics = [
    [
      "Target progress",
      percent(s.totals.progress),
      "Latest cumulative measurement",
    ],
    [
      "Confirmed focus",
      duration(s.totals.present_seconds),
      "Recorded present time",
    ],
    [
      "App runs",
      format(s.run_count),
      "Continuations or restarts in this session",
    ],
    [
      "Reported errors",
      format(s.error_count),
      "Includes aggregated repeated errors",
    ],
  ];
  return (
    <section
      id="session-summary"
      aria-labelledby="session-summary-title"
      className="scroll-mt-20 rounded-2xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="session-summary-title" className="text-lg font-semibold">
            Session at a glance
          </h2>
          <p className="mt-3 flex items-center gap-2 text-xl font-semibold tracking-tight">
            {s.status === "completed" ? (
              <CheckCircle2 className="size-5 text-primary" />
            ) : (
              <ArrowDownRight className="size-5 text-muted-foreground" />
            )}
            {label(s.status)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Last recorded state: {label(s.state)}
            {outcomeReason && ` (${outcomeReason})`}
          </p>
        </div>
        <a
          href="#session-delivery"
          className="inline-flex min-h-11 items-center rounded-xl border border-border px-3 text-xs font-medium hover:bg-muted focus-visible:outline-2 focus-visible:outline-primary"
        >
          {insights.coverage}
        </a>
      </div>
      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 border-t border-border pt-5 lg:grid-cols-4">
        {metrics.map(([title, value, note]) => (
          <div key={title}>
            <dt className="text-xs text-muted-foreground">{title}</dt>
            <dd className="mt-2 font-mono text-xl font-semibold tracking-tight sm:text-2xl">
              {value}
            </dd>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {note}
            </p>
          </div>
        ))}
      </dl>
      <div className="mt-5 grid gap-4 border-t border-border pt-4 text-xs sm:grid-cols-2">
        <p>
          <span className="block text-muted-foreground">First observed</span>
          <span className="mt-1 block">
            <LocalTime value={s.created_at} />
          </span>
        </p>
        <p>
          <span className="block text-muted-foreground">Last activity</span>
          <span className="mt-1 block">
            <LocalTime value={s.last_activity} />
          </span>
        </p>
      </div>
      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        Observed span: {duration(insights.observedSpan)}. Includes gaps and
        breaks; this is not active app time.
      </p>
      {(s.possible_drop_off || !data.selected_snapshot?.complete) && (
        <p className="mt-4 flex items-start gap-2 rounded-xl bg-muted p-3 text-xs leading-5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            {s.possible_drop_off
              ? "Possible drop-off: no activity or delivery for at least 24 hours, excluding explicit manual breaks. "
              : ""}
            {!data.selected_snapshot?.complete
              ? "The outcome timeline is unavailable or partial. Missing data does not establish a crash or abandonment."
              : ""}
          </span>
        </p>
      )}
    </section>
  );
}

export function StateBreakdown({ data }: { data: Detail }) {
  const { groups } = sessionInsights(data);
  const peak = Math.max(1, ...groups.map((g) => g.seconds));
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-semibold">Recorded time by state group</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Transition-derived state intervals only. These durations are not a
        partition of elapsed time; gaps and overlaps are not filled in.
      </p>
      {!groups.length ? (
        <div className="mt-4">
          <Empty>
            No state intervals recorded. Cumulative totals may still be
            available.
          </Empty>
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {groups.map((g) => (
            <details key={g.key} className="group">
              <summary className="list-none cursor-pointer rounded-lg py-2 focus-visible:outline-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                <span className="inline-flex w-full flex-wrap items-baseline justify-between gap-2">
                  <span className="inline-flex items-center gap-2 text-sm font-medium">
                    <ChevronDown
                      aria-hidden="true"
                      className="size-4 -rotate-90 group-open:rotate-0"
                    />
                    {g.title}
                  </span>
                  <span className="font-mono text-sm">
                    {duration(g.seconds)}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="mt-2 block h-1.5 rounded-full"
                  style={{
                    width: `${Math.max(1, (g.seconds / peak) * 100)}%`,
                    backgroundColor: g.color,
                  }}
                />
              </summary>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {g.explanation} {g.count} recorded intervals.
              </p>
              <dl className="mt-2 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
                {Array.from(new Set(g.rows.map((i) => i.kind))).map((kind) => (
                  <div
                    key={kind}
                    className="flex justify-between gap-3 rounded-lg bg-muted/50 p-3"
                  >
                    <dt>{label(kind)}</dt>
                    <dd className="font-mono">
                      {duration(
                        g.rows
                          .filter((i) => i.kind === kind)
                          .reduce((sum, i) => sum + i.duration, 0),
                      )}
                    </dd>
                  </div>
                ))}
              </dl>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}

export function RecordedTime({ data }: { data: Detail }) {
  const items = [
    ["Confirmed focus", "present_seconds", "Time recorded as present."],
    ["Away", "away_seconds", "Recorded absence; can overlap state durations."],
    ["Manual breaks", "manual_seconds", "Explicit break time."],
    [
      "Technical waiting",
      "technical_seconds",
      "Recorded technical delay, separate from a manual break.",
    ],
  ];
  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-semibold">Cumulative time measurements</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">
        Latest reported totals. Categories can overlap and must not be added.
      </p>
      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {items.map(([title, key, note]) => (
          <div key={key}>
            <dt className="text-xs text-muted-foreground">{title}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold">
              {duration(number(data.session.totals[key]))}
            </dd>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {note}
            </p>
          </div>
        ))}
      </dl>
    </div>
  );
}
