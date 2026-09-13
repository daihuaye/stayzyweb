import Link from "next/link";
import type { ReactNode } from "react";
import { format, number } from "@/lib/telemetry";
export function Card({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h2 className="text-base font-semibold tracking-tight">{title}</h2>
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
}: {
  title: string;
  value: string;
  note: string;
  href?: string;
}) {
  const content = (
    <>
      <p className="text-xs text-muted-foreground">{title}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-[11px] leading-5 text-muted-foreground">{note}</p>
    </>
  );
  return href ? (
    <Link
      href={href}
      className="rounded-2xl border border-border bg-card p-5 hover:border-primary focus-visible:outline-2 focus-visible:outline-primary"
    >
      {content}
    </Link>
  ) : (
    <div className="rounded-2xl border border-border bg-card p-5">
      {content}
    </div>
  );
}
export type ChartItem = { label: string; value: number | null; href?: string };
export function Bars({
  items,
  unit = "",
  color = "#087e83",
  horizontal = false,
}: {
  items: ChartItem[];
  unit?: string;
  color?: string;
  horizontal?: boolean;
}) {
  if (!items.length) return <Empty />;
  const max = Math.max(1, ...items.map((x) => number(x.value) || 0));
  const width = 640,
    height = horizontal ? Math.max(100, items.length * 40) : 220;
  return (
    <>
      <svg
        role="img"
        aria-label={`${unit || "Count"} by ${horizontal ? "category" : "date"}; values available in the data table below`}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full overflow-visible"
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
                width={horizontal ? 385 : Math.max(1, slot - 8)}
                height={horizontal ? 22 : 160}
                rx="3"
                fill="#eeefea"
              />
              <rect
                x={x}
                y={y}
                width={horizontal ? (v / max) * 385 : Math.max(1, slot - 8)}
                height={horizontal ? 22 : (v / max) * 155}
                rx="3"
                fill={color}
              />
              {horizontal ? (
                <>
                  <text x="0" y={y + 16} fontSize="12" fill="currentColor">
                    {item.label.slice(0, 23)}
                  </text>
                  <text x="565" y={y + 16} fontSize="12" fill="currentColor">
                    {format(item.value, 1)}
                  </text>
                </>
              ) : (
                i % Math.max(1, Math.ceil(items.length / 6)) === 0 && (
                  <text x={x} y="204" fontSize="11" fill="#65716d">
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
export function Funnel({ items }: { items: ChartItem[] }) {
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
                fill="#dcece5"
              />
            </svg>
            <span className="relative text-sm">
              <span className="mr-3 text-xs text-muted-foreground">
                0{i + 1}
              </span>
              {item.label}
            </span>
            <span className="relative whitespace-nowrap text-sm font-semibold tabular-nums">
              {format(item.value)}{" "}
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                {denominator
                  ? `${format(((item.value || 0) / denominator) * 100, 1)}%`
                  : "—"}
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
