"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { openSession, sessionCookie } from "@/lib/session";
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
  if (!result.ok && result.code === "password_change_required")
    redirect("/admin/change-password");
  return result;
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
