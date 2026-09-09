"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import { ArrowLeft, ArrowRight, Check, Info, Radio } from "lucide-react";
import { createRule, loadRules } from "@/app/admin/actions";
import { useAdmin } from "./provider";
import { RolloutFields } from "./rollout-fields";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { clientNotice, keyError, rolloutError } from "@/lib/experiments";
export function Wizard() {
  const wizard = useAdmin((s) => s.wizard);
  const { patchWizard, resetWizard, created, merge } = useAdmin(
    useShallow((s) => ({
      patchWizard: s.patchWizard,
      resetWizard: s.resetWizard,
      created: s.created,
      merge: s.merge,
    })),
  );
  const [cancel, setCancel] = useState(false);
  const [keyInvalid, setKeyInvalid] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const steps = ["Identify", "Configure", "Review"];
  const changeStep = (step: number) => {
    patchWizard({ step, error: "" });
    requestAnimationFrame(() => document.getElementById("step-title")?.focus());
  };
  async function reconcile() {
    patchWizard({ pending: true, error: "" });
    try {
      const result = await loadRules();
      if (!result.ok) {
        if (result.code === "unauthorized") router.replace("/admin/login");
        patchWizard({ pending: false, error: result.error });
        return;
      }
      merge(result.data.rules);
      const existing = Object.hasOwn(result.data.rules, wizard.key)
        ? result.data.rules[wizard.key]
        : undefined;
      patchWizard({
        pending: false,
        uncertain: false,
        existing: existing || null,
        error: existing
          ? "This key exists on the server. Review its saved configuration below. We cannot confirm which request created it."
          : "No flight was found for this key. You can retry creation.",
      });
    } catch {
      patchWizard({
        pending: false,
        error:
          "Could not check the saved configuration. Check again before retrying.",
      });
    }
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (wizard.pending) return;
    if (keyError(wizard.key)) {
      patchWizard({ step: 0 });
      setKeyInvalid(true);
      requestAnimationFrame(() =>
        document.getElementById("flight-key")?.focus(),
      );
      return;
    }
    if (wizard.step === 0) {
      setKeyInvalid(false);
      changeStep(1);
      return;
    }
    if (rolloutError(wizard.rolloutPercentage)) {
      document.getElementById("new-flight-percentage")?.focus();
      return;
    }
    if (wizard.step === 1) {
      changeStep(2);
      return;
    }
    if (wizard.uncertain || wizard.existing) return;
    patchWizard({ pending: true, error: "" });
    try {
      const result = await createRule({
        key: wizard.key,
        enabled: wizard.enabled,
        rolloutPercentage: wizard.rolloutPercentage,
      });
      if (result.ok) {
        created(result.data.key, result.data);
        router.push("/admin");
      } else {
        if (result.code === "unauthorized") router.replace("/admin/login");
        patchWizard({
          pending: false,
          error: result.error,
          uncertain: !!result.uncertain,
        });
        if (result.code === "experiment_exists") {
          patchWizard({ step: 0 });
          setKeyInvalid(true);
          requestAnimationFrame(() =>
            document.getElementById("flight-key")?.focus(),
          );
        }
      }
    } catch {
      patchWizard({
        pending: false,
        uncertain: true,
        error:
          "The connection ended before creation was confirmed. Check the saved state before retrying.",
      });
    }
  }
  function leave() {
    resetWizard();
    router.push("/admin");
  }
  return (
    <div className="mx-auto max-w-2xl">
      <button
        type="button"
        onClick={() => setCancel(true)}
        disabled={wizard.pending}
        className="mb-6 inline-flex min-h-11 items-center gap-2 rounded-lg text-sm text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <ArrowLeft className="size-4" /> All flights
      </button>
      <p className="eyebrow text-primary">Make space for something new</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
        Create a feature flight
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Define a key, choose your reach, and review before takeoff.
      </p>
      <ol
        aria-label="Creation progress"
        className="my-8 grid grid-cols-3 gap-2"
      >
        {steps.map((step, index) => (
          <li
            key={step}
            aria-current={wizard.step === index ? "step" : undefined}
            className={`flex items-center gap-2 border-b-2 pb-4 text-xs sm:gap-3 sm:text-sm ${index <= wizard.step ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
          >
            <span
              className={`flex size-7 shrink-0 items-center justify-center rounded-full ${index <= wizard.step ? "bg-primary text-white" : "bg-muted"}`}
            >
              {index < wizard.step ? <Check className="size-3" /> : index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <form
        ref={form}
        onSubmit={submit}
        noValidate
        className="rounded-2xl border border-border bg-card p-5 sm:p-8"
      >
        <h2
          id="step-title"
          tabIndex={-1}
          className="text-xl font-semibold tracking-tight outline-none"
        >
          {
            [
              "Give your flight an identity",
              "Start with the right reach",
              "Ready for takeoff?",
            ][wizard.step]
          }
        </h2>
        <p className="mb-7 mt-2 text-sm leading-6 text-muted-foreground">
          {
            [
              "A stable key connects this configuration to your app.",
              "You can adjust these settings after creating the flight.",
              "Nothing is published until you create this flight.",
            ][wizard.step]
          }
        </p>
        {wizard.step === 0 && (
          <div>
            <label
              htmlFor="flight-key"
              className="mb-2 block text-sm font-semibold"
            >
              Experiment key{" "}
              <span className="text-muted-foreground">(required)</span>
            </label>
            <Input
              id="flight-key"
              placeholder="focus_coach"
              value={wizard.key}
              maxLength={80}
              autoComplete="off"
              spellCheck={false}
              disabled={wizard.pending || wizard.uncertain}
              onChange={(e) => {
                patchWizard({ key: e.target.value, error: "", existing: null });
                setKeyInvalid(false);
              }}
              aria-invalid={keyInvalid}
              aria-describedby="key-help key-error"
            />
            <p
              id="key-help"
              className="mt-3 text-xs leading-6 text-muted-foreground"
            >
              Start with a lowercase letter. Use lowercase letters, numbers, and
              underscores, up to 80 characters. This key is permanent and must
              exactly match a registered client key.
            </p>
            <p
              id="key-error"
              role="alert"
              className="mt-2 text-xs text-destructive"
            >
              {keyInvalid ? keyError(wizard.key) : ""}
            </p>
            <div className="mt-6 rounded-xl bg-muted p-4 text-xs leading-6 text-muted-foreground">
              <code className="font-semibold text-foreground">focus_coach</code>
              <p>
                A key identifies the feature; creating it here does not add
                feature code to the app.
              </p>
            </div>
          </div>
        )}
        {wizard.step === 1 && (
          <RolloutFields
            id="new-flight"
            value={wizard}
            onChange={(patch) => patchWizard({ ...patch, error: "" })}
            disabled={wizard.pending || wizard.uncertain}
          />
        )}
        {wizard.step === 2 && (
          <>
            <div className="rounded-xl bg-muted p-5">
              <div className="flex items-center gap-3">
                <Radio className="size-5 shrink-0 text-primary" />
                <code className="break-all text-sm font-semibold">
                  {wizard.key}
                </code>
              </div>
              <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">Status</dt>
                  <dd className="mt-1 font-medium">
                    {wizard.enabled ? "Enabled" : "Disabled"}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Rollout</dt>
                  <dd className="mt-1 font-medium tabular-nums">
                    {wizard.rolloutPercentage}%
                  </dd>
                </div>
              </dl>
              <p className="mt-5 border-t border-border pt-4 text-xs leading-6 text-muted-foreground">
                {wizard.enabled && wizard.rolloutPercentage > 0
                  ? `${wizard.rolloutPercentage}% of eligible installations can receive this feature after refreshing.`
                  : "This flight will not serve any installations yet."}{" "}
                A stable allocation salt is generated automatically.
              </p>
            </div>
            <div className="mt-5 flex gap-3 text-xs leading-6 text-muted-foreground">
              <Info className="mt-1 size-4 shrink-0" />
              <p>{clientNotice}</p>
            </div>
          </>
        )}
        {wizard.error && (
          <p
            role="alert"
            className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-[#855721]"
          >
            {wizard.error}
          </p>
        )}
        {wizard.existing && (
          <div className="mt-4 rounded-xl border border-border p-4 text-sm">
            <h3 className="font-semibold">Saved configuration</h3>
            <p className="mt-2">
              {wizard.existing.enabled ? "Enabled" : "Disabled"} ·{" "}
              {wizard.existing.rolloutPercentage}% rollout
            </p>
            <code className="mt-2 block break-all text-xs text-muted-foreground">
              {wizard.existing.allocationSalt}
            </code>
            <Button
              type="button"
              variant="outline"
              className="mt-4"
              onClick={leave}
            >
              Review on dashboard
            </Button>
          </div>
        )}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6">
          <Button
            type="button"
            variant="ghost"
            disabled={wizard.pending}
            onClick={() =>
              wizard.step === 0 ? setCancel(true) : changeStep(wizard.step - 1)
            }
          >
            {wizard.step === 0 ? "Cancel" : "Back"}
          </Button>
          {wizard.uncertain ? (
            <Button type="button" onClick={reconcile} disabled={wizard.pending}>
              Check saved state
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={wizard.pending || !!wizard.existing}
            >
              {wizard.pending
                ? "Creating…"
                : wizard.step === 2
                  ? "Create flight"
                  : "Continue"}
              <ArrowRight />
            </Button>
          )}
        </div>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Step {wizard.step + 1} of 3 ·{" "}
        {wizard.step === 2
          ? "Review your configuration"
          : "Your changes are still a draft"}
      </p>
      <ConfirmDialog open={cancel} onOpenChange={setCancel} onConfirm={leave} />
    </div>
  );
}
