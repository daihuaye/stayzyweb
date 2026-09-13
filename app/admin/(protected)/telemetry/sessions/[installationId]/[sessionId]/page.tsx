import Link from "next/link";
import { Suspense } from "react";
import { loadDetail, loadEvents } from "@/app/admin/telemetry-actions";
import { DetailPanel, EventLog } from "@/components/admin/telemetry/detail";
import { ReportingError } from "@/components/admin/telemetry/dashboard";
import { Refresh } from "@/components/admin/telemetry/controls";
import { date, href, type Query } from "@/lib/telemetry";
type Props = {
  params: Promise<{ installationId: string; sessionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};
async function Content({ params, searchParams }: Props) {
  const { installationId, sessionId } = await params;
  const raw = await searchParams;
  const query: Query = {
    environment:
      typeof raw.environment === "string" ? raw.environment : "production",
    as_of: typeof raw.as_of === "string" ? raw.as_of : new Date().toISOString(),
    cursor: typeof raw.cursor === "string" ? raw.cursor : undefined,
  };
  const [detail, events] = await Promise.all([
    loadDetail(installationId, sessionId, query),
    loadEvents(installationId, sessionId, query),
  ]);
  const path = `/admin/telemetry/sessions/${installationId}/${sessionId}`;
  return (
    <div className="space-y-6">
      <Link
        className="inline-flex min-h-11 items-center text-sm text-primary"
        href={href({
          environment: query.environment,
          as_of: query.as_of,
          tab: "sessions",
        })}
      >
        ← Session explorer
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Session inspection</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">
            From start to outcome
          </h1>
          <p className="mt-2 text-xs text-muted-foreground">
            {detail.ok
              ? `Updated at ${date(detail.data.as_of)} · full retained history`
              : "Session telemetry"}
          </p>
        </div>
        <Refresh query={query} />
      </div>
      {detail.ok ? (
        <DetailPanel data={detail.data} />
      ) : (
        <ReportingError message={detail.error} />
      )}
      {events.ok ? (
        <EventLog data={events.data} query={query} path={path} />
      ) : (
        <ReportingError message={events.error} />
      )}
    </div>
  );
}
export default function SessionPage(props: Props) {
  return (
    <Suspense fallback={<p role="status">Reconstructing session…</p>}>
      <Content {...props} />
    </Suspense>
  );
}
