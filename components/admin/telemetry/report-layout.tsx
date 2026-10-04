import {
  Activity,
  ChartColumn,
  Flag,
  Play,
  Clock,
  CloudUpload,
  Gauge,
  Bug,
  ScanEye,
  History,
} from "lucide-react";
import type { ReactNode } from "react";

const icons: Record<string, typeof Activity> = {
  summary: Activity,
  results: ChartColumn,
  setup: Play,
  activity: Clock,
  coverage: CloudUpload,
  performance: Gauge,
  diagnostics: Bug,
  attribution: ScanEye,
  recent: History,
};

export function ReportNav({ items }: { items: [string, string][] }) {
  return (
    // Layer 1 keeps report navigation above charts and below application dialogs.
    <nav aria-label="Report sections" className="telemetry-report-nav">
      {items.map(([id, title]) => {
        const Icon = icons[id] || Flag;
        return (
          <a
            key={id}
            href={`#${id}`}
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98]"
          >
            <Icon size={14} className="mr-2" />
            {title}
          </a>
        );
      })}
    </nav>
  );
}

export function ReportSection({
  id,
  title,
  note,
  children,
}: {
  id: string;
  title: string;
  note: string;
  children: ReactNode;
}) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="telemetry-report-section scroll-mt-20 space-y-4"
    >
      <div>
        <h2 id={`${id}-title`} className="text-lg font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
          {note}
        </p>
      </div>
      {children}
    </section>
  );
}
