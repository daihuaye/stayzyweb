import type { ReactNode } from "react";

export function ReportNav({ items }: { items: [string, string][] }) {
  return (
    // Layer 1 keeps report navigation above charts and below application dialogs.
    <nav
      aria-label="Report sections"
      className="sticky top-0 z-[1] flex gap-1 overflow-x-auto border-b border-border bg-background py-2"
    >
      {items.map(([id, title]) => (
        <a
          key={id}
          href={`#${id}`}
          className="inline-flex min-h-11 shrink-0 items-center rounded-lg px-3 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary active:scale-[0.98]"
        >
          {title}
        </a>
      ))}
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
      className="scroll-mt-20 space-y-4 border-t border-border pt-6"
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
