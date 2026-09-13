import Link from "next/link";
import { Suspense } from "react";
import { Activity, ArrowUpRight } from "lucide-react";
import {
  loadOverview,
  loadHealth,
  loadSessions,
} from "@/app/admin/telemetry-actions";
import { Filters, Refresh } from "@/components/admin/telemetry/controls";
import {
  OverviewPanel,
  HealthPanel,
  SessionsPanel,
  ReportingError,
} from "@/components/admin/telemetry/dashboard";
import { date, href, reportQuery, type Query } from "@/lib/telemetry";
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
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Usage & diagnostics</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            Telemetry
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Follow the path from starting a session to finding focus. Understand
            progress, interruptions, and camera health.
          </p>
        </div>
        <Refresh query={query} />
      </div>
      <Filters
        key={`${query.start}/${query.environment}/${query.app_version}/${query.range}`}
        query={query}
        versions={overview.ok ? overview.data.app_versions : []}
      />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav
          aria-label="Telemetry views"
          className="flex max-w-full gap-1 overflow-x-auto rounded-xl bg-muted p-1"
        >
          {[
            ["overview", "Overview"],
            ["sessions", "Sessions"],
            ["health", "Detection Health"],
          ].map(([key, title]) => (
            <Link
              key={key}
              href={href(query, { tab: key, cursor: undefined })}
              aria-current={tab === key ? "page" : undefined}
              className={`inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm ${tab === key ? "bg-card font-medium text-primary shadow-sm" : "text-muted-foreground hover:bg-card/60"}`}
            >
              {key === "overview" && <Activity className="size-4" />}
              {title}
            </Link>
          ))}
        </nav>
        <p className="text-[11px] text-muted-foreground">
          {overview.ok
            ? `Updated at ${date(overview.data.as_of)}`
            : "No report loaded"}
        </p>
      </div>
      {tab === "overview" ? (
        overview.ok ? (
          <OverviewPanel data={overview.data} query={query} />
        ) : (
          <ReportingError message={overview.error} />
        )
      ) : tab === "health" ? (
        health?.ok ? (
          <HealthPanel data={health.data} query={query} />
        ) : (
          <ReportingError
            message={
              health && !health.ok
                ? health.error
                : "Health reporting is unavailable."
            }
          />
        )
      ) : sessions?.ok ? (
        <SessionsPanel data={sessions.data} query={query} />
      ) : (
        <ReportingError
          message={
            sessions && !sessions.ok
              ? sessions.error
              : "Session reporting is unavailable."
          }
        />
      )}
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
        <ArrowUpRight className="mt-1 size-3 shrink-0" />
        Anonymous operational telemetry · UTC · manually refreshed · 90-day
        retention. Camera health does not establish recognition accuracy.
      </p>
    </div>
  );
}
export default function TelemetryPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense
      fallback={
        <p role="status" className="py-12 text-muted-foreground">
          Loading telemetry…
        </p>
      }
    >
      <Content {...props} />
    </Suspense>
  );
}
