import { LocalTime } from "./local-time";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Card, Empty } from "./charts";
import { Timeline } from "./timeline";
import { ReportSection } from "./report-layout";
import {
  SessionSummary,
  StateBreakdown,
  RecordedTime,
} from "./session-summary";
import { sessionInsights } from "@/lib/session-insights";
import {
  format,
  duration,
  label,
  href,
  type Detail,
  type EventPage,
  type EventRecord,
  type Properties,
  type Query,
} from "@/lib/telemetry";

function PropertiesTable({ value }: { value: Properties }) {
  const entries = Object.entries(value).filter(
    ([, v]) => v !== null && v !== undefined,
  );
  if (!entries.length)
    return (
      <p className="py-3 text-xs text-muted-foreground">
        No properties recorded.
      </p>
    );
  return (
    <dl className="grid gap-x-6 gap-y-3 text-xs sm:grid-cols-2">
      {entries.map(([key, v]) => (
        <div key={key} className="min-w-0 rounded-lg bg-muted/40 p-3">
          <dt className="text-muted-foreground">{label(key)}</dt>
          <dd className="mt-1 break-all font-mono">
            {typeof v === "object" ? JSON.stringify(v) : String(v)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
function Disclosure({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-border p-4">
      <summary className="flex min-h-11 cursor-pointer items-center justify-between gap-3 text-sm font-medium focus-visible:outline-2 focus-visible:outline-primary">
        {title}
        <ChevronDown
          aria-hidden="true"
          className="size-4 shrink-0 -rotate-90 group-open:rotate-0"
        />
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
function EventEntries({
  items,
  empty,
}: {
  items: EventRecord[];
  empty: string;
}) {
  if (!items.length) return <Empty>{empty}</Empty>;
  return (
    <div className="space-y-3">
      {[...items]
        .sort((a, b) => a.sequence - b.sequence)
        .map((e) => (
          <details
            key={e.event_id}
            className="rounded-xl border border-border p-3"
          >
            <summary className="min-h-11 cursor-pointer text-sm">
              <span className="block font-medium break-words">
                {label(e.name.replaceAll(".", " "))}
                {typeof e.properties.reason === "string"
                  ? `: ${label(e.properties.reason)}`
                  : typeof e.properties.status === "string"
                    ? `: ${label(e.properties.status)}`
                    : ""}
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                <LocalTime value={e.occurred_at} /> (run {e.run_index + 1},
                sequence {e.sequence})
              </span>
            </summary>
            <div className="mt-3">
              <PropertiesTable value={e.properties} />
            </div>
          </details>
        ))}
    </div>
  );
}
export function DetailPanel({ data }: { data: Detail }) {
  const s = data.session;
  const insights = sessionInsights(data);
  return (
    <div className="space-y-6">
      <SessionSummary data={data} />
      <ReportSection
        id="session-time"
        title="Focus, breaks & waiting"
        note="Compare recorded state durations with cumulative time. Each source measures a different part of the session."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <StateBreakdown data={data} />
          <RecordedTime data={data} />
        </div>
      </ReportSection>
      <ReportSection
        id="session-timeline"
        title="Session timeline"
        note="See when state changes, presence, and diagnostic events occurred. Expand the interval table for exact measurements."
      >
        <Card title="Activity & progress">
          <Timeline key={`${s.session_id}/${data.as_of}`} data={data} />
        </Card>
      </ReportSection>
      <ReportSection
        id="session-diagnostics"
        title="Outcomes & diagnostics"
        note="Review outcomes across app runs, then inspect the recorded events. Latest lifecycle status remains the overall session result."
      >
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card
            title="Recorded outcomes"
            note={`${data.outcomes.length} retained outcome ${data.outcomes.length === 1 ? "event" : "events"}. Sessions may resume after an earlier outcome.`}
          >
            <EventEntries
              items={data.outcomes}
              empty="No retained outcome events. The session may still be in progress or awaiting delivery."
            />
          </Card>
          <Card
            title="Diagnostic markers"
            note={`${data.markers.length} of ${data.marker_count} markers shown. This list can be partial.`}
          >
            <div
              role="region"
              aria-label="Diagnostic markers"
              tabIndex={0}
              className="max-h-96 overflow-auto focus-visible:outline-2 focus-visible:outline-primary"
            >
              <EventEntries
                items={data.markers}
                empty="No diagnostic markers recorded."
              />
            </div>
          </Card>
        </div>
      </ReportSection>
      <ReportSection
        id="session-configuration"
        title="Configuration & identity"
        note="Use the original setup and later changes to interpret progress. This installation is anonymous; it does not identify a person."
      >
        <Card title="Session context">
          <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
            {[
              ["App version", s.app_version || "Unavailable"],
              [
                "Original target",
                s.configuration_available
                  ? duration(s.configuration?.target_seconds)
                  : "Unavailable",
              ],
              [
                "Buddy tracking",
                s.buddy_tracking === null
                  ? "Unavailable"
                  : s.buddy_tracking
                    ? "Enabled"
                    : "Disabled",
              ],
              ["Environment", label(data.environment)],
            ].map(([title, value]) => (
              <div key={title}>
                <dt className="text-xs text-muted-foreground">{title}</dt>
                <dd className="mt-1 font-medium">{value}</dd>
              </div>
            ))}
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Session ID</dt>
              <dd className="mt-1 break-all font-mono text-xs">
                {s.session_id}
              </dd>
            </div>
            <div className="min-w-0">
              <dt className="text-xs text-muted-foreground">Installation ID</dt>
              <dd className="mt-1 break-all font-mono text-xs">
                {s.installation_id}
              </dd>
            </div>
          </dl>
        </Card>
        <Disclosure title="Original configuration & start context">
          {s.configuration_available && s.configuration ? (
            <div className="space-y-4">
              <PropertiesTable value={s.configuration} />
              <h3 className="text-sm font-medium">Start context</h3>
              <PropertiesTable value={s.start_metadata || {}} />
            </div>
          ) : (
            <Empty>
              Original configuration unavailable. Partially retained sessions
              are not assigned invented settings.
            </Empty>
          )}
        </Disclosure>
        <Disclosure
          title={`Configuration changes (${data.configuration_changes.length})`}
        >
          <EventEntries
            items={data.configuration_changes}
            empty="No effective configuration changes recorded."
          />
        </Disclosure>
        <Disclosure title="All cumulative measurements">
          <PropertiesTable value={s.totals} />
        </Disclosure>
        <Disclosure title={`Buddy recognition epochs (${data.epochs.length})`}>
          <p className="mb-4 text-xs leading-5 text-muted-foreground">
            An epoch reset creates new in-memory identities. Buddy IDs cannot
            establish identity across epochs. Attribution comes from the
            selected snapshot and may be partial.
          </p>
          {data.epochs.length ? (
            data.epochs.map((epoch, index) => (
              <details
                key={epoch.recognition_epoch_id}
                className="border-t border-border py-3"
              >
                <summary className="min-h-11 cursor-pointer text-sm">
                  Epoch {index + 1}
                  <span className="mt-1 block break-all font-mono text-xs text-muted-foreground">
                    {epoch.recognition_epoch_id}
                  </span>
                </summary>
                <PropertiesTable value={epoch} />
              </details>
            ))
          ) : (
            <Empty>No epoch measurements available.</Empty>
          )}
        </Disclosure>
      </ReportSection>
      <ReportSection
        id="session-delivery"
        title="Data completeness"
        note="Verify how much of the timeline was received before drawing conclusions from gaps."
      >
        <Card title={insights.coverage}>
          <p className="text-sm">
            {data.selected_snapshot
              ? `${data.selected_snapshot.received_parts} of ${data.selected_snapshot.expected_parts} parts received in the selected snapshot (revision ${data.selected_snapshot.revision}).`
              : "No outcome-referenced snapshot is available yet. Transition events and checkpoints may still provide useful observations."}
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Last received <LocalTime value={s.last_received} />. Missing parts
            and absent snapshots are data gaps, not evidence of a crash.
          </p>
          <dl className="mt-5 grid grid-cols-2 gap-4 text-xs">
            <div>
              <dt className="text-muted-foreground">
                Progress checkpoints shown
              </dt>
              <dd className="mt-1 font-mono text-base">
                {data.checkpoints.length} / {format(data.checkpoint_count)}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">
                Diagnostic markers shown
              </dt>
              <dd className="mt-1 font-mono text-base">
                {data.markers.length} / {format(data.marker_count)}
              </dd>
            </div>
          </dl>
        </Card>
        <Disclosure title={`Snapshot history (${data.snapshots.length})`}>
          {!data.snapshots.length ? (
            <Empty>No outcome-referenced snapshot is available yet.</Empty>
          ) : (
            <div className="space-y-3">
              {data.snapshots.map((snapshot) => (
                <div
                  key={`${snapshot.snapshot_id}/${snapshot.revision}`}
                  className="rounded-xl bg-muted/50 p-3 text-xs"
                >
                  <p className="font-medium">
                    {snapshot.complete ? "Complete" : "Incomplete"}:{" "}
                    {snapshot.received_parts}/{snapshot.expected_parts} parts
                    (revision {snapshot.revision})
                  </p>
                  <p className="mt-1 text-muted-foreground">
                    {snapshot.outcome_sequence === null
                      ? "No retained outcome reference"
                      : `Outcome sequence ${snapshot.outcome_sequence}`}
                    {snapshot.snapshot_id ===
                      data.selected_snapshot?.snapshot_id &&
                    snapshot.revision === data.selected_snapshot.revision
                      ? " (selected)"
                      : ""}
                  </p>
                  <p className="mt-2 break-all font-mono text-muted-foreground">
                    {snapshot.snapshot_id}
                  </p>
                </div>
              ))}
            </div>
          )}
        </Disclosure>
      </ReportSection>
    </div>
  );
}
export function EventLog({
  data,
  query,
  path,
}: {
  data: EventPage;
  query: Query;
  path: string;
}) {
  return (
    <section
      id="session-events"
      aria-labelledby="session-events-title"
      className="scroll-mt-20 space-y-4 border-t border-border pt-6"
    >
      <h2 id="session-events-title" className="text-lg font-semibold">
        Event history
      </h2>
      <Card
        title="Structured event log"
        note="Ordered by session sequence; occurrence and receipt times are shown separately. Properties contain the validated, sanitized telemetry payload."
      >
        <p className="mb-4 text-xs text-muted-foreground">
          {data.items.length} events on this page
          {data.next_cursor
            ? "; more events are available on the next page."
            : "."}
        </p>
        <div
          role="region"
          aria-label="Session event log"
          tabIndex={0}
          className="max-h-[70dvh] overflow-auto focus-visible:outline-2 focus-visible:outline-primary"
        >
          {!data.items.length ? (
            <Empty>No retained events.</Empty>
          ) : (
            data.items.map((e) => (
              <details key={e.event_id} className="border-b border-border py-1">
                <summary className="min-h-11 cursor-pointer py-3 text-xs">
                  <span className="mr-3 font-mono text-muted-foreground">
                    #{e.sequence}
                  </span>
                  <span className="font-medium">{e.name}</span>
                  <span className="ml-3 text-muted-foreground">
                    <LocalTime value={e.occurred_at} />
                  </span>
                </summary>
                <p className="mb-3 text-xs text-muted-foreground">
                  Received{" "}
                  {e.received_at ? (
                    <LocalTime value={e.received_at} />
                  ) : (
                    "Unavailable"
                  )}{" "}
                  · run {e.run_index + 1}
                </p>
                <PropertiesTable value={e.properties} />
              </details>
            ))
          )}
        </div>
        <div className="mt-4 flex gap-5 text-sm text-primary">
          {query.cursor && (
            <Link
              className="inline-flex min-h-11 items-center"
              href={href(query, { cursor: undefined }, path)}
            >
              First page
            </Link>
          )}
          {data.next_cursor && (
            <Link
              className="inline-flex min-h-11 items-center"
              href={href(query, { cursor: data.next_cursor }, path)}
            >
              Next 50 events →
            </Link>
          )}
        </div>
      </Card>
    </section>
  );
}
