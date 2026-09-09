"use client";
import { useActionState, useState } from "react";
import { ArrowRight, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { loginAction } from "@/app/admin/actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, { error: "" });
  const [visible, setVisible] = useState(false);
  return (
    <form action={action} className="mt-9 space-y-6">
      <div>
        <label htmlFor="token" className="mb-2 block text-sm font-medium">
          Admin token
        </label>
        <div className="relative">
          <Input
            id="token"
            name="token"
            type={visible ? "text" : "password"}
            required
            maxLength={2048}
            autoComplete="off"
            placeholder="Enter your admin token"
            className="pr-12"
            disabled={pending}
            aria-describedby="token-help"
          />
          <button
            type="button"
            aria-label={visible ? "Hide token" : "Show token"}
            onClick={() => setVisible(!visible)}
            className="absolute right-0 top-0 flex size-12 items-center justify-center rounded-xl text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {visible ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
        <p
          id="token-help"
          className="mt-2 text-xs leading-5 text-muted-foreground"
        >
          Use the administrator token configured for your Stayzy API.
        </p>
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
        {pending ? "Connecting…" : "Enter control room"}
        <ArrowRight />
      </Button>
    </form>
  );
}
