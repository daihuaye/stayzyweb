"use client";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import {
  changePasswordAction,
  forgotPasswordAction,
  resetPasswordAction,
  logoutAction,
} from "@/app/admin/auth-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordField } from "./password-field";
import type { FormState } from "@/lib/admin-auth";
function Feedback({ state }: { state: FormState }) {
  return (
    <>
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm leading-6 text-destructive"
        >
          {state.error}
        </p>
      )}
      {state.success && (
        <p
          role="status"
          className="rounded-xl bg-[#e1eee6] p-4 text-sm leading-6 text-primary"
        >
          {state.success}
        </p>
      )}
    </>
  );
}
export function ChangePasswordForm({ email }: { email: string }) {
  const [state, action, pending] = useActionState(changePasswordAction, {
    error: "",
  });
  return (
    <>
      <form action={action} className="mt-8 space-y-5">
        <input
          type="hidden"
          name="username"
          autoComplete="username"
          value={email}
          readOnly
        />
        <PasswordField
          name="current_password"
          label="Current password"
          autoComplete="current-password"
          disabled={pending}
        />
        <PasswordField
          name="new_password"
          label="New password"
          help="15–128 characters. Spaces and password-manager paste are supported."
          disabled={pending}
        />
        <PasswordField
          name="confirm_password"
          label="Confirm new password"
          disabled={pending}
        />
        <Feedback state={state} />
        <Button disabled={pending} type="submit" className="w-full">
          {pending ? "Updating…" : "Change password and sign out"}
        </Button>
        <p className="text-xs leading-5 text-muted-foreground">
          This signs out all sessions. You’ll sign in again with your new
          password.
        </p>
      </form>
      <form action={logoutAction} className="mt-3">
        <Button variant="ghost" disabled={pending}>
          Log out instead
        </Button>
      </form>
    </>
  );
}
export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, {
    error: "",
  });
  return (
    <form action={action} className="mt-8 space-y-5">
      <div>
        <label
          htmlFor="recovery-email"
          className="mb-2 block text-sm font-medium"
        >
          Email address
        </label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          required
          disabled={pending}
        />
      </div>
      <Feedback state={state} />
      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Requesting…" : "Request reset link"}
      </Button>
      <Link
        href="/admin/login"
        className="inline-flex min-h-11 items-center text-sm text-primary"
      >
        Back to sign in
      </Link>
    </form>
  );
}
export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, {
    error: "",
  });
  const tokenInput = useRef<HTMLInputElement>(null);
  const tokenMemory = useRef("");
  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get(
      "token",
    );
    if (token) {
      tokenMemory.current = token.length <= 256 ? token : "";
      history.replaceState(
        null,
        "",
        window.location.pathname + window.location.search,
      );
    }
    if (tokenInput.current) tokenInput.current.value = tokenMemory.current;
  }, []);
  // The secret stays only in this form's memory. React resets uncontrolled fields after actions,
  // so restore the hidden value from the ref when retrying a failed submission.
  return (
    <form
      action={action}
      onSubmit={() => {
        if (tokenInput.current) tokenInput.current.value = tokenMemory.current;
      }}
      className="mt-8 space-y-5"
    >
      <input ref={tokenInput} type="hidden" name="reset_token" />
      <PasswordField
        name="new_password"
        label="New password"
        help="Use 15–128 characters and choose a password different from your current one."
        disabled={pending}
      />
      <PasswordField
        name="confirm_password"
        label="Confirm new password"
        disabled={pending}
      />
      <Feedback state={state} />
      <Button disabled={pending} type="submit" className="w-full">
        {pending ? "Updating…" : "Reset password"}
      </Button>
      <Link
        href="/admin/forgot-password"
        className="inline-flex min-h-11 items-center text-sm text-primary"
      >
        Request a new reset link
      </Link>
    </form>
  );
}
