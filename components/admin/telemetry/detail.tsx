import Link from "next/link";
import { Card, Empty, Metric } from "./charts";
import { Timeline } from "./timeline";
import {
  date,
  format,
  hours,
  href,
  label,
  percent,
  type Detail,
  type EventPage,
  type Properties,
  type Query,
} from "@/lib/telemetry";
function PropertiesTable({ value }: { value: Properties }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-xs sm:grid-cols-2">
      {Object.entries(value)
        .filter(([, v]) => v !== null && v !== undefined)
        .map(([key, v]) => (
          <div key={key} className="min-w-0 border-b border-border/60 py-2">
            <dt className="text-muted-foreground">{label(key)}</dt>
            <dd className="mt-1 break-all font-mono">
              {typeof v === "object" ? JSON.stringify(v) : String(v)}
            </dd>
          </div>
        ))}
    </dl>
  );
}
export function DetailPanel({ data }: { data: Detail }) {
  const s = data.session;
  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Metric
          title="Latest lifecycle"
          value={label(s.status)}
          note={`${label(s.state)} · ${s.run_count} run(s)`}
        />
        <Metric
          title="Recorded progress"
          value={percent(s.totals.progress)}
          note={`${hours(s.totals.present_seconds)} confirmed present`}
        />
        <Metric
          title="Camera / recognition errors"
          value={format(s.error_count)}
          note="Includes reported repeated errors."
        />
        <Metric
          title="Activity"
          value={s.possible_drop_off ? "Possible drop-off" : "Observed"}
          note={`Last activity ${date(s.last_activity)}`}
        />
      </div>
      <Card
        title="Session lifecycle"
        note={`Session ${s.session_id} · anonymous installation ${s.installation_id}`}
      >
        <Timeline data={data} />
      </Card>
      <div className="grid gap-5 xl:grid-cols-2">
        <Card
          title="Original configuration"
          note={`First observed ${date(s.created_at)} · app ${s.app_version}`}
        >
          {s.configuration_available && s.configuration ? (
            <>
              <PropertiesTable value={s.configuration} />
              <h3 className="mb-3 mt-5 text-sm font-medium">Start context</h3>
              <PropertiesTable value={s.start_metadata || {}} />
            </>
          ) : (
            <Empty>
              Original configuration unavailable. Adopted or partially retained
              sessions are not assigned invented settings.
            </Empty>
          )}
        </Card>
        <Card
          title="Recorded totals"
          note="Latest cumulative checkpoint. Away, breaks, state durations, and buddy time can overlap."
        >
          <PropertiesTable value={s.totals} />
        </Card>
      </div>
      <Card
        title="Timeline delivery"
        note={`Last received ${date(s.last_received)}. Missing parts and absent snapshots are data gaps, not evidence of a crash.`}
      >
        {!data.snapshots.length ? (
          <Empty>No outcome-referenced snapshot is available yet.</Empty>
        ) : (
          <ul className="space-y-3">
            {data.snapshots.map((snapshot) => (
              <li
                key={`${snapshot.snapshot_id}/${snapshot.revision}`}
                className="rounded-xl bg-muted/50 p-4 text-xs"
              >
                <p className="font-medium">
                  {snapshot.complete ? "Complete" : "Incomplete"} ·{" "}
                  {snapshot.received_parts}/{snapshot.expected_parts} parts ·
                  revision {snapshot.revision}
                  {snapshot.outcome_sequence === null
                    ? " · no retained outcome reference"
                    : ` · outcome #${snapshot.outcome_sequence}`}
                </p>
                <p className="mt-2 break-all font-mono text-muted-foreground">
                  {snapshot.snapshot_id}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Card>
      <Card title="Configuration changes">
        {data.configuration_changes.length ? (
          data.configuration_changes.map((e) => (
            <details key={e.event_id} className="border-b border-border py-2">
              <summary className="min-h-11 cursor-pointer py-3 text-sm">
                {date(e.occurred_at)} · run {e.run_index + 1} · sequence{" "}
                {e.sequence}
              </summary>
              <PropertiesTable value={e.properties} />
            </details>
          ))
        ) : (
          <Empty>No effective configuration changes recorded.</Empty>
        )}
      </Card>
      <Card
        title="Buddy recognition epochs"
        note="An epoch reset starts new in-memory identities. Attribution comes from the selected snapshot and may be partial; degraded time comes from camera windows. Buddy IDs do not establish identity across epochs."
      >
        {data.epochs.length ? (
          data.epochs.map((epoch) => (
            <details
              key={epoch.recognition_epoch_id}
              className="border-b border-border py-2"
            >
              <summary className="min-h-11 cursor-pointer break-all py-3 font-mono text-xs">
                {epoch.recognition_epoch_id}
              </summary>
              <PropertiesTable value={epoch} />
            </details>
          ))
        ) : (
          <Empty>No epoch measurements available.</Empty>
        )}
      </Card>
      <Card
        title="Outcomes and diagnostic markers"
        note={`Showing ${data.markers.length} of ${data.marker_count} markers. The event log provides the retained sequence history.`}
      >
        <ul className="max-h-[32rem] divide-y divide-border overflow-y-auto">
          {data.markers.map((e) => (
            <li key={e.event_id} className="py-3 text-xs">
              <p className="font-medium">
                {e.name} ·{" "}
                {String(e.properties.reason || e.properties.status || "")}
              </p>
              <p className="mt-1 text-muted-foreground">
                {date(e.occurred_at)} · run {e.run_index + 1} · sequence{" "}
                {e.sequence}
              </p>
            </li>
          ))}
        </ul>
        {!data.markers.length && <Empty>No diagnostic markers recorded.</Empty>}
      </Card>
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
    <Card
      title="Structured event log"
      note="Ordered by session sequence; occurrence and receipt times are shown separately. Properties contain the validated, sanitized telemetry payload."
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
                {date(e.occurred_at)}
              </span>
            </summary>
            <p className="mb-3 text-xs text-muted-foreground">
              Received {e.received_at ? date(e.received_at) : "Unavailable"} ·
              run {e.run_index + 1}
            </p>
            <PropertiesTable value={e.properties} />
          </details>
        ))
      )}
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
  );
}
