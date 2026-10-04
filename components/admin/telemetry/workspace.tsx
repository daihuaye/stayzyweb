"use client";

import { useEffect, useMemo, useState, memo } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useStore } from "zustand";
import {
  Activity,
  Camera,
  ListFilter,
  ShieldCheck,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import {
  loadOverview,
  loadHealth,
  loadSessions,
} from "@/app/admin/telemetry-actions";
import {
  createTelemetryStore,
  reportKey,
  type TelemetryTab,
  type Report,
} from "@/lib/telemetry-store";
import {
  href,
  type Query,
  type Overview,
  type Health,
  type SessionPage,
} from "@/lib/telemetry";
import type { Result } from "@/lib/experiments";
import {
  OverviewPanel,
  HealthPanel,
  SessionsPanel,
  ReportingError,
} from "./dashboard";
import { Filters, Refresh } from "./controls";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { LocalTime } from "./local-time";

const OverviewView = memo(OverviewPanel);
const HealthView = memo(HealthPanel);
const SessionsView = memo(SessionsPanel);
const tabs = [
  { key: "overview", title: "Overview", icon: Activity },
  { key: "sessions", title: "Sessions", icon: ListFilter },
  { key: "health", title: "Detection Health", icon: Camera },
] as const;

export function TelemetrySkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading telemetry"
      className="telemetry-skeleton"
    >
      <span className="sr-only">Loading telemetry…</span>
      <Skeleton className="h-20" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    </div>
  );
}

export function TelemetryWorkspace({
  query: initialQuery,
  overview,
  health,
  sessions,
}: {
  query: Query;
  overview: Result<Overview>;
  health: Result<Health> | null;
  sessions: Result<SessionPage> | null;
}) {
  const params = useSearchParams();
  const rawTab = params.get("tab") || initialQuery.tab;
  const tab: TelemetryTab =
    rawTab === "sessions" || rawTab === "health" ? rawTab : "overview";
  const cursor = params.get("cursor") || undefined;
  const query = useMemo<Query>(
    () => ({ ...initialQuery, tab, cursor }),
    [initialQuery, tab, cursor],
  );
  const [store] = useState(() => {
    const reports: Record<string, Result<Report>> = {
      [reportKey(initialQuery, "overview")]: overview,
    };
    if (health) reports[reportKey(initialQuery, "health")] = health;
    if (sessions) reports[reportKey(initialQuery, "sessions")] = sessions;
    return createTelemetryStore(reports);
  });
  const key = reportKey(query, tab);
  const report = useStore(store, (state) => state.reports[key]);
  const pending = useStore(store, (state) => state.pending[key]);
  const overviewKey = reportKey(query, "overview");
  const latestOverview = useStore(
    store,
    (state) => state.reports[overviewKey],
  ) as Result<Overview> | undefined;
  const filterOverview = latestOverview || overview;
  const load = useStore(store, (state) => state.load);
  useEffect(() => {
    if (report) return;
    void load(key, () =>
      tab === "overview"
        ? loadOverview(query)
        : tab === "health"
          ? loadHealth(query)
          : loadSessions(query),
    );
  }, [key, load, query, report, tab]);

  return (
    <div className="telemetry-page">
      <header className="telemetry-heading">
        <div>
          <h1>Telemetry</h1>
          <p>Understand every session. Find what gets in the way of focus.</p>
        </div>
        <div className="telemetry-heading-actions">
          <Badge variant="subtle" className="telemetry-environment">
            <ShieldCheck size={14} />
            {query.environment}
          </Badge>
          <Refresh query={query} />
        </div>
      </header>
      <Filters
        query={query}
        versions={filterOverview.ok ? filterOverview.data.app_versions : []}
      />
      <div className="telemetry-viewbar">
        <nav aria-label="Telemetry views" className="telemetry-tabs">
          {tabs.map(({ key: view, title, icon: Icon }) => (
            <Link
              key={view}
              href={href(query, { tab: view, cursor: undefined })}
              aria-current={tab === view ? "page" : undefined}
              onNavigate={(event) => {
                event.preventDefault();
                if (view !== tab)
                  window.history.pushState(
                    null,
                    "",
                    href(query, { tab: view, cursor: undefined }),
                  );
              }}
            >
              <Icon size={17} />
              {title}
            </Link>
          ))}
        </nav>
        <p className="telemetry-updated">
          {filterOverview.ok ? (
            <>
              Updated at <LocalTime value={filterOverview.data.as_of} />
            </>
          ) : (
            "No report loaded"
          )}
        </p>
      </div>
      <div key={tab} className="telemetry-view" aria-busy={!!pending}>
        {!report || pending ? (
          <TelemetrySkeleton />
        ) : !report.ok ? (
          <div className="space-y-3">
            <ReportingError message={report.error} />
            <button
              className="telemetry-retry"
              onClick={() =>
                void load(key, () =>
                  tab === "overview"
                    ? loadOverview(query)
                    : tab === "health"
                      ? loadHealth(query)
                      : loadSessions(query),
                )
              }
            >
              <RotateCcw size={16} />
              Retry report
            </button>
          </div>
        ) : tab === "overview" ? (
          <OverviewView data={report.data as Overview} query={query} />
        ) : tab === "health" ? (
          <HealthView data={report.data as Health} query={query} />
        ) : (
          <SessionsView data={report.data as SessionPage} query={query} />
        )}
      </div>
      <p className="telemetry-footer">
        <ArrowUpRight size={14} />
        Anonymous operational telemetry. Local time, manual refresh, 90-day
        retention. Camera health does not establish recognition accuracy.
      </p>
    </div>
  );
}
