import Link from "next/link";
import { cn } from "@/lib/utils";
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Stayzy home"
      className={cn(
        "inline-flex items-center gap-2.5 text-2xl font-bold tracking-tight",
        className,
      )}
    >
      <span className="brand-mark" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>
        stayzy<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
