import type { Result } from "./experiments";
const messages: Record<string, string> = {
  invalid_credentials: "Email or password was not accepted.",
  admin_unauthorized: "Your session has expired. Please sign in again.",
  password_change_required: "Change your temporary password before continuing.",
  owner_required: "Only owners can manage administrator accounts.",
  admin_exists: "An administrator with that email already exists.",
  admin_not_found: "Administrator not found.",
  admin_login_throttled: "Too many sign-in attempts. Try again in 15 minutes.",
  incorrect_password: "Your current password was not accepted.",
  password_unchanged: "Choose a different password.",
  invalid_reset: "This reset link is invalid or expired. Request a new one.",
  self_change_forbidden: "You cannot deactivate or demote your own account.",
  last_owner: "At least one active owner must remain.",
  experiment_exists:
    "This key already exists. Choose a different key or review the existing flight.",
};
export async function adminRequest<T>(
  token: string | null,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<Result<T>> {
  const base = process.env.STAYZY_API_BASE_URL;
  if (!base)
    return {
      ok: false,
      error:
        "Administration is unavailable. The Stayzy API connection is not configured.",
      code: "configuration",
    };
  try {
    const url = new URL(base);
    if (
      !["http:", "https:"].includes(url.protocol) ||
      (process.env.NODE_ENV === "production" && url.protocol !== "https:")
    )
      return {
        ok: false,
        error: "The API connection requires a valid HTTPS URL.",
        code: "configuration",
      };
    const response = await fetch(`${base.replace(/\/$/, "")}/v1/admin${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
      redirect: "error",
    });
    if (!response.ok) {
      let backendCode = "";
      try {
        const detail = (await response.json())?.detail;
        if (typeof detail?.code === "string") backendCode = detail.code;
      } catch {
        /* Use status-based safe messages. */
      }
      const code =
        response.status === 401
          ? "unauthorized"
          : backendCode ||
            (response.status === 403
              ? "forbidden"
              : response.status === 409
                ? "experiment_exists"
                : response.status === 404 || response.status === 405
                  ? "unavailable"
                  : "api_error");
      const error =
        messages[backendCode] ||
        (code === "unauthorized"
          ? "Your session has expired. Please sign in again."
          : code === "unavailable"
            ? "This operation is unavailable. The backend may need the administrator-account update."
            : response.status === 422
              ? "Check the email, password requirements, and other fields."
              : `The API could not complete this request (${response.status}). Please try again.`);
      return {
        ok: false,
        error,
        code,
        uncertain: method !== "GET" && response.status >= 500,
      };
    }
    return {
      ok: true,
      data:
        response.status === 204
          ? (undefined as T)
          : ((await response.json()) as T),
    };
  } catch {
    return {
      ok: false,
      error:
        "We could not reach the Stayzy API. Check your connection and try again.",
      code: "connection",
      uncertain: method !== "GET",
    };
  }
}
export async function apiRequest<T>(
  token: string,
  path: string,
  method = "GET",
  body?: unknown,
) {
  return adminRequest<T>(token, `/experiments${path}`, method, body);
}
