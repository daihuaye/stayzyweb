import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/site/brand";
export function AuthPage({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="px-6 py-7 sm:px-12">
        <Brand />
      </header>
      <div className="flex flex-1 items-center justify-center px-5 pb-16">
        <div className="w-full max-w-md">
          <div className="mb-7 flex size-12 items-center justify-center rounded-2xl bg-[#e1eee6] text-primary">
            <ShieldCheck className="size-6" />
          </div>
          <p className="eyebrow text-primary">Stayzy control room</p>
          <h1 className="mt-4 text-4xl font-semibold tracking-[-.045em]">
            {title}
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
          {children}
          <Link
            href="/"
            className="mt-9 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" />
            Back to Stayzy
          </Link>
        </div>
      </div>
    </main>
  );
}
