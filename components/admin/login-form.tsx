"use client";
import Link from "next/link";
import { useActionState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { loginAction } from "@/app/admin/auth-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PasswordField } from "./password-field";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  return (
    <form action={action} className="mt-9 space-y-6">
      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium">
          Email address
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          autoCapitalize="none"
          required
          disabled={pending}
          placeholder="you@company.com"
        />
      </div>
      <PasswordField
        name="password"
        label="Password"
        autoComplete="current-password"
        disabled={pending}
      />
      <div className="flex justify-end">
        <Link
          href="/admin/forgot-password"
          className="inline-flex min-h-11 items-center text-sm text-primary underline-offset-4 hover:underline"
        >
          Forgot password?
        </Link>
      </div>
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? <LoaderCircle className="animate-spin" /> : null}
        {pending ? "Signing in…" : "Enter control room"}
        <ArrowRight />
      </Button>
      <p className="text-center text-xs leading-5 text-muted-foreground">
        Administrator access only. Ask an owner to create your account.
      </p>
    </form>
  );
}
