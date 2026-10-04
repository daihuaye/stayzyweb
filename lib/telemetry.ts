export type Query = Record<string, string | undefined>;
export type Numbers = Record<string, number | null>;
export type Properties = Record<string, unknown>;
export type Meta = {
  as_of: string;
  start: string;
  end: string;
  environment: string;
};
export type Datum = {
  label: string | null;
  value: number | null;
  mean_progress?: number | null;
};
export type Snapshot = {
  snapshot_id: string;
  revision: number;
  expected_parts: number;
  received_parts: number;
  complete: boolean;
  outcome_sequence: number | null;
  intervals?: Interval[];
};
export type Session = {
  installation_id: string;
  session_id: string;
  created_at: string;
  last_activity: string;
  last_received: string;
  app_version: string;
  status: string;
  state: string | null;
  configuration: Properties | null;
  configuration_available: boolean;
  start_metadata?: Properties;
  buddy_tracking: boolean | null;
  possible_drop_off: boolean;
  error_count: number;
  run_count: number;
  totals: Properties;
  timeline?: Snapshot | null;
};
export type Overview = Meta & {
  summary: Numbers;
  daily: ({ day: string } & Numbers)[];
  screens: Datum[];
  outcomes: Datum[];
  waits: Datum[];
  attempts: Numbers;
  funnel: Datum[];
  permission_denials: number;
  setup_views: number;
  quality: Numbers;
  app_versions: string[];
};
export type Health = Meta & {
  summary: Numbers;
  daily: ({ day: string } & Numbers)[];
  versions: ({ app_version: string } & Numbers)[];
  errors: { name: string; reason: string | null; count: number }[];
  diagnostics: {
    installation_id: string;
    session_id: string | null;
    occurred_at: string;
    name: string;
    reason: string | null;
  }[];
};
export type SessionPage = Meta & {
  items: Session[];
  next_cursor: string | null;
};
export type EventRecord = {
  event_id: string;
  name: string;
  sequence: number;
  occurred_at: string;
  run_index: number;
  properties: Properties;
  received_at?: string;
};
export type EventPage = Meta & {
  items: EventRecord[];
  next_cursor: string | null;
};
export type Interval = {
  id: string;
  kind: string;
  started_at: number;
  ended_at?: number;
  duration: number;
  participant_id?: string;
  recognition_epoch_id?: string;
  is_break?: boolean;
  lane?: string;
};
export type Detail = Meta & {
  session: Session;
  configuration_changes: EventRecord[];
  outcomes: EventRecord[];
  epochs: ({ recognition_epoch_id: string } & Record<
    string,
    number | string | null
  >)[];
  state_intervals: Interval[];
  checkpoints: {
    at: number;
    progress: number | null;
    present_seconds: number | null;
    sequence: number;
  }[];
  checkpoint_count: number;
  markers: EventRecord[];
  marker_count: number;
  snapshots: Snapshot[];
  selected_snapshot: Snapshot | null;
};
export function number(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
export function format(value: unknown, digits = 0) {
  const n = number(value);
  return n === null
    ? "Unavailable"
    : n.toLocaleString("en-US", { maximumFractionDigits: digits });
}
export function duration(value: unknown) {
  const n = number(value);
  if (n === null) return "Unavailable";
  if (Math.abs(n) < 60) return `${format(n, 1)} seconds`;
  if (Math.abs(n) < 3600) return `${format(n / 60, 1)} minutes`;
  return `${format(n / 3600, 2)} hours`;
}
export function rate(numerator: unknown, denominator: unknown) {
  const n = number(numerator),
    d = number(denominator);
  return n === null || d === null || d <= 0 ? "Unavailable" : percent(n / d);
}
export function percent(value: unknown) {
  const n = number(value);
  return n === null ? "Unavailable" : `${format(n * 100, 1)}%`;
}
export function label(value: string | null) {
  return (
    (
      {
        inProgress: "In progress / incomplete",
        endedEarly: "End for Now",
        possible_drop_off: "Possible drop-off",
        started: "Session created",
        authorized: "Permission authorized",
        first_frame: "First frame",
        focused: "Focused",
        completed: "Completed",
      } as Record<string, string>
    )[value || ""] || (value || "Unavailable").replaceAll("_", " ")
  );
}
export function date(value: string | number, timeZone = "UTC") {
  const d = new Date(typeof value === "number" ? value * 1000 : value);
  if (Number.isNaN(d.getTime())) return "Unavailable";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
    timeZoneName: "short",
  }).formatToParts(d);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")} ${part("hour")}:${part("minute")}:${part("second")} ${part("timeZoneName")}`;
}
export function href(
  query: Query,
  changes: Query = {},
  path = "/admin/telemetry",
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries({ ...query, ...changes }))
    if (value) params.set(key, value);
  return `${path}?${params}`;
}
export function sessionHref(
  row: { installation_id: string; session_id: string },
  query: Query,
) {
  return href(
    { environment: query.environment, as_of: query.as_of },
    {},
    `/admin/telemetry/sessions/${row.installation_id}/${row.session_id}`,
  );
}
const allowed = new Set([
  "start",
  "end",
  "as_of",
  "environment",
  "app_version",
  "limit",
  "cursor",
  "session_id",
  "status",
  "state",
  "buddy",
  "errors",
  "possible_drop_off",
  "stage",
  "reason",
  "wait_state",
  "activity",
]);
export function apiQuery(query: Query) {
  return new URLSearchParams(
    Object.entries(query).filter(
      ([k, v]) => allowed.has(k) && v !== undefined,
    ) as [string, string][],
  ).toString();
}
export function reportQuery(query: Query) {
  const output = { ...query };
  output.range ||= output.start || output.end ? "custom" : "7";
  output.as_of ||= new Date().toISOString();
  output.environment ||= "production";
  if (!output.start && !output.end) {
    const end = new Date(output.as_of);
    const days = [7, 30, 90].includes(Number(output.range))
      ? Number(output.range)
      : 7;
    if (!Number.isNaN(end.getTime())) {
      output.end = end.toISOString();
      output.start = new Date(end.getTime() - days * 86400000).toISOString();
    }
  }
  return output;
}
// Boundary validation keeps unavailable or incompatible backend responses out of chart rendering.
function object(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}
function objects(v: unknown) {
  return Array.isArray(v) && v.every(object);
}
export function validReport(kind: string, v: unknown): boolean {
  if (
    !object(v) ||
    !["as_of", "start", "end", "environment"].every(
      (k) => typeof v[k] === "string",
    )
  )
    return false;
  switch (kind) {
    case "overview":
      return (
        object(v.summary) &&
        object(v.quality) &&
        object(v.attempts) &&
        ["daily", "screens", "outcomes", "waits", "funnel"].every((k) =>
          objects(v[k]),
        ) &&
        Array.isArray(v.app_versions) &&
        v.app_versions.every((x) => typeof x === "string")
      );
    case "health":
      return (
        object(v.summary) &&
        ["daily", "versions", "errors", "diagnostics"].every((k) =>
          objects(v[k]),
        )
      );
    case "sessions":
      return (
        objects(v.items) &&
        (v.items as unknown[]).every(validSession) &&
        (v.next_cursor === null || typeof v.next_cursor === "string")
      );
    case "events":
      return (
        objects(v.items) &&
        (v.items as Record<string, unknown>[]).every(
          (x) => typeof x.name === "string" && object(x.properties),
        ) &&
        (v.next_cursor === null || typeof v.next_cursor === "string")
      );
    case "detail":
      return (
        validSession(v.session) &&
        [
          "configuration_changes",
          "outcomes",
          "epochs",
          "state_intervals",
          "checkpoints",
          "markers",
          "snapshots",
        ].every((k) => objects(v[k])) &&
        (v.selected_snapshot === null || object(v.selected_snapshot))
      );
    default:
      return false;
  }
}
function validSession(v: unknown): boolean {
  return (
    object(v) &&
    ["installation_id", "session_id", "status", "last_activity"].every(
      (k) => typeof v[k] === "string",
    ) &&
    object(v.totals)
  );
}
