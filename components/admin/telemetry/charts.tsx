import Link from "next/link";
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
    <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="text-base font-semibold tracking-tight">{title}</h3>
      {note && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">{note}</p>
      )}
      <div className="mt-5">{children}</div>
    </section>
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
      <p className="text-xs text-muted-foreground">{title}</p>
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
    <Link
      href={href}
      className="rounded-xl border border-border bg-card p-4 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98]"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-xl border border-border bg-card p-4">{content}</div>
  );
}
export type ChartItem = { label: string; value: number | null; href?: string };
export function Bars({
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
  if (!items.length) return <Empty />;
  const measured = items
    .map((x) => number(x.value))
    .filter((x): x is number => x !== null);
  const peak = measured.length ? Math.max(...measured) : null;
  const max = Math.max(1, ...items.map((x) => number(x.value) || 0));
  const highest = items.find(
    (item) => number(item.value) !== null && item.value === peak,
  );
  const unavailable = items.filter(
    (item) => number(item.value) === null,
  ).length;
  const width = 640,
    height = horizontal ? Math.max(100, items.length * 40) : 220;
  return (
    <>
      <div className="mb-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
        <span>Unit: {unit || "count"}</span>
        <span>
          Highest:{" "}
          {highest?.label
            ? `${highest.label} (${format(peak, 2)} ${unit})`
            : "Unavailable"}
        </span>
      </div>
      {unavailable > 0 && (
        <p className="mb-3 text-xs text-muted-foreground">
          {unavailable} categories have no measurement. See the data table for
          details.
        </p>
      )}
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
        className="max-h-80 overflow-auto focus-visible:outline-2 focus-visible:outline-primary"
      >
        <svg
          role="img"
          aria-label={`${unit || "Count"} by ${horizontal ? "category" : "date"}; values available in the data table below`}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[520px] overflow-visible"
        >
          <title>
            {items
              .map((i) => `${i.label}: ${format(i.value, 2)} ${unit}`)
              .join("; ")}
          </title>
          {items.map((item, i) => {
            const v = Math.max(0, number(item.value) || 0),
              slot = width / items.length;
            const x = horizontal ? 165 : i * slot + 4,
              y = horizontal ? i * 40 + 6 : 180 - (v / max) * 155;
            const content = (
              <>
                <rect
                  x={x}
                  y={horizontal ? y : 20}
                  width={horizontal ? 350 : Math.max(1, slot - 8)}
                  height={horizontal ? 22 : 160}
                  rx="3"
                  fill="var(--muted)"
                />
                <rect
                  x={x}
                  y={y}
                  width={horizontal ? (v / max) * 350 : Math.max(1, slot - 8)}
                  height={horizontal ? 22 : (v / max) * 155}
                  rx="3"
                  fill={color}
                />
                {horizontal ? (
                  <>
                    <text x="0" y={y + 16} fontSize="12" fill="currentColor">
                      {item.label.slice(0, 23)}
                    </text>
                    <text x="535" y={y + 16} fontSize="12" fill="currentColor">
                      {format(item.value, 1)}
                    </text>
                  </>
                ) : (
                  i % Math.max(1, Math.ceil(items.length / 6)) === 0 && (
                    <text
                      x={x}
                      y="204"
                      fontSize="11"
                      fill="var(--muted-foreground)"
                    >
                      {item.label.slice(0, 10)}
                    </text>
                  )
                )}
                <title>{`${item.label}: ${format(item.value, 2)} ${unit}`}</title>
              </>
            );
            return item.href ? (
              <a
                key={`${item.label}-${i}`}
                href={item.href}
                aria-label={`${item.label}: ${format(item.value, 2)} ${unit}. Inspect sessions.`}
                className="focus:outline-2 focus:outline-primary"
              >
                {content}
              </a>
            ) : (
              <g key={`${item.label}-${i}`}>{content}</g>
            );
          })}
        </svg>
      </div>
      <details className="mt-3">
        <summary className="min-h-11 cursor-pointer py-3 text-xs text-muted-foreground">
          View chart data
        </summary>
        <div className="max-h-72 overflow-auto">
          <table className="w-full text-left text-xs tabular-nums">
            <caption className="sr-only">
              Chart values in {unit || "events"}
            </caption>
            <thead>
              <tr className="border-b border-border">
                <th className="py-2">Category</th>
                <th className="py-2 text-right">{unit || "Count"}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, i) => (
                <tr key={i} className="border-b border-border/60">
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
}
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
          "relative flex min-h-14 items-center justify-between gap-3 overflow-hidden rounded-xl bg-muted/70 px-4 py-3 focus-visible:outline-2 focus-visible:outline-primary";
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
