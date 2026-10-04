"use client";
import { memo, useState } from "react";
import {
  Monitor,
  Clock,
  Play,
  CircleCheck,
  TriangleAlert,
  ArrowUpRight,
  Camera,
  Gauge,
  RotateCcw,
  ScanEye,
  ChartColumn,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  Card as Surface,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { ReactNode } from "react";
import { format, number } from "@/lib/telemetry";
export function Card({
  title,
  note,
  children,
}: {
  title: string;
  note?: ReactNode;
  children: ReactNode;
}) {
  return (
    <Surface asChild className="gap-5">
      <section className="telemetry-card min-w-0">
        <CardHeader className="gap-1 px-0">
          <CardTitle asChild>
            <h3 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
              <ChartColumn
                size={16}
                aria-hidden="true"
                className="text-muted-foreground"
              />
              {title}
            </h3>
          </CardTitle>
          {note && (
            <CardDescription className="text-xs leading-5">
              {note}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="px-0">{children}</CardContent>
      </section>
    </Surface>
  );
}
export function Empty({
  children = "No telemetry matches these filters.",
}: {
  children?: ReactNode;
}) {
  return (
    <p className="rounded-xl bg-muted/60 px-5 py-8 text-center text-sm text-muted-foreground">
      {children}
    </p>
  );
}
export function Metric({
  title,
  value,
  note,
  href,
  unit,
}: {
  title: string;
  value: string;
  note: ReactNode;
  href?: string;
  unit?: string;
}) {
  const durationParts = value.match(
    /^([\d,.-]+) (seconds|minutes|hours|ms|s)$/,
  );
  const displayValue = durationParts?.[1] || value;
  const displayUnit = unit || durationParts?.[2];
  const content = (
    <>
      <p className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <MetricIcon title={title} />
        {title}
        {href && <ArrowUpRight size={14} className="ml-auto" />}
      </p>
      <p className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-2xl font-semibold tracking-tight tabular-nums">
        <span>{displayValue}</span>
        {displayUnit && value !== "Unavailable" && (
          <span className="text-sm font-normal tracking-normal text-muted-foreground">
            {displayUnit}
          </span>
        )}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{note}</p>
    </>
  );
  return href ? (
    <Link href={href} className="telemetry-metric telemetry-metric-link">
      {content}
    </Link>
  ) : (
    <div className="telemetry-metric">{content}</div>
  );
}
function MetricIcon({ title }: { title: string }) {
  const Icon = /installation/.test(title)
    ? Monitor
    : /foreground|time/i.test(title)
      ? Clock
      : /started/.test(title)
        ? Play
        : /Completion/.test(title)
          ? CircleCheck
          : /Failure|drop|missing/.test(title)
            ? TriangleAlert
            : /camera|frames/i.test(title)
              ? Camera
              : /processing/i.test(title)
                ? Gauge
                : /Recovery/.test(title)
                  ? RotateCcw
                  : ScanEye;
  return <Icon size={16} aria-hidden="true" />;
}
export type ChartItem = { label: string; value: number | null; href?: string };
export const Bars = memo(function Bars({
  items,
  unit = "",
  color = "var(--primary)",
  horizontal = false,
}: {
  items: ChartItem[];
  unit?: string;
  color?: string;
  horizontal?: boolean;
}) {
  const [selected, setSelected] = useState<number | null>(null);
  if (!items.length) return <Empty />;
  const measured = items
    .map((x) => number(x.value))
    .filter((x): x is number => x !== null);
  const max = Math.max(1, ...measured);
  const unavailable = items.filter((x) => number(x.value) === null).length;
  const selectedItem = selected === null ? null : items[selected];
  const description = items
    .map((i) => `${i.label}: ${format(i.value, 2)} ${unit}`)
    .join("; ");
  return (
    <>
      <div className="chart-meta">
        <span>Unit: {unit || "count"}</span>
        <span>
          {horizontal
            ? "Select a category to inspect"
            : "Hover or focus to inspect"}
        </span>
      </div>
      {unavailable > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">
          {unavailable}{" "}
          {unavailable === 1 ? "measurement is" : "measurements are"}{" "}
          unavailable. Missing values are not zero.
        </p>
      )}
      <div
        role="region"
        aria-label="Scrollable chart"
        tabIndex={0}
        className="telemetry-chart"
      >
        {horizontal ? (
          <div className="chart-rows">
            <svg
              role="img"
              aria-label={`${unit || "Count"} by category; values available in the data table below`}
              className="sr-only"
            >
              <title>{description}</title>
            </svg>
            {items.map((item, i) => {
              const content = (
                <>
                  <span className="chart-row-label">{item.label}</span>
                  <span className="chart-row-track">
                    <span
                      style={{
                        transform: `scaleX(${Math.max(0, number(item.value) || 0) / max})`,
                        background: color,
                      }}
                    />
                  </span>
                  <span className="chart-row-value">
                    {format(item.value, 2)}
                    {item.href && <ChevronRight size={13} />}
                  </span>
                </>
              );
              return item.href ? (
                <Link
                  key={i}
                  href={item.href}
                  className="chart-row chart-row-link"
                  aria-label={`${item.label}: ${format(item.value, 2)} ${unit}. Inspect sessions.`}
                >
                  {content}
                </Link>
              ) : (
                <div key={i} className="chart-row">
                  {content}
                </div>
              );
            })}
          </div>
        ) : (
          <>
            <div className="chart-inspection" aria-live="polite">
              {selectedItem ? (
                <>
                  <strong>{selectedItem.label}</strong>
                  <span>
                    {format(selectedItem.value, 2)} {unit}
                  </span>
                </>
              ) : (
                <span>Recorded values in {unit || "count"}</span>
              )}
            </div>
            <svg
              role="img"
              aria-label={`${unit || "Count"} by date; values available in the data table below`}
              viewBox="0 0 640 215"
              className="chart-columns"
            >
              <title>{description}</title>
              {[0, 1, 2, 3].map((tick) => (
                <g key={tick}>
                  <line
                    x1="36"
                    x2="638"
                    y1={175 - tick * 50}
                    y2={175 - tick * 50}
                    stroke="var(--border)"
                    strokeDasharray="3 5"
                  />
                  <text
                    x="0"
                    y={179 - tick * 50}
                    fontSize="10"
                    fill="var(--muted-foreground)"
                  >
                    {format((max * tick) / 3, 1)}
                  </text>
                </g>
              ))}
              {items.map((item, i) => {
                const slot = 600 / items.length;
                const height =
                  (Math.max(0, number(item.value) || 0) / max) * 150;
                const content = (
                  <>
                    <rect
                      x={38 + i * slot}
                      y="18"
                      width={Math.max(1, slot - 6)}
                      height="160"
                      fill="transparent"
                    />
                    <rect
                      x={38 + i * slot + slot * 0.18}
                      y={175 - height}
                      width={Math.max(1, slot * 0.6)}
                      height={height || 2}
                      rx="3"
                      fill={color}
                      opacity={selected === null || selected === i ? 1 : 0.35}
                    />
                    {i % Math.max(1, Math.ceil(items.length / 7)) === 0 && (
                      <text
                        x={38 + i * slot + slot * 0.48}
                        y="201"
                        textAnchor="middle"
                        fontSize="11"
                        fill="var(--muted-foreground)"
                      >
                        {item.label.slice(0, 10)}
                      </text>
                    )}
                    <title>{`${item.label}: ${format(item.value, 2)} ${unit}`}</title>
                  </>
                );
                const handlers = {
                  onMouseEnter: () => setSelected(i),
                  onMouseLeave: () => setSelected(null),
                  onFocus: () => setSelected(i),
                  onBlur: () => setSelected(null),
                };
                return item.href ? (
                  <a
                    key={i}
                    href={item.href}
                    {...handlers}
                    aria-label={`${item.label}: ${format(item.value, 2)} ${unit}. Inspect sessions.`}
                  >
                    {content}
                  </a>
                ) : (
                  <g
                    key={i}
                    tabIndex={0}
                    {...handlers}
                    aria-label={`${item.label}: ${format(item.value, 2)} ${unit}`}
                  >
                    {content}
                  </g>
                );
              })}
            </svg>
          </>
        )}
      </div>
      <details className="chart-data">
        <summary>View chart data</summary>
        <div className="mt-2 max-h-64 overflow-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <caption className="sr-only">
              Chart values in {unit || "events"}
            </caption>
            <thead>
              <tr>
                <th className="py-2">Category</th>
                <th className="py-2 text-right">{unit || "Count"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-t border-border">
                  <td className="py-2">
                    {item.href ? (
                      <Link
                        className="inline-flex min-h-10 items-center text-primary underline underline-offset-4"
                        href={item.href}
                      >
                        {item.label}
                      </Link>
                    ) : (
                      item.label
                    )}
                  </td>
                  <td className="text-right">{format(item.value, 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </>
  );
});
export function Funnel({
  items,
  unit = "sessions",
}: {
  items: ChartItem[];
  unit?: string;
}) {
  const denominator = items[0]?.value || 0;
  return (
    <ol className="space-y-2">
      {items.map((item, i) => {
        const content = (
          <>
            <svg
              aria-hidden="true"
              className="absolute inset-0 h-full w-full"
              preserveAspectRatio="none"
              viewBox="0 0 100 100"
            >
              <rect
                width={
                  denominator ? ((item.value || 0) / denominator) * 100 : 0
                }
                height="100"
                fill="var(--muted)"
              />
            </svg>
            <span className="relative text-sm">
              <span className="mr-3 text-xs text-muted-foreground">
                0{i + 1}
              </span>
              {item.label}
            </span>
            <span className="relative whitespace-nowrap text-sm font-semibold tabular-nums">
              {format(item.value)} {item.value !== null && unit}{" "}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {denominator && item.value !== null
                  ? `${format((item.value / denominator) * 100, 1)}%`
                  : "Unavailable"}
              </span>
            </span>
          </>
        );
        const className =
          "telemetry-funnel-row relative flex min-h-14 items-center justify-between gap-3 overflow-hidden rounded-lg px-4 py-3 focus-visible:outline-2 focus-visible:outline-primary";
        return (
          <li key={item.label}>
            {item.href ? (
              <Link href={item.href} className={className}>
                {content}
              </Link>
            ) : (
              <div className={className}>{content}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
