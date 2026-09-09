"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  LogOut,
  Radio,
  ShieldCheck,
  Users,
  KeyRound,
} from "lucide-react";
import { Brand } from "@/components/site/brand";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/app/admin/auth-actions";
import type { Administrator } from "@/lib/admin-auth";
import { usePathname } from "next/navigation";
export function AdminShell({
  children,
  account,
}: {
  children: React.ReactNode;
  account: Administrator;
}) {
  const pathname = usePathname();
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-5 py-4 sm:px-10">
          <div className="flex items-center gap-4">
            <Brand className="text-xl" />
            <span className="hidden border-l border-border pl-4 text-xs text-muted-foreground sm:block">
              Control room
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden max-w-48 text-right sm:block">
              <p className="truncate text-xs">{account.email}</p>
              <p className="text-[10px] capitalize text-muted-foreground">
                {account.role}
              </p>
            </div>
            <Button asChild variant="ghost" className="hidden sm:inline-flex">
              <Link href="/">
                View site <ArrowUpRight />
              </Link>
            </Button>
            <form action={logoutAction}>
              <Button type="submit" variant="ghost">
                <LogOut />
                <span>Log out</span>
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[210px_1fr]">
        <aside className="border-b border-border px-5 py-4 lg:min-h-[calc(100vh-81px)] lg:border-b-0 lg:border-r lg:px-7 lg:py-9">
          <p className="eyebrow mb-5 hidden text-muted-foreground lg:block">
            Workspace
          </p>
          <Link
            href="/admin"
            className={`flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium ${pathname === "/admin" || pathname.startsWith("/admin/experiments") ? "bg-[#e3eee8] text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Radio className="size-4" /> Feature flights
          </Link>
          {account.role === "owner" && (
            <Link
              href="/admin/accounts"
              className={`mt-2 flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-medium ${pathname === "/admin/accounts" ? "bg-[#e3eee8] text-primary" : "text-muted-foreground hover:bg-muted"}`}
            >
              <Users className="size-4" /> Administrators
            </Link>
          )}
          <Link
            href="/admin/change-password"
            className="mt-2 flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm text-muted-foreground hover:bg-muted"
          >
            <KeyRound className="size-4" /> Password
          </Link>
          <p className="mt-3 break-all px-4 text-xs text-muted-foreground sm:hidden">
            {account.email} · {account.role}
          </p>
          <div className="mt-12 hidden px-3 text-xs leading-6 text-muted-foreground lg:block">
            <ShieldCheck className="mb-3 size-5" />
            <p>Admin workspace</p>
            <p className="text-[11px]">
              Changes connect directly to your Stayzy API.
            </p>
          </div>
        </aside>
        <main className="min-w-0 px-5 py-8 sm:px-10 sm:py-10">{children}</main>
      </div>
    </div>
  );
}
