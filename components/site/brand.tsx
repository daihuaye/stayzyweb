import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
export function Brand({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      aria-label="Stayzy home"
      className={cn(
        "relative inline-flex h-14 w-32 shrink-0 items-center overflow-hidden rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring",
        className,
      )}
    >
      <Image
        src="/marketing/stayzy-logo.png"
        alt=""
        width={128}
        height={128}
        className="absolute -top-[34px] left-0 h-32 w-32 max-w-none"
      />
    </Link>
  );
}
