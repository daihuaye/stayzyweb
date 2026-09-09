"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api";
import {
  openSession,
  sealSession,
  sessionCookie,
  sessionLifetime,
} from "@/lib/session";
import {
  keyError,
  rolloutError,
  validConfiguration,
  validRule,
  type Configuration,
  type NewRule,
  type Result,
  type Rule,
  type RuleInput,
} from "@/lib/experiments";
async function credential() {
  return openSession((await cookies()).get(sessionCookie)?.value);
}
async function checked<T>(result: Result<T>) {
  if (!result.ok && result.code === "unauthorized")
    (await cookies()).delete(sessionCookie);
  return result;
}
export async function loginAction(_: { error: string }, form: FormData) {
  const token = form.get("token");
  if (typeof token !== "string" || !token.trim() || token.length > 2048)
    return { error: "Enter a valid admin token." };
  let sealed: string;
  try {
    sealed = await sealSession(token.trim());
  } catch {
    return {
      error:
        "Admin sessions are unavailable. Configure STAYZY_SESSION_SECRET with at least 32 characters.",
    };
  }
  const result = await apiRequest<Configuration>(token.trim(), "");
  if (!result.ok) return { error: result.error };
  if (!validConfiguration(result.data))
    return {
      error: "The API returned an unsupported experiment configuration.",
    };
  (await cookies()).set(sessionCookie, sealed, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionLifetime,
  });
  redirect("/admin");
}
export async function logoutAction() {
  (await cookies()).delete(sessionCookie);
  redirect("/admin/login");
}
export async function loadRules(): Promise<Result<Configuration>> {
  const token = await credential();
  if (!token)
    return checked({
      ok: false,
      error: "Your session has expired. Please sign in again.",
      code: "unauthorized",
    });
  const result = await checked(await apiRequest<Configuration>(token, ""));
  if (result.ok && !validConfiguration(result.data))
    return {
      ok: false,
      error: "The API returned an unsupported configuration.",
    };
  return result;
}
export async function saveRule(
  key: string,
  input: RuleInput,
): Promise<Result<Rule>> {
  const token = await credential();
  if (!token)
    return checked({
      ok: false,
      error: "Your session has expired. Please sign in again.",
      code: "unauthorized",
    });
  if (
    keyError(key) ||
    !input ||
    typeof input.enabled !== "boolean" ||
    rolloutError(input.rolloutPercentage)
  )
    return {
      ok: false,
      error: "Check the key, status, and rollout percentage.",
    };
  const result = await checked(
    await apiRequest<Rule>(token, `/${encodeURIComponent(key)}`, "PUT", {
      enabled: input.enabled,
      rolloutPercentage: input.rolloutPercentage,
    }),
  );
  if (result.ok && !validRule(result.data))
    return {
      ok: false,
      error:
        "The response could not be verified. Refresh to check the saved configuration.",
      uncertain: true,
    };
  return result;
}
export async function createRule(
  input: NewRule,
): Promise<Result<Rule & { key: string }>> {
  const token = await credential();
  if (!token)
    return checked({
      ok: false,
      error: "Your session has expired. Please sign in again.",
      code: "unauthorized",
    });
  if (
    !input ||
    keyError(input.key) ||
    typeof input.enabled !== "boolean" ||
    rolloutError(input.rolloutPercentage)
  )
    return {
      ok: false,
      error: "Check the key, status, and rollout percentage.",
    };
  const result = await checked(
    await apiRequest<Rule & { key: string }>(token, "", "POST", {
      key: input.key,
      enabled: input.enabled,
      rolloutPercentage: input.rolloutPercentage,
    }),
  );
  if (result.ok && (!validRule(result.data) || result.data.key !== input.key))
    return {
      ok: false,
      error:
        "The creation response could not be verified. Check the saved configuration before retrying.",
      uncertain: true,
    };
  return result;
}
