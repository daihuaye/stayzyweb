"use client";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { rolloutError, type RuleInput } from "@/lib/experiments";
export function RolloutFields({
  id,
  value,
  onChange,
  disabled = false,
}: {
  id: string;
  value: RuleInput;
  onChange: (value: Partial<RuleInput>) => void;
  disabled?: boolean;
}) {
  const error = rolloutError(value.rolloutPercentage);
  return (
    <fieldset disabled={disabled} className="min-w-0 space-y-6">
      <legend className="sr-only">Rollout configuration</legend>
      <div className="flex items-center justify-between gap-4">
        <div>
          <label htmlFor={`${id}-enabled`} className="text-sm font-semibold">
            Enable flight
          </label>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Disabled flights reach no installations.
          </p>
        </div>
        <Switch
          id={`${id}-enabled`}
          checked={value.enabled}
          onCheckedChange={(enabled) => onChange({ enabled })}
          disabled={disabled}
        />
      </div>
      <div>
        <div className="flex items-center justify-between gap-4">
          <label htmlFor={`${id}-percentage`} className="text-sm font-semibold">
            Rollout percentage
          </label>
          <div className="flex items-center gap-2">
            <Input
              id={`${id}-percentage`}
              type="number"
              min={0}
              max={100}
              step={1}
              value={
                Number.isNaN(value.rolloutPercentage)
                  ? ""
                  : value.rolloutPercentage
              }
              onChange={(e) =>
                onChange({
                  rolloutPercentage:
                    e.target.value === "" ? NaN : Number(e.target.value),
                })
              }
              className="w-20 text-right tabular-nums"
              aria-invalid={!!error}
              aria-describedby={error ? `${id}-error` : undefined}
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        </div>
        <Slider
          aria-label="Rollout percentage"
          value={[error ? 0 : value.rolloutPercentage]}
          min={0}
          max={100}
          step={1}
          onValueChange={([rolloutPercentage]) =>
            onChange({ rolloutPercentage })
          }
          disabled={disabled}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>0% · No installations</span>
          <span>100% · All eligible installations</span>
        </div>
        {error && (
          <p
            id={`${id}-error`}
            className="mt-3 text-xs text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </fieldset>
  );
}
