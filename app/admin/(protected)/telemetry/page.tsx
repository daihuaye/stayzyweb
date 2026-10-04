import { Suspense } from "react";
import {
  loadOverview,
  loadHealth,
  loadSessions,
} from "@/app/admin/telemetry-actions";
import {
  TelemetryWorkspace,
  TelemetrySkeleton,
} from "@/components/admin/telemetry/workspace";
import { reportQuery, type Query } from "@/lib/telemetry";
import { reportKey } from "@/lib/telemetry-store";
async function Content({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const query: Query = reportQuery(
    Object.fromEntries(
      Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]),
    ),
  );
  const tab = ["sessions", "health"].includes(query.tab || "")
    ? query.tab
    : "overview";
  const [overview, health, sessions] = await Promise.all([
    loadOverview(query),
    tab === "health" ? loadHealth(query) : null,
    tab === "sessions" ? loadSessions(query) : null,
  ]);
  return (
    <TelemetryWorkspace
      key={reportKey(query, "overview")}
      query={query}
      overview={overview}
      health={health}
      sessions={sessions}
    />
  );
}

export default function TelemetryPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<TelemetrySkeleton />}>
      <Content {...props} />
    </Suspense>
  );
}
