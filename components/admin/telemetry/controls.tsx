"use client";
import { useRouter, usePathname } from "next/navigation";
import { useTransition } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { href, type Query } from "@/lib/telemetry";
export const field =
  "min-h-11 w-full rounded-xl border border-border bg-card px-3 text-sm focus:outline-2 focus:outline-primary";
export function Refresh({ query }: { query: Query }) {
  const router = useRouter(),
    path = usePathname();
  const [pending, transition] = useTransition();
  return (
    <Button
      variant="outline"
      disabled={pending}
      onClick={() =>
        transition(() => {
          const next: Query = {
            ...query,
            as_of: new Date().toISOString(),
            cursor: undefined,
          };
          if (query.range !== "custom") {
            next.start = undefined;
            next.end = undefined;
          }
          router.replace(href(next, {}, path));
        })
      }
    >
      <RefreshCw className={pending ? "animate-spin" : ""} />
      {pending ? "Refreshing…" : "Refresh"}
    </Button>
  );
}
export function Filters({
  query,
  versions,
}: {
  query: Query;
  versions: string[];
}) {
  const router = useRouter();
  const [pending, transition] = useTransition();
  return (
    <form
      className="grid items-end gap-3 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 xl:grid-cols-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const next: Query = {
          tab: query.tab,
          range: String(form.get("range")),
          environment: String(form.get("environment")),
          app_version: String(form.get("app_version")),
        };
        if (next.range === "custom") {
          const start = String(form.get("start")),
            end = String(form.get("end"));
          if (!start || !end) return;
          next.start = `${start}T00:00:00.000Z`;
          next.end = new Date(
            new Date(`${end}T00:00:00.000Z`).getTime() + 86400000,
          ).toISOString();
        }
        transition(() => router.push(href(next)));
      }}
    >
      <label className="space-y-1 text-xs text-muted-foreground">
        Date range · UTC
        <select
          name="range"
          className={field}
          defaultValue={query.range || "7"}
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
          <option value="custom">Custom (up to 90 days)</option>
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">
        Environment
        <select
          name="environment"
          className={field}
          defaultValue={query.environment}
        >
          <option>production</option>
          <option>debug</option>
          <option>test</option>
        </select>
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">
        App version
        <select
          name="app_version"
          className={field}
          defaultValue={query.app_version || ""}
        >
          <option value="">All versions</option>
          {Array.from(
            new Set([
              ...versions,
              ...(query.app_version ? [query.app_version] : []),
            ]),
          ).map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </label>
      <Button disabled={pending} type="submit">
        {pending ? "Applying…" : "Apply filters"}
      </Button>
      <details
        className="sm:col-span-2 xl:col-span-4"
        open={query.range === "custom"}
      >
        <summary className="cursor-pointer py-2 text-xs text-muted-foreground">
          Custom dates (inclusive)
        </summary>
        <div className="flex flex-wrap gap-3">
          <label className="text-xs">
            From
            <input
              name="start"
              type="date"
              className={field}
              defaultValue={query.start?.slice(0, 10)}
            />
          </label>
          <label className="text-xs">
            Through
            <input
              name="end"
              type="date"
              className={field}
              defaultValue={
                query.end && Number.isFinite(new Date(query.end).getTime())
                  ? new Date(new Date(query.end).getTime() - 1)
                      .toISOString()
                      .slice(0, 10)
                  : ""
              }
            />
          </label>
        </div>
      </details>
    </form>
  );
}
export function SessionFilters({ query }: { query: Query }) {
  const router = useRouter();
  return (
    <form
      className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        const next: Query = {
          ...query,
          cursor: undefined,
          stage: undefined,
          reason: undefined,
          wait_state: undefined,
        };
        for (const [k, v] of form) next[k] = String(v) || undefined;
        router.push(href(next));
      }}
    >
      <label className="text-xs">
        Session UUID
        <input
          name="session_id"
          className={field}
          defaultValue={query.session_id}
          placeholder="Exact session UUID"
        />
      </label>
      <label className="text-xs">
        Outcome
        <select
          className={field}
          name="status"
          defaultValue={query.status || ""}
        >
          <option value="">All outcomes</option>
          {["inProgress", "completed", "endedEarly", "cancelled", "failed"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </label>
      <label className="text-xs">
        Last recorded state
        <input
          name="state"
          className={field}
          defaultValue={query.state}
          placeholder="e.g. acquiring"
        />
      </label>
      <label className="text-xs">
        Time by buddy
        <select className={field} name="buddy" defaultValue={query.buddy || ""}>
          <option value="">All configurations</option>
          <option value="true">Enabled</option>
          <option value="false">Disabled</option>
        </select>
      </label>
      <label className="text-xs">
        Diagnostics
        <select
          className={field}
          name="errors"
          defaultValue={query.errors || ""}
        >
          <option value="">All sessions</option>
          <option value="true">With errors</option>
          <option value="false">Without recorded errors</option>
        </select>
      </label>
      <label className="text-xs">
        Activity
        <select
          className={field}
          name="possible_drop_off"
          defaultValue={query.possible_drop_off || ""}
        >
          <option value="">All activity</option>
          <option value="true">Possible drop-off · 24 hours</option>
          <option value="false">Other sessions</option>
        </select>
      </label>
      <Button type="submit">Find sessions</Button>
    </form>
  );
}
