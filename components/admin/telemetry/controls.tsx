"use client";
import { useRouter, usePathname } from "next/navigation";
import { useTransition, useState } from "react";
import {
  RefreshCw,
  CalendarDays,
  Server,
  Layers,
  SlidersHorizontal,
  Search,
  ScanLine,
  CircleCheck,
  Camera,
  Users,
  Bug,
  Activity,
  Globe,
  Code,
  FlaskConical,
  CalendarRange,
  CircleDashed,
  Square,
  CircleX,
  AlertTriangle,
  ToggleLeft,
  ToggleRight,
  Clock,
} from "lucide-react";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
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
  const [range, setRange] = useState(query.range || "7");
  return (
    <form
      className="telemetry-filters grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-4"
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
        transition(() => router.push(href(next), { scroll: false }));
      }}
    >
      <div className="space-y-1 text-xs text-muted-foreground">
        <span className="filter-label">
          <CalendarDays size={14} />
          Date range · UTC
        </span>
        <Select
          name="range"
          label="Date range · UTC"
          value={range}
          onValueChange={setRange}
          disabled={pending}
          options={[
            {
              value: "7",
              label: "Last 7 days",
              icon: CalendarDays,
              description: "Recent session activity",
            },
            {
              value: "30",
              label: "Last 30 days",
              icon: CalendarDays,
              description: "A broader view of app usage",
            },
            {
              value: "90",
              label: "Last 90 days",
              icon: CalendarDays,
              description: "Full retained reporting window",
            },
            {
              value: "custom",
              label: "Custom dates",
              icon: CalendarRange,
              description: "Choose up to 90 days, inclusive",
            },
          ]}
        />
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <span className="filter-label">
          <Server size={14} />
          Environment
        </span>
        <Select
          name="environment"
          label="Environment"
          defaultValue={query.environment || "production"}
          disabled={pending}
          options={[
            {
              value: "production",
              label: "production",
              icon: Globe,
              description: "Production app telemetry",
            },
            {
              value: "debug",
              label: "debug",
              icon: Code,
              description: "Debug builds and development",
            },
            {
              value: "test",
              label: "test",
              icon: FlaskConical,
              description: "Test environment telemetry",
            },
          ]}
        />
      </div>
      <div className="space-y-1 text-xs text-muted-foreground">
        <span className="filter-label">
          <Layers size={14} />
          App version
        </span>
        <Select
          name="app_version"
          label="App version"
          defaultValue={query.app_version || ""}
          disabled={pending}
          options={[
            { value: "", label: "All versions", icon: Layers },
            ...Array.from(
              new Set([
                ...versions,
                ...(query.app_version ? [query.app_version] : []),
              ]),
            )
              .filter(Boolean)
              .map((version) => ({
                value: version,
                label: version,
                icon: Layers,
              })),
          ]}
        />
      </div>
      <Button disabled={pending} type="submit">
        <SlidersHorizontal />
        {pending ? "Applying…" : "Apply filters"}
      </Button>
      <details
        className="telemetry-custom-dates sm:col-span-2 xl:col-span-4"
        open={range === "custom"}
      >
        <summary className="cursor-pointer py-2 text-xs text-muted-foreground">
          Custom dates (inclusive)
        </summary>
        <div className="flex flex-wrap gap-3">
          <label className="text-xs">
            From
            <Input
              name="start"
              type="date"
              required={range === "custom"}
              className={field}
              defaultValue={query.start?.slice(0, 10)}
            />
          </label>
          <label className="text-xs">
            Through
            <Input
              name="end"
              type="date"
              required={range === "custom"}
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
        <span className="filter-label">
          <ScanLine size={14} />
          Session UUID
        </span>
        <Input
          name="session_id"
          className={field}
          defaultValue={query.session_id}
          placeholder="Exact session UUID"
        />
      </label>
      <div className="text-xs">
        <span className="filter-label">
          <CircleCheck size={14} />
          Outcome
        </span>
        <Select
          name="status"
          label="Outcome"
          defaultValue={query.status || ""}
          options={[
            { value: "", label: "All outcomes", icon: Layers },
            {
              value: "inProgress",
              label: "In progress / incomplete",
              icon: CircleDashed,
            },
            { value: "completed", label: "Completed", icon: CircleCheck },
            { value: "endedEarly", label: "End for Now", icon: Square },
            { value: "cancelled", label: "Cancelled", icon: CircleX },
            { value: "failed", label: "Failed", icon: AlertTriangle },
          ]}
        />
      </div>
      <label className="text-xs">
        <span className="filter-label">
          <Camera size={14} />
          Last recorded state
        </span>
        <Input
          name="state"
          className={field}
          defaultValue={query.state}
          placeholder="e.g. acquiring"
        />
      </label>
      <div className="text-xs">
        <span className="filter-label">
          <Users size={14} />
          Time by buddy
        </span>
        <Select
          name="buddy"
          label="Time by buddy"
          defaultValue={query.buddy || ""}
          options={[
            { value: "", label: "All configurations", icon: Users },
            { value: "true", label: "Enabled", icon: ToggleRight },
            { value: "false", label: "Disabled", icon: ToggleLeft },
          ]}
        />
      </div>
      <div className="text-xs">
        <span className="filter-label">
          <Bug size={14} />
          Diagnostics
        </span>
        <Select
          name="errors"
          label="Diagnostics"
          defaultValue={query.errors || ""}
          options={[
            { value: "", label: "All sessions", icon: Layers },
            { value: "true", label: "With errors", icon: Bug },
            {
              value: "false",
              label: "Without recorded errors",
              icon: CircleCheck,
            },
          ]}
        />
      </div>
      <div className="text-xs">
        <span className="filter-label">
          <Activity size={14} />
          Activity
        </span>
        <Select
          name="possible_drop_off"
          label="Activity"
          defaultValue={query.possible_drop_off || ""}
          options={[
            { value: "", label: "All activity", icon: Activity },
            {
              value: "true",
              label: "Possible drop-off · 24 hours",
              icon: Clock,
            },
            { value: "false", label: "Other sessions", icon: Layers },
          ]}
        />
      </div>
      <Button type="submit">
        <Search />
        Find sessions
      </Button>
    </form>
  );
}
