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
      <svg
        className="brand-mark"
        viewBox="0 0 32 32"
        aria-hidden="true"
        focusable="false"
      >
        <path
          d="M 16 4 A 12 12 0 1 0 28 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle cx="24.5" cy="7.5" r="2.8" fill="currentColor" />
      </svg>
      <span>
        stayzy<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
