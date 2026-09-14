import Link from "next/link";
import Image from "next/image";
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
      <Image
        src="/marketing/app-icon.png"
        alt=""
        width={44}
        height={44}
        className="rounded-xl"
      />
      <span>
        stayzy<span className="text-primary">.</span>
      </span>
    </Link>
  );
}
