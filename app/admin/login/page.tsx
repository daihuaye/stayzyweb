import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Brand } from "@/components/site/brand";
import { LoginForm } from "@/components/admin/login-form";
export const metadata = {
  title: "Admin login",
  robots: { index: false, follow: false },
};
export default function Login() {
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
            A thoughtful rollout
            <br />
            starts here.
          </h1>
          <p className="mt-4 text-sm leading-6 text-muted-foreground">
            Sign in to create feature flights and decide when they’re ready to
            take off.
          </p>
          <LoginForm />
          <p className="mt-7 text-center text-xs text-muted-foreground">
            Secure session · Automatically expires after 8 hours
          </p>
          <Link
            href="/"
            className="mt-9 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Back to Stayzy
          </Link>
        </div>
      </div>
    </main>
  );
}
