"use client";
import { memo, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import {
  ArrowUpRight,
  Check,
  Info,
  Plus,
  Radio,
  RefreshCw,
} from "lucide-react";
import { loadRules, saveRule } from "@/app/admin/actions";
import { useAdmin } from "./provider";
import { RolloutFields } from "./rollout-fields";
import { Button } from "@/components/ui/button";
import { clientNotice, rolloutError } from "@/lib/experiments";
import { dirty } from "@/lib/admin-store";
const FlightCard = memo(function FlightCard({
  flightKey,
}: {
  flightKey: string;
}) {
  const entry = useAdmin((s) => s.entries[flightKey]);
  const highlighted = useAdmin((s) => s.highlighted === flightKey);
  const { edit, patchEntry, saved, merge, discard } = useAdmin(
    useShallow((s) => ({
      edit: s.edit,
      patchEntry: s.patchEntry,
      saved: s.saved,
      merge: s.merge,
      discard: s.discard,
    })),
  );
  const router = useRouter();
  if (!entry) return null;
  async function reconcile() {
    patchEntry(flightKey, { pending: true });
    try {
      const result = await loadRules();
      if (!result.ok) {
        if (result.code === "unauthorized") router.replace("/admin/login");
        patchEntry(flightKey, { pending: false, error: result.error });
        return;
      }
      merge(result.data.rules);
      if (!result.data.rules[flightKey]) return;
      patchEntry(flightKey, {
        pending: false,
        uncertain: false,
        error:
          "Saved configuration checked. Review your draft before saving again.",
      });
    } catch {
      patchEntry(flightKey, {
        pending: false,
        error: "Could not check the saved state. Try again before saving.",
      });
    }
  }
  async function save() {
    patchEntry(flightKey, { pending: true, error: "" });
    try {
      const result = await saveRule(flightKey, entry.draft);
      if (result.ok) saved(flightKey, result.data);
      else {
        if (result.code === "unauthorized") router.replace("/admin/login");
        patchEntry(flightKey, {
          pending: false,
          error: result.error,
          uncertain: !!result.uncertain,
        });
      }
    } catch {
      patchEntry(flightKey, {
        pending: false,
        uncertain: true,
        error:
          "The connection ended before we could confirm the save. Check the saved state before retrying.",
      });
    }
  }
  const active = entry.saved.enabled && entry.saved.rolloutPercentage > 0;
  return (
    <article
      className={`rounded-2xl border bg-card p-5 sm:p-7 ${highlighted ? "border-primary ring-1 ring-primary/20" : "border-border"}`}
    >
      <div className="mb-7 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted">
            <Radio className="size-4 text-primary" />
          </span>
          <div className="min-w-0">
            <h2 className="break-all text-lg font-semibold tracking-tight">
              {flightKey}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {highlighted ? "Newly created flight" : "Feature experiment"}
            </p>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1.5 text-[11px] font-medium ${active ? "bg-[#e6f3e8] text-[#347044]" : "bg-muted text-muted-foreground"}`}
        >
          {active ? `Live · ${entry.saved.rolloutPercentage}%` : "Not serving"}
        </span>
      </div>
      <RolloutFields
        id={flightKey}
        value={entry.draft}
        onChange={(patch) => edit(flightKey, patch)}
        disabled={entry.pending || entry.uncertain}
      />
      <div className="mt-6 border-t border-border pt-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Stable allocation salt
        </p>
        <code className="mt-1 block break-all text-[11px] text-muted-foreground">
          {entry.saved.allocationSalt}
        </code>
      </div>
      {entry.error && (
        <p
          role="alert"
          className="mt-4 rounded-lg bg-amber-50 p-3 text-xs leading-5 text-[#855721]"
        >
          {entry.error}
        </p>
      )}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">
          {dirty(entry) ? (
            "Unsaved changes"
          ) : (
            <span className="flex items-center gap-1">
              <Check className="size-3" /> Up to date
            </span>
          )}
        </span>
        <div className="flex gap-2">
          {entry.uncertain ? (
            <Button
              variant="outline"
              onClick={reconcile}
              disabled={entry.pending}
            >
              Check saved state
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => discard(flightKey)}
                disabled={!dirty(entry) || entry.pending}
              >
                Discard
              </Button>
              <Button
                onClick={save}
                disabled={
                  !dirty(entry) ||
                  entry.pending ||
                  !!rolloutError(entry.draft.rolloutPercentage)
                }
              >
                {entry.pending ? "Saving…" : "Save changes"}
              </Button>
            </>
          )}
        </div>
      </div>
    </article>
  );
});
function Summary() {
  const { total, active } = useAdmin(
    useShallow((s) => ({
      total: Object.keys(s.entries).length,
      active: Object.values(s.entries).filter(
        (e) => e.saved.enabled && e.saved.rolloutPercentage > 0,
      ).length,
    })),
  );
  return (
    <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
      {[
        ["Total flights", total],
        ["Serving", active],
        ["Not serving", total - active],
      ].map(([label, count]) => (
        <div
          key={label}
          className="rounded-xl border border-border bg-card px-4 py-5 sm:px-6"
        >
          <p className="text-[11px] text-muted-foreground sm:text-xs">
            {label}
          </p>
          <p className="mt-2 text-3xl tracking-tight tabular-nums">{count}</p>
        </div>
      ))}
    </div>
  );
}
export function Dashboard() {
  const keys = useAdmin(useShallow((s) => Object.keys(s.entries).sort()));
  const notice = useAdmin((s) => s.notice);
  const merge = useAdmin((s) => s.merge);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const refresh = useCallback(async () => {
    try {
      const result = await loadRules();
      setError("");
      if (result.ok) merge(result.data.rules);
      else {
        setError(result.error);
        if (result.code === "unauthorized") router.replace("/admin/login");
      }
    } catch {
      setError("Could not refresh the flights. Your drafts are still here.");
    } finally {
      setLoading(false);
    }
  }, [merge, router]);
  useEffect(() => {
    let active = true;
    loadRules()
      .then((result) => {
        if (!active) return;
        if (result.ok) merge(result.data.rules);
        else {
          setError(result.error);
          if (result.code === "unauthorized") router.replace("/admin/login");
        }
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("Could not load the flights. Please refresh.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [merge, router]);
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow text-primary">Release with intention</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
            Feature flights
          </h1>
          <p className="mt-3 max-w-md text-sm leading-6 text-muted-foreground">
            Small beginnings. Confident launches. Control how new experiences
            reach your community.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/experiments/new">
            <Plus />
            Create flight
          </Link>
        </Button>
      </div>
      <Summary />
      <div className="my-6 flex items-start gap-3 rounded-xl bg-[#e9eee6] p-4 text-xs leading-6 text-[#526554]">
        <Info className="mt-1 size-4 shrink-0" />
        <p>{clientNotice}</p>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Your experiments</h2>
        <Button
          variant="ghost"
          onClick={() => {
            setLoading(true);
            void refresh();
          }}
          disabled={loading}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {notice && (
        <p
          role="status"
          className="mb-4 rounded-xl border border-primary/20 bg-[#e7f3eb] p-4 text-sm text-primary"
        >
          {notice}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-4 rounded-xl bg-red-50 p-4 text-sm text-destructive"
        >
          {error}
        </p>
      )}
      {loading && !keys.length ? (
        <div
          role="status"
          className="rounded-2xl border border-border bg-card p-12 text-center text-sm text-muted-foreground"
        >
          Loading flight configuration…
        </div>
      ) : keys.length ? (
        <div className="grid gap-5 xl:grid-cols-2">
          {keys.map((key) => (
            <FlightCard key={key} flightKey={key} />
          ))}
        </div>
      ) : (
        !error && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Radio className="mx-auto size-7 text-primary" />
            <h2 className="mt-4 text-xl font-medium">
              A little room to experiment.
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Create your first flight to start a thoughtful rollout.
            </p>
            <Button asChild className="mt-6">
              <Link href="/admin/experiments/new">
                Create your first flight
                <ArrowUpRight />
              </Link>
            </Button>
          </div>
        )
      )}
    </>
  );
}
