"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminRequest } from "@/lib/api";
import { openSession, sealSession, sessionCookie } from "@/lib/session";
import {
  passwordError,
  validAdministrator,
  type Administrator,
  type FormState,
  type LoginResponse,
} from "@/lib/admin-auth";
import type { Result } from "@/lib/experiments";
async function credential() {
  return openSession((await cookies()).get(sessionCookie)?.value);
}
function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}
export async function loginAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const email = field(form, "email").trim(),
    password = field(form, "password");
  if (!email || !password || [...password].length > 128)
    return { error: "Enter your email and password." };
  // Verify web configuration before creating a backend session.
  try {
    await sealSession("configuration-check");
  } catch {
    return {
      error:
        "Administrator sessions are unavailable. Configure STAYZY_SESSION_SECRET on the website with at least 32 characters.",
    };
  }
  const result = await adminRequest<LoginResponse>(
    null,
    "/auth/login",
    "POST",
    { email, password },
  );
  if (!result.ok) return { error: result.error };
  if (
    !validAdministrator(result.data.account) ||
    typeof result.data.session_token !== "string" ||
    !Number.isFinite(Date.parse(result.data.expires_at)) ||
    Date.parse(result.data.expires_at) <= Date.now()
  )
    return { error: "The backend returned an unsupported login response." };
  const sealed = await sealSession(
    result.data.session_token,
    result.data.expires_at,
  );
  (await cookies()).delete("stayzy_admin");
  (await cookies()).set(sessionCookie, sealed, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: new Date(
      Math.min(
        Date.parse(result.data.expires_at),
        Date.now() + 8 * 60 * 60 * 1000,
      ),
    ),
  });
  redirect(
    result.data.account.must_change_password
      ? "/admin/change-password"
      : "/admin",
  );
}
export async function logoutAction() {
  const token = await credential();
  const result = token
    ? await adminRequest<void>(token, "/auth/logout", "POST")
    : { ok: true };
  (await cookies()).delete(sessionCookie);
  (await cookies()).delete("stayzy_admin");
  redirect(
    !result.ok ? "/admin/login?notice=logout-unconfirmed" : "/admin/login",
  );
}
export async function changePasswordAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const current_password = field(form, "current_password"),
    new_password = field(form, "new_password");
  if (!current_password) return { error: "Enter your current password." };
  if (passwordError(new_password))
    return { error: passwordError(new_password) };
  if (new_password !== field(form, "confirm_password"))
    return { error: "The new passwords do not match." };
  const token = await credential();
  if (!token) redirect("/admin/login");
  const result = await adminRequest<void>(
    token,
    "/auth/change-password",
    "POST",
    { current_password, new_password },
  );
  if (!result.ok) {
    if (result.code === "unauthorized") {
      (await cookies()).delete(sessionCookie);
      redirect("/admin/login");
    }
    return { error: result.error };
  }
  (await cookies()).delete(sessionCookie);
  redirect("/admin/login?notice=password-changed");
}
export async function forgotPasswordAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const email = field(form, "email").trim();
  if (!email) return { error: "Enter your email address." };
  const result = await adminRequest<{ status: string }>(
    null,
    "/auth/forgot-password",
    "POST",
    { email },
  );
  return result.ok
    ? {
        error: "",
        success:
          "If an active administrator account matches that email, a password reset link has been requested. Check your inbox. Links expire after 30 minutes.",
      }
    : { error: result.error };
}
export async function resetPasswordAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const token = field(form, "reset_token"),
    new_password = field(form, "new_password");
  if (!token || token.length > 256)
    return { error: "This reset link is invalid. Request a new one." };
  if (passwordError(new_password))
    return { error: passwordError(new_password) };
  if (new_password !== field(form, "confirm_password"))
    return { error: "The new passwords do not match." };
  const result = await adminRequest<void>(
    null,
    "/auth/reset-password",
    "POST",
    { token, new_password },
  );
  if (!result.ok) return { error: result.error };
  (await cookies()).delete(sessionCookie);
  redirect("/admin/login?notice=password-changed");
}
async function accountResult<T>(result: Result<T>) {
  if (!result.ok && result.code === "unauthorized") {
    (await cookies()).delete(sessionCookie);
    redirect("/admin/login");
  }
  if (!result.ok && result.code === "password_change_required")
    redirect("/admin/change-password");
  return result;
}
export async function listAccounts(): Promise<Result<Administrator[]>> {
  const token = await credential();
  if (!token) redirect("/admin/login");
  const result = await accountResult(
    await adminRequest<Administrator[]>(token, "/accounts"),
  );
  if (
    result.ok &&
    (!Array.isArray(result.data) || !result.data.every(validAdministrator))
  )
    return { ok: false, error: "The account list could not be verified." };
  return result;
}
export async function createAccountAction(
  _: FormState,
  form: FormData,
): Promise<FormState> {
  const email = field(form, "email").trim(),
    role = field(form, "role"),
    temporary_password = field(form, "temporary_password");
  if (!email || !["admin", "owner"].includes(role))
    return { error: "Enter an email and choose a role." };
  if (passwordError(temporary_password))
    return { error: passwordError(temporary_password) };
  const token = await credential();
  if (!token) redirect("/admin/login");
  const result = await accountResult(
    await adminRequest<Administrator>(token, "/accounts", "POST", {
      email,
      role,
      temporary_password,
    }),
  );
  if (!result.ok)
    return {
      error: result.uncertain
        ? "Creation could not be confirmed. Refresh the account list before retrying; do not assume the temporary password was set."
        : result.error,
    };
  return {
    error: "",
    success:
      "Administrator created. Share the temporary password separately. They must change it at first login.",
  };
}
export async function updateAccount(
  id: string,
  patch: { role?: "owner" | "admin"; active?: boolean },
): Promise<Result<Administrator>> {
  if (
    !id ||
    id.length > 80 ||
    !patch ||
    !Object.keys(patch).length ||
    Object.keys(patch).some((key) => !["role", "active"].includes(key)) ||
    ("role" in patch && !["owner", "admin"].includes(patch.role || "")) ||
    ("active" in patch && typeof patch.active !== "boolean")
  )
    return { ok: false, error: "Invalid account change." };
  const token = await credential();
  if (!token) redirect("/admin/login");
  return accountResult(
    await adminRequest<Administrator>(
      token,
      `/accounts/${encodeURIComponent(id)}`,
      "PATCH",
      patch,
    ),
  );
}
