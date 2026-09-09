import type { Result } from "./experiments";
export async function apiRequest<T>(
  token: string,
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
    const response = await fetch(
      `${base.replace(/\/$/, "")}/v1/admin/experiments${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: "no-store",
        signal: AbortSignal.timeout(12000),
        redirect: "error",
      },
    );
    if (!response.ok) {
      const code =
        response.status === 401 || response.status === 403
          ? "unauthorized"
          : response.status === 409
            ? "experiment_exists"
            : response.status === 404 || response.status === 405
              ? "unavailable"
              : "api_error";
      const error =
        code === "unauthorized"
          ? "Your token was not accepted. Sign in again."
          : code === "experiment_exists"
            ? "This key already exists. Choose a different key or review the existing flight."
            : code === "unavailable"
              ? "This operation is unavailable. The API may need the experiment-creation update."
              : `The API could not complete this request (${response.status}). Please try again.`;
      return {
        ok: false,
        error,
        code,
        uncertain: method !== "GET" && response.status >= 500,
      };
    }
    return { ok: true, data: (await response.json()) as T };
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
