"use client";
import { memo, useCallback, useEffect, useState } from "react";
import { useShallow } from "zustand/react/shallow";
import { Plus, RefreshCw, ShieldCheck, Users } from "lucide-react";
import {
  createAccountAction,
  listAccounts,
  updateAccount,
} from "@/app/admin/auth-actions";
import type { Administrator, FormState } from "@/lib/admin-auth";
import { useAdmin } from "./provider";
import { PasswordField } from "./password-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
const selectStyle =
  "min-h-11 rounded-xl border border-input bg-background px-3 text-sm focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60";
function CreateAccount({
  onCreated,
  onPending,
}: {
  onCreated: (message: string) => void;
  onPending: (pending: boolean) => void;
}) {
  const [state, setState] = useState<FormState>({ error: "" });
  const [pending, setPending] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    setPending(true);
    onPending(true);
    setState({ error: "" });
    try {
      const result = await createAccountAction({ error: "" }, data);
      setState(result);
      if (result.success) {
        form.reset();
        onCreated(result.success);
      }
    } catch {
      setState({
        error:
          "Creation could not be confirmed. Close this dialog and refresh the account list before retrying.",
      });
    } finally {
      setPending(false);
      onPending(false);
      const password = form.elements.namedItem(
        "temporary_password",
      ) as HTMLInputElement | null;
      if (password) password.value = "";
    }
  }
  return (
    <form onSubmit={submit} className="mt-6 space-y-5">
      <div>
        <label
          htmlFor="new-admin-email"
          className="mb-2 block text-sm font-medium"
        >
          Email address
        </label>
        <Input
          id="new-admin-email"
          name="email"
          type="email"
          autoComplete="off"
          autoCapitalize="none"
          required
          disabled={pending}
        />
      </div>
      <div>
        <label
          htmlFor="new-admin-role"
          className="mb-2 block text-sm font-medium"
        >
          Role
        </label>
        <select
          id="new-admin-role"
          name="role"
          defaultValue="admin"
          disabled={pending}
          className={`${selectStyle} w-full`}
        >
          <option value="admin">Admin — manages flights</option>
          <option value="owner">Owner — manages flights and accounts</option>
        </select>
      </div>
      <PasswordField
        name="temporary_password"
        label="Temporary password"
        help="15–128 characters. Share it separately with the recipient; no invitation email is sent."
        disabled={pending}
      />
      {state.error && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm leading-6 text-destructive"
        >
          {state.error}
        </p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Creating…" : "Create administrator"}
      </Button>
    </form>
  );
}
const AccountCard = memo(function AccountCard({
  id,
  selfId,
  onRefresh,
}: {
  id: string;
  selfId: string;
  onRefresh: () => Promise<void>;
}) {
  const account = useAdmin((s) => s.accounts[id]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [change, setChange] = useState<{
    role?: "owner" | "admin";
    active?: boolean;
  } | null>(null);
  if (!account) return null;
  async function apply() {
    if (!change) return;
    setPending(true);
    setError("");
    try {
      const result = await updateAccount(id, change);
      if (!result.ok) setError(result.error);
      await onRefresh();
    } catch {
      setError(
        "The update could not be confirmed. Refresh the list to check the saved state.",
      );
    } finally {
      setPending(false);
      setChange(null);
    }
  }
  return (
    <article className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="break-all font-semibold">
            {account.email}{" "}
            {id === selfId && (
              <span className="ml-2 text-xs font-normal text-primary">You</span>
            )}
          </h2>
          <p className="mt-2 text-xs text-muted-foreground">
            {account.must_change_password
              ? "Password change required"
              : "Password set"}{" "}
            · {account.active ? "Active" : "Disabled"}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs ${account.role === "owner" ? "bg-[#e1eee6] text-primary" : "bg-muted text-muted-foreground"}`}
        >
          {account.role}
        </span>
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <label className="flex items-center gap-3 text-sm">
          Role
          <select
            aria-label={`Role for ${account.email}`}
            value={account.role}
            onChange={(e) =>
              setChange({ role: e.target.value as Administrator["role"] })
            }
            className={selectStyle}
            disabled={pending || id === selfId}
          >
            <option value="admin">Admin</option>
            <option value="owner">Owner</option>
          </select>
        </label>
        <Button
          variant="outline"
          disabled={pending || id === selfId}
          onClick={() => setChange({ active: !account.active })}
        >
          {pending ? "Updating…" : account.active ? "Deactivate" : "Reactivate"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <ConfirmDialog
        open={!!change}
        onOpenChange={(open) => {
          if (!open) setChange(null);
        }}
        onConfirm={() => void apply()}
        title={
          change?.role
            ? "Change administrator role?"
            : change?.active
              ? "Reactivate this account?"
              : "Deactivate this account?"
        }
        description={
          change?.role
            ? `Set ${account.email} to ${change.role}. Owners can manage other accounts.`
            : change?.active
              ? "The administrator can sign in again. Previously revoked sessions stay revoked."
              : "This immediately revokes all sessions and outstanding reset links for this account."
        }
        confirmLabel="Confirm change"
        cancelLabel="Cancel"
      />
    </article>
  );
});
export function Accounts({ selfId }: { selfId: string }) {
  const ids = useAdmin(useShallow((s) => Object.keys(s.accounts)));
  const setAccounts = useAdmin((s) => s.setAccounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const refresh = useCallback(async () => {
    try {
      const result = await listAccounts();
      if (result.ok) {
        setAccounts(result.data);
        setError("");
      } else setError(result.error);
    } catch {
      setError("Unable to load administrator accounts. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [setAccounts]);
  useEffect(() => {
    let active = true;
    listAccounts()
      .then((result) => {
        if (!active) return;
        if (result.ok) setAccounts(result.data);
        else setError(result.error);
        setLoading(false);
      })
      .catch(() => {
        if (active) {
          setError("Unable to load administrator accounts. Please try again.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [setAccounts]);
  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="eyebrow text-primary">A trusted team</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Administrators
          </h1>
          <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
            Give the right people a place in your control room. Each account has
            its own password and access.
          </p>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus />
          Add administrator
        </Button>
      </div>
      <div className="my-6 flex items-start gap-3 rounded-xl bg-[#e9eee6] p-4 text-xs leading-6 text-muted-foreground">
        <ShieldCheck className="mt-1 size-4 shrink-0" />
        <p>
          Owners manage accounts and flights. Admins manage flights. New
          accounts must change their temporary password before continuing.
        </p>
      </div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold">
          <Users className="size-4" />
          Your team
        </h2>
        <Button
          variant="ghost"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            void refresh();
          }}
        >
          <RefreshCw className={loading ? "animate-spin" : ""} />
          {loading ? "Refreshing…" : "Refresh"}
        </Button>
      </div>
      {notice && (
        <p
          role="status"
          className="mb-5 rounded-xl bg-[#e1eee6] p-4 text-sm text-primary"
        >
          {notice}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-5 text-sm text-destructive">
          {error}
        </p>
      )}
      {loading && !ids.length ? (
        <p role="status" className="p-10 text-center text-muted-foreground">
          Loading administrator accounts…
        </p>
      ) : (
        <div className="grid gap-4">
          {ids.map((id) => (
            <AccountCard key={id} id={id} selfId={selfId} onRefresh={refresh} />
          ))}
        </div>
      )}
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!creating) setOpen(value);
        }}
        title="Add an administrator"
        description="Create a personal account with a temporary password. The recipient chooses their own password on first login."
      >
        <CreateAccount
          onPending={setCreating}
          onCreated={(message) => {
            setOpen(false);
            setNotice(message);
            void refresh();
          }}
        />
      </Dialog>
    </>
  );
}
