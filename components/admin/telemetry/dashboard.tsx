import { LocalTime } from "./local-time";
import Link from "next/link";
import {
  ArrowUpRight,
  Activity,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { Bars, Card, Empty, Funnel, Metric } from "./charts";
import { ReportNav, ReportSection } from "./report-layout";
import { SessionFilters } from "./controls";
import {
  format,
  duration,
  href,
  label,
  number,
  percent,
  rate,
  type Meta,
  sessionHref,
  type Health,
  type Overview,
  type Query,
  type SessionPage,
} from "@/lib/telemetry";
export function ReportingError({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-destructive/30 bg-card p-6"
    >
      <AlertTriangle className="mb-3 size-5 text-destructive" />
      <h2 className="font-semibold">Telemetry could not be loaded</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{message}</p>
    </div>
  );
}
function ReportSummary({
  data,
  children,
}: {
  data: Meta;
  children: React.ReactNode;
}) {
  return (
    <section
      id="summary"
      aria-label="Report summary"
      className="scroll-mt-24 rounded-2xl border border-border bg-card p-5"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold tracking-tight">Report summary</h2>
        <p className="text-xs text-muted-foreground">
          {label(data.environment)} environment
        </p>
      </div>
      <p className="mt-2 text-xs leading-5 text-muted-foreground">
        <LocalTime value={data.start} /> to <LocalTime value={data.end} /> (end
        excluded)
      </p>
      <div className="mt-4 space-y-2 text-sm leading-6">{children}</div>
    </section>
  );
}
function WaitingStates({ data, query }: { data: Overview; query: Query }) {
  const definitions = [
    {
      title: "Preparing to focus",
      note: "Waiting for permission, camera startup, or initial recognition.",
      states: [
        "permission_waiting",
        "camera_starting",
        "acquiring",
        "warming_up",
      ],
    },
    {
      title: "Restoring detection",
      note: "Camera interruptions, recovery, or waiting after a relaunch.",
      states: ["recovering", "camera_interrupted", "relaunch_waiting"],
    },
    {
      title: "Other recorded waits",
      note: "Other states reported by the app, kept separate from startup and recovery.",
      states: [] as string[],
    },
  ];
  const known = definitions.flatMap((group) => group.states);
  if (!data.waits.length) return <Empty />;
  return (
    <div className="space-y-3">
      {definitions.map((group) => {
        const rows = data.waits.filter((row) =>
          group.states.length
            ? group.states.includes(row.label || "")
            : !known.includes(row.label || ""),
        );
        if (!rows.length) return null;
        const total = rows.every((row) => number(row.value) !== null)
          ? rows.reduce((sum, row) => sum + row.value!, 0)
          : null;
        return (
          <details
            key={group.title}
            open
            className="group rounded-xl border border-border p-3"
          >
            <summary className="flex min-h-11 cursor-pointer flex-wrap items-center justify-between gap-2 text-sm font-medium">
              <span className="flex items-center gap-2">
                <ChevronDown
                  aria-hidden="true"
                  className="size-4 -rotate-90 group-open:rotate-0"
                />
                {group.title}
              </span>
              <span className="font-mono text-xs">{duration(total)}</span>
            </summary>
            <p className="mb-4 mt-1 text-xs leading-5 text-muted-foreground">
              {group.note} Group total uses recorded durations only.
            </p>
            <Bars
              horizontal
              items={rows.map((row) => ({
                label: label(row.label),
                value: row.value,
                href: row.label
                  ? href(query, {
                      tab: "sessions",
                      cursor: undefined,
                      wait_state: row.label,
                      activity: "true",
                    })
                  : undefined,
              }))}
              unit="seconds"
            />
          </details>
        );
      })}
    </div>
  );
}
export function OverviewPanel({
  data,
  query,
}: {
  data: Overview;
  query: Query;
}) {
  const s = data.summary;
  const sessions = (changes: Query) =>
    href(query, { tab: "sessions", cursor: undefined, ...changes });
  const longestWait = data.waits
    .filter((r) => number(r.value) !== null && r.value! > 0)
    .sort((a, b) => b.value! - a.value!)[0];
  return (
    <div className="space-y-6">
      <ReportNav
        items={[
          ["summary", "Summary"],
          ["results", "Results"],
          ["setup", "Setup"],
          ["activity", "Activity & waiting"],
          ["coverage", "Delivery"],
        ]}
      />
      <ReportSummary data={data}>
        <p>
          {rate(s.completed, s.sessions_observed) === "Unavailable" ? (
            "Completion rate is unavailable for this period."
          ) : (
            <>
              <strong>
                {format(s.completed)} of {format(s.sessions_observed)} observed
                sessions completed
              </strong>{" "}
              ({rate(s.completed, s.sessions_observed)}).
            </>
          )}{" "}
          {format(s.failed)} failed; {format(s.incomplete)} remain incomplete.
        </p>
        <p className="text-muted-foreground">
          {format(s.active_installations)} active installations recorded{" "}
          {duration(s.foreground_seconds)} of foreground app use.{" "}
          {format(s.possible_drop_offs)} unfinished sessions had no activity or
          delivery for at least 24 hours; manual breaks are excluded.
        </p>
        {longestWait && (
          <p className="text-muted-foreground">
            Largest recorded wait:{" "}
            <Link
              className="font-medium text-primary underline underline-offset-4"
              href={sessions({
                wait_state: longestWait.label || undefined,
                activity: "true",
              })}
            >
              {label(longestWait.label)} ({duration(longestWait.value)})
            </Link>
            . This is accumulated time, not an average per session.
          </p>
        )}
      </ReportSummary>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          title="Active installations"
          value={format(s.active_installations)}
          unit="installations"
          note="Anonymous installations with app activity; not identified people."
        />
        <Metric
          title="App use in the foreground"
          value={duration(s.foreground_seconds)}
          note="Total recorded time with the app open in the foreground. Offline gaps are excluded."
        />
        <Metric
          title="New sessions started"
          value={format(s.sessions_started)}
          unit="sessions"
          note={`${format(s.sessions_observed)} observed sessions, including sessions first seen after they started.`}
          href={sessions({ stage: "started" })}
        />
        <Metric
          title="Completion rate"
          value={rate(s.completed, s.sessions_observed)}
          note={`${format(s.completed)} / ${format(s.sessions_observed)} observed sessions. Latest outcome at refresh.`}
          href={sessions({ status: "completed" })}
        />
        <Metric
          title="Failure rate"
          value={rate(s.failed, s.sessions_observed)}
          note={`${format(s.failed)} / ${format(s.sessions_observed)} observed sessions. Resumed sessions are reclassified.`}
          href={sessions({ status: "failed" })}
        />
        <Metric
          title="Possible drop-offs"
          value={format(s.possible_drop_offs)}
          unit="sessions"
          note="Unfinished, no activity or delivery for 24h. Explicit manual breaks excluded."
          href={sessions({ possible_drop_off: "true" })}
        />
      </div>
      <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs leading-5 text-muted-foreground">
        <Activity className="mr-2 inline size-4" />
        {format(s.incomplete)} sessions remain incomplete. Missing outcomes can
        reflect offline delivery, suspension, or opt-out. They do not establish
        abandonment, crashes, or uninstallations.
      </div>
      <ReportSection
        id="results"
        title="Session results"
        note="Compare the latest session outcomes with progress at exit. Daily events can include more than one outcome per session."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Latest session status"
            note="One latest lifecycle status per observed session."
          >
            <Bars
              horizontal
              unit="sessions"
              items={data.outcomes.map((r) => ({
                label: label(r.label),
                value: r.value,
                href: sessions({ status: r.label || undefined }),
              }))}
            />
          </Card>
          <Card
            title="Average target progress at exit"
            note="Mean recorded progress for sessions with an ended outcome. Missing measurements are unavailable."
          >
            <Bars
              horizontal
              items={data.outcomes
                .filter((r) => r.label !== "inProgress")
                .map((r) => ({
                  label: label(r.label),
                  value:
                    number(r.mean_progress) === null
                      ? null
                      : r.mean_progress! * 100,
                  href: sessions({ status: r.label || undefined }),
                }))}
              unit="% of target"
            />
          </Card>
          <Card
            title="Daily completion and failure events"
            note="Completion and failure events on their occurrence date; a session can have multiple outcomes. Days use UTC."
          >
            <Bars
              items={data.daily.flatMap((r) => [
                {
                  label: `${String(r.day).slice(5, 10)} complete`,
                  value: r.completions,
                },
                {
                  label: `${String(r.day).slice(5, 10)} failed`,
                  value: r.failures,
                },
              ])}
              unit="outcomes"
            />
          </Card>
        </div>
      </ReportSection>
      <ReportSection
        id="setup"
        title="Starting a session"
        note="Follow access, permission, and camera milestones to see where setup stops."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="From start tap to session"
            note="Counts of start attempts in this period. Percentages use start taps as the denominator."
          >
            <Funnel
              unit="attempts"
              items={[
                { label: "Start tapped", value: data.attempts.tapped },
                {
                  label: "Session created",
                  value: data.attempts.created,
                  href: sessions({ stage: "started" }),
                },
              ]}
            />
            <p className="mt-4 text-xs leading-6 text-muted-foreground">
              {format(data.attempts.gated)} attempts saw an access gate.{" "}
              {format(data.setup_views)} setup views are shown separately
              because not all carry an attempt ID.
            </p>
          </Card>
          <Card
            title="Session setup milestones"
            note="Sessions created in this period, followed through refresh. Counts are sessions; percentages use created sessions. Each stage requires preceding stages."
          >
            <Funnel
              items={data.funnel.map((r) => ({
                label: label(r.label),
                value: r.value,
                href: sessions({ stage: r.label || "started" }),
              }))}
            />
            <Link
              href={sessions({ stage: "denied" })}
              className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs text-primary"
            >
              {format(data.permission_denials)} sessions with denied/restricted
              permission <ArrowUpRight className="size-3" />
            </Link>
          </Card>
        </div>
      </ReportSection>
      <ReportSection
        id="activity"
        title="Activity & waiting"
        note="Separate app usage from recorded waiting time. Select a waiting state to inspect affected sessions."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Where time is spent waiting"
            note="Recorded state durations in seconds. Long waits are diagnostic clues; gaps are not extrapolated."
          >
            <WaitingStates data={data} query={query} />
          </Card>
          <Card
            title="Daily app use"
            note="Total foreground app time per UTC day, in hours."
          >
            <Bars
              items={data.daily.map((r) => ({
                label: String(r.day).slice(0, 10),
                value:
                  r.foreground_seconds === null
                    ? null
                    : r.foreground_seconds / 3600,
              }))}
              unit="hours"
            />
          </Card>
          <Card
            title="Foreground time by screen"
            note="Screen-level usage deltas, in hours."
          >
            <Bars
              horizontal
              items={data.screens.map((r) => ({
                label: label(r.label),
                value: r.value === null ? null : r.value / 3600,
              }))}
              unit="hours"
            />
          </Card>
        </div>
      </ReportSection>
      <ReportSection
        id="coverage"
        title="Delivery coverage"
        note="Check data completeness before interpreting the results."
      >
        <Card
          title="Delivery measurements"
          note="Reports reflect telemetry received by the refresh timestamp. Recent cohorts may still be progressing or uploading."
        >
          <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2 xl:grid-cols-3">
            {[
              ["Received events", `${format(data.quality.events)} events`],
              [
                "Reported client drops",
                `${format(data.quality.dropped_events)} events`,
              ],
              [
                "Incomplete latest snapshots",
                `${format(data.quality.incomplete_snapshots)} of ${format(data.quality.expected_snapshots)} expected`,
              ],
              [
                "Average delivery delay",
                duration(data.quality.mean_delivery_lag_seconds),
              ],
              [
                "Longest delivery delay",
                duration(data.quality.max_delivery_lag_seconds),
              ],
              [
                "Events with clock skew",
                `${format(data.quality.clock_skew_events)} events`,
              ],
            ].map(([title, value]) => (
              <div key={title}>
                <dt className="text-xs text-muted-foreground">{title}</dt>
                <dd className="mt-1 text-base font-medium tabular-nums">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-5 text-xs leading-5 text-muted-foreground">
            Delivery delay is the time between an event occurring and the server
            receiving it. Negative delay indicates clock skew. Retained history
            covers 90 days from receipt.
          </p>
        </Card>
      </ReportSection>
    </div>
  );
}
function SessionResultSummary({ data }: { data: SessionPage }) {
  const counts = new Map<string, number>();
  for (const row of data.items)
    counts.set(row.status, (counts.get(row.status) || 0) + 1);
  return (
    <div className="rounded-xl bg-muted/50 p-4">
      <p className="text-sm font-semibold">
        {data.items.length} sessions on this page
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Latest outcomes for the loaded results only. Additional pages are not
        included.
      </p>
      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
        {Array.from(counts).map(([status, count]) => (
          <div key={status}>
            <dt className="text-xs text-muted-foreground">{label(status)}</dt>
            <dd className="mt-1 font-mono text-lg font-semibold">{count}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
export function SessionsPanel({
  data,
  query,
}: {
  data: SessionPage;
  query: Query;
}) {
  return (
    <Card
      title="Session explorer"
      note="Cohort dates normally use creation or first retained observation. Diagnostic drill-downs use activity in the date window."
    >
      <div className="space-y-5">
        <SessionFilters query={query} />
        <SessionResultSummary data={data} />
        {(query.stage || query.reason || query.wait_state) && (
          <p className="text-xs text-primary">
            Drill-down:{" "}
            {label(query.stage || query.reason || query.wait_state || "")} ·{" "}
            <Link
              className="underline"
              href={href(query, {
                stage: undefined,
                reason: undefined,
                wait_state: undefined,
                cursor: undefined,
              })}
            >
              Clear
            </Link>
          </p>
        )}
        <p className="text-sm tabular-nums">
          {format(data.items.length)} sessions on this page ·{" "}
          {format(data.items.filter((s) => s.possible_drop_off).length)}{" "}
          possible drop-offs ·{" "}
          {format(data.items.filter((s) => s.error_count > 0).length)} with
          errors
        </p>
        {!data.items.length ? (
          <Empty />
        ) : (
          <div
            role="region"
            aria-label="Session results"
            tabIndex={0}
            className="max-h-[70dvh] overflow-auto rounded-xl border border-border focus-visible:outline-2 focus-visible:outline-primary"
          >
            <table className="w-full min-w-[800px] text-left text-xs">
              <caption className="sr-only">
                Sessions matching the current cohort and diagnostic filters
              </caption>
              <thead className="sticky top-0 border-b border-border bg-card text-muted-foreground">
                <tr>
                  {[
                    "Session / installation",
                    "State & progress",
                    "Configuration",
                    "Recorded time",
                    "Activity & coverage",
                  ].map((x) => (
                    <th className="px-2 py-3 font-medium" key={x}>
                      {x}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.items.map((row) => (
                  <tr
                    key={`${row.installation_id}/${row.session_id}`}
                    className="border-b border-border/70 align-top"
                  >
                    <td className="max-w-56 px-2 py-4">
                      <Link
                        className="break-all font-mono text-primary underline underline-offset-4"
                        href={sessionHref(row, query)}
                      >
                        {row.session_id}
                      </Link>
                      <p className="mt-2 break-all font-mono text-[10px] text-muted-foreground">
                        {row.installation_id}
                      </p>
                      <p className="mt-2">
                        {row.run_count} run(s) · {format(row.error_count)}{" "}
                        errors
                      </p>
                    </td>
                    <td className="px-2 py-4">
                      <p className="font-medium">{label(row.status)}</p>
                      <p className="mt-1 text-muted-foreground">
                        {label(row.state)}
                      </p>
                      <p className="mt-3 tabular-nums">
                        {percent(row.totals.progress)} of target
                      </p>
                      {row.possible_drop_off && (
                        <p className="mt-2 rounded-md bg-amber-50 p-2 text-amber-800">
                          Possible drop-off
                        </p>
                      )}
                    </td>
                    <td className="px-2 py-4">
                      <p>v{row.app_version}</p>
                      <p className="mt-2">
                        {row.configuration_available
                          ? `${duration(row.configuration?.target_seconds)} target`
                          : "Original config unavailable"}
                      </p>
                      <p className="mt-2">
                        Buddy:{" "}
                        {row.buddy_tracking === null
                          ? "unavailable"
                          : row.buddy_tracking
                            ? "on"
                            : "off"}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-2 py-4 tabular-nums">
                      {[
                        ["Focus", row.totals.present_seconds],
                        ["Away", row.totals.away_seconds],
                        ["Manual break", row.totals.manual_seconds],
                        ["Technical wait", row.totals.technical_seconds],
                      ].map(([key, val]) => (
                        <p className="mb-2" key={String(key)}>
                          {String(key)}: {duration(val)}
                        </p>
                      ))}
                    </td>
                    <td className="px-2 py-4">
                      <p>
                        <LocalTime value={row.last_activity} />
                      </p>
                      <p className="mt-2 text-muted-foreground">
                        Received <LocalTime value={row.last_received} />
                      </p>
                      <p className="mt-2">
                        {row.timeline
                          ? `${row.timeline.received_parts}/${row.timeline.expected_parts} timeline parts${row.timeline.complete ? " · complete" : " · incomplete"}`
                          : "No outcome snapshot available"}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex gap-4 text-sm text-primary">
          {query.cursor && (
            <Link
              className="inline-flex min-h-11 items-center"
              href={href(query, { cursor: undefined })}
            >
              First page
            </Link>
          )}
          {data.next_cursor && (
            <Link
              className="inline-flex min-h-11 items-center"
              href={href(query, { cursor: data.next_cursor })}
            >
              Next 50 sessions →
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}
export function HealthPanel({ data, query }: { data: Health; query: Query }) {
  const s = data.summary;
  return (
    <div className="space-y-6">
      <ReportNav
        items={[
          ["summary", "Summary"],
          ["performance", "Performance"],
          ["diagnostics", "Errors & recovery"],
          ["attribution", "Attribution"],
          ["recent", "Recent events"],
        ]}
      />
      <ReportSummary data={data}>
        <p>
          <strong>{format(s.first_frames)} first frames recorded</strong> across{" "}
          {format(s.attempts)} camera startup attempts. Average startup time:{" "}
          {number(s.startup_mean_seconds) === null
            ? "Unavailable"
            : `${format(s.startup_mean_seconds, 2)} seconds`}
          .
        </p>
        <p className="text-muted-foreground">
          Average frame processing time:{" "}
          {number(s.mean_processing_ms) === null
            ? "Unavailable"
            : `${format(s.mean_processing_ms, 1)} milliseconds`}{" "}
          across {format(s.samples)} samples. {format(s.recoveries)} recovery
          events; {duration(s.degraded_seconds)} with degraded recognition.
        </p>
        <p className="text-xs text-muted-foreground">
          First frames and startup attempts can arrive on different days. These
          counts do not establish a camera startup success rate.
        </p>
      </ReportSummary>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          title="First frames / camera start attempts"
          value={`${format(s.first_frames)} / ${format(s.attempts)}`}
          note="Verified first frames / startup attempts. Delayed delivery can cross date boundaries."
        />
        <Metric
          title="Average camera startup time"
          value={
            number(s.startup_mean_seconds) === null
              ? "Unavailable"
              : `${format(s.startup_mean_seconds, 2)} seconds`
          }
          note={`Maximum ${format(s.startup_max_seconds, 2)} seconds across successful starts.`}
        />
        <Metric
          title="Average frame processing time"
          value={
            number(s.mean_processing_ms) === null
              ? "Unavailable"
              : `${format(s.mean_processing_ms, 1)} ms`
          }
          note={`Weighted by ${format(s.samples)} samples. Maximum ${format(s.max_processing_ms, 1)} ms; not a percentile.`}
        />
        <Metric
          title="Recovery events"
          value={format(s.recoveries)}
          unit="events"
          note="Recovery events. Not a success rate without a matched attempt denominator."
        />
        <Metric
          title="Time with degraded recognition"
          value={duration(s.degraded_seconds)}
          note="Recorded degraded duration; does not establish recognition accuracy."
        />
        <Metric
          title="Samples missing recognition evidence"
          value={format(s.missing_samples)}
          unit="samples"
          note="Sample count. Expected uncertainty is separate from operational errors."
        />
      </div>
      <ReportSection
        id="performance"
        title="Camera performance"
        note="Compare processing time across days and app versions. These measurements describe speed, not recognition accuracy."
      >
        <div className="grid gap-4 md:grid-cols-2">
          <Card
            title="Daily frame processing time"
            note="Average milliseconds per sample, weighted by sample count. Days use UTC."
          >
            <Bars
              items={data.daily.map((r) => ({
                label: String(r.day).slice(0, 10),
                value: r.mean_processing_ms,
              }))}
              unit="milliseconds"
            />
          </Card>{" "}
          <Card
            title="Frame processing time by app version"
            note="Mean processing latency weighted by samples for each app version."
          >
            <Bars
              horizontal
              items={data.versions.map((r) => ({
                label: `v${r.app_version}`,
                value: r.mean_processing_ms,
              }))}
              unit="milliseconds"
            />
          </Card>
        </div>
      </ReportSection>
      <ReportSection
        id="diagnostics"
        title="Errors & recovery"
        note="Review error reasons, then open a session for the sequence of events."
      >
        <Card
          title="Reported errors by reason"
          note="Includes aggregated repeats; frame-silence reasons appear here. Select a reason to inspect sessions."
        >
          <Bars
            horizontal
            unit="errors"
            items={data.errors.map((r) => ({
              label: `${r.name.replace(".error", "")}: ${r.reason || "unknown"}`,
              value: r.count,
              href: href(query, {
                tab: "sessions",
                activity: "true",
                errors: "true",
                reason: r.reason || undefined,
                cursor: undefined,
              }),
            }))}
          />
        </Card>
      </ReportSection>
      <ReportSection
        id="attribution"
        title="Buddy attribution"
        note="Understand which recorded time has identity evidence. Estimated and credited time may overlap."
      >
        <Card
          title="Buddy attribution coverage"
          note="Latest cumulative totals for the session cohort; estimated time can overlap credited time. These are not mutually exclusive slices."
        >
          <Bars
            horizontal
            items={[
              { label: "Known", value: s.known_seconds },
              { label: "Unknown", value: s.unknown_seconds },
              { label: "Estimated", value: s.estimated_seconds },
              {
                label: "Measured coverage",
                value: s.attribution_measured_seconds,
              },
            ]}
            unit="seconds"
          />
          <p className="mt-2 text-xs text-muted-foreground">
            {format(s.attribution_sessions)} sessions with attribution
            measurements · {format(s.ambiguous_samples)} ambiguous observations
            · {format(s.stale_tracks)} stale tracks. Multiple people may
            contribute to one frame. Inspect session epochs before comparing
            identities.
          </p>
        </Card>
      </ReportSection>
      <ReportSection
        id="recent"
        title="Recent events"
        note="Inspect the most recent errors and recovery transitions."
      >
        <Card
          title="Recent diagnostics"
          note="Most recent 25 errors and recovery transitions in the selected window."
        >
          {!data.diagnostics.length ? (
            <Empty>No diagnostics recorded in this window.</Empty>
          ) : (
            <ul className="divide-y divide-border">
              {data.diagnostics.map((r, i) => (
                <li
                  key={i}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-xs"
                >
                  <div>
                    <p className="font-medium">
                      {r.name} · {r.reason || "No reason provided"}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                      <LocalTime value={r.occurred_at} />
                    </p>
                  </div>
                  {r.session_id && (
                    <Link
                      className="inline-flex min-h-11 items-center gap-2 text-primary"
                      href={sessionHref(
                        { ...r, session_id: r.session_id },
                        query,
                      )}
                    >
                      Inspect session <ArrowUpRight className="size-3" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </ReportSection>
    </div>
  );
}
