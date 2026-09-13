import Link from "next/link";
import { ArrowUpRight, Activity, AlertTriangle } from "lucide-react";
import { Bars, Card, Empty, Funnel, Metric } from "./charts";
import { SessionFilters } from "./controls";
import {
  date,
  format,
  hours,
  href,
  label,
  number,
  percent,
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
export function OverviewPanel({
  data,
  query,
}: {
  data: Overview;
  query: Query;
}) {
  const s = data.summary,
    denominator = s.sessions_observed || 0;
  const sessions = (changes: Query) =>
    href(query, { tab: "sessions", cursor: undefined, ...changes });
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          title="Active installations"
          value={format(s.active_installations)}
          note="Anonymous installations with app activity; not identified people."
        />
        <Metric
          title="Foreground time"
          value={hours(s.foreground_seconds)}
          note="Recorded usage deltas. Offline gaps do not earn time."
        />
        <Metric
          title="Sessions started"
          value={format(s.sessions_started)}
          note={`${format(s.sessions_observed)} observed sessions, including adopted sessions.`}
          href={sessions({ stage: "started" })}
        />
        <Metric
          title="Completion rate"
          value={
            denominator
              ? percent((s.completed || 0) / denominator)
              : "Unavailable"
          }
          note={`${format(s.completed)} / ${format(denominator)} observed sessions. Latest outcome at refresh.`}
          href={sessions({ status: "completed" })}
        />
        <Metric
          title="Failure rate"
          value={
            denominator ? percent((s.failed || 0) / denominator) : "Unavailable"
          }
          note={`${format(s.failed)} / ${format(denominator)} observed sessions. Resumed sessions are reclassified.`}
          href={sessions({ status: "failed" })}
        />
        <Metric
          title="Possible drop-offs"
          value={format(s.possible_drop_offs)}
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
      <div className="grid gap-5 xl:grid-cols-2">
        <Card title="Foreground usage" note="Recorded hours by day · UTC">
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
          title="Daily outcomes"
          note="Completion and failure events on their occurrence date; a session can have multiple outcomes."
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
            color="#526d8e"
          />
        </Card>
        <Card
          title="Start attempts"
          note="Attempt cohort begins with Start tapped. Gating is an optional branch."
        >
          <Funnel
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
            {format(data.setup_views)} setup views are shown separately because
            not all carry an attempt ID.
          </p>
        </Card>
        <Card
          title="Session funnel"
          note="Sessions created in this period, followed through refresh. Each stage requires preceding stages."
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
        <Card
          title="Where time is spent waiting"
          note="Recorded state durations in seconds. Long waits are diagnostic clues; gaps are not extrapolated."
        >
          <Bars
            horizontal
            items={data.waits.map((r) => ({
              label: label(r.label),
              value: r.value,
              href: sessions({
                wait_state: r.label || undefined,
                activity: "true",
              }),
            }))}
            unit="seconds"
            color="#b3803f"
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
        <Card
          title="Latest outcomes"
          note="One latest lifecycle status per observed session."
        >
          <Bars
            horizontal
            items={data.outcomes.map((r) => ({
              label: label(r.label),
              value: r.value,
              href: sessions({ status: r.label || undefined }),
            }))}
          />
        </Card>
        <Card
          title="Progress at exit"
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
            unit="percent"
            color="#526d8e"
          />
        </Card>
      </div>
      <Card
        title="Delivery coverage"
        note="Reports reflect telemetry received by the refresh timestamp. Recent cohorts may still be progressing or uploading."
      >
        <p className="text-sm tabular-nums">
          {format(data.quality.events)} received events in this occurrence
          window · {format(data.quality.dropped_events)} reported client-side
          drops
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          {format(data.quality.incomplete_snapshots)} incomplete latest
          snapshots out of {format(data.quality.expected_snapshots)} expected.
          Mean delivery lag {format(data.quality.mean_delivery_lag_seconds, 1)}
          s; maximum {format(data.quality.max_delivery_lag_seconds, 1)}s.{" "}
          {format(data.quality.clock_skew_events)} events have negative lag
          (clock skew). Open a session to inspect timeline parts and the
          difference between last activity and last receipt. Retained history is
          limited to 90 days from receipt.
        </p>
      </Card>
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
        {!data.items.length ? (
          <Empty />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-xs">
              <caption className="sr-only">
                Sessions matching the current cohort and diagnostic filters
              </caption>
              <thead className="border-b border-border text-muted-foreground">
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
                        {percent(row.totals.progress)}
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
                          ? `${format(row.configuration?.target_seconds)}s target`
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
                        ["Manual", row.totals.manual_seconds],
                        ["Technical", row.totals.technical_seconds],
                      ].map(([key, val]) => (
                        <p className="mb-2" key={String(key)}>
                          {String(key)}: {hours(val)}
                        </p>
                      ))}
                    </td>
                    <td className="px-2 py-4">
                      <p>{date(row.last_activity)}</p>
                      <p className="mt-2 text-muted-foreground">
                        Received {date(row.last_received)}
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
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric
          title="Camera startup"
          value={`${format(s.first_frames)} / ${format(s.attempts)}`}
          note="Verified first frames / startup attempts. Delayed delivery can cross date boundaries."
        />
        <Metric
          title="Mean startup latency"
          value={
            s.startup_mean_seconds === null
              ? "Unavailable"
              : `${format(s.startup_mean_seconds, 2)} s`
          }
          note={`Maximum ${format(s.startup_max_seconds, 2)} s across successful starts.`}
        />
        <Metric
          title="Mean processing latency"
          value={
            s.mean_processing_ms === null
              ? "Unavailable"
              : `${format(s.mean_processing_ms, 1)} ms`
          }
          note={`Weighted by ${format(s.samples)} samples. Maximum ${format(s.max_processing_ms, 1)} ms; not a percentile.`}
        />
        <Metric
          title="Recorded recoveries"
          value={format(s.recoveries)}
          note="Recovery events. Not a success rate without a matched attempt denominator."
        />
        <Metric
          title="Recognition degraded"
          value={hours(s.degraded_seconds)}
          note="Recorded degraded duration; does not establish recognition accuracy."
        />
        <Metric
          title="Missing evidence"
          value={format(s.missing_samples)}
          note="Sample count. Expected uncertainty is separate from operational errors."
        />
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card
          title="Processing over time"
          note="Sample-weighted mean milliseconds · UTC"
        >
          <Bars
            items={data.daily.map((r) => ({
              label: String(r.day).slice(0, 10),
              value: r.mean_processing_ms,
            }))}
            unit="ms"
          />
        </Card>
        <Card
          title="Error reasons"
          note="Includes aggregated repeats; frame-silence reasons appear here. Select a reason to inspect sessions."
        >
          <Bars
            horizontal
            color="#b3803f"
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
        <Card
          title="Version comparison"
          note="Mean processing latency weighted by samples for each app version."
        >
          <Bars
            horizontal
            items={data.versions.map((r) => ({
              label: `v${r.app_version}`,
              value: r.mean_processing_ms,
            }))}
            unit="ms"
            color="#526d8e"
          />
        </Card>
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
      </div>
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
                    {date(r.occurred_at)}
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
    </div>
  );
}
