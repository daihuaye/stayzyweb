"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { adminRequest } from "@/lib/api";
import { openSession, sessionCookie } from "@/lib/session";
import {
  apiQuery,
  validReport,
  type Query,
  type Overview,
  type Health,
  type SessionPage,
  type Detail,
  type EventPage,
} from "@/lib/telemetry";
import type { Result } from "@/lib/experiments";
async function request<T>(
  path: string,
  kind: string,
  query: Query,
): Promise<Result<T>> {
  const token = await openSession((await cookies()).get(sessionCookie)?.value);
  if (!token) redirect("/admin/login");
  const result = await adminRequest<T>(
    token,
    `/telemetry${path}?${apiQuery(query)}`,
  );
  if (!result.ok) {
    if (result.code === "unauthorized") redirect("/admin/login");
    if (result.code === "password_change_required")
      redirect("/admin/change-password");
    if (result.code === "unavailable")
      return {
        ...result,
        error:
          "Telemetry reporting is unavailable. Deploy the Stayzy API telemetry reporting endpoints and run the database migration, then refresh.",
      };
    return result;
  }
  return validReport(kind, result.data)
    ? result
    : {
        ok: false,
        error:
          "The API returned an unsupported telemetry response. Check that the web and API reporting versions match.",
      };
}
export async function loadOverview(query: Query) {
  return request<Overview>("/overview", "overview", query);
}
export async function loadHealth(query: Query) {
  return request<Health>("/health", "health", query);
}
export async function loadSessions(query: Query) {
  return request<SessionPage>("/sessions", "sessions", query);
}
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export async function loadDetail(
  installation: string,
  session: string,
  query: Query,
): Promise<Result<Detail>> {
  if (!uuid.test(installation) || !uuid.test(session))
    return {
      ok: false,
      error: "Choose a valid installation and session UUID.",
    };
  return request<Detail>(
    `/sessions/${installation}/${session}`,
    "detail",
    query,
  );
}
export async function loadEvents(
  installation: string,
  session: string,
  query: Query,
): Promise<Result<EventPage>> {
  if (!uuid.test(installation) || !uuid.test(session))
    return {
      ok: false,
      error: "Choose a valid installation and session UUID.",
    };
  return request<EventPage>(
    `/sessions/${installation}/${session}/events`,
    "events",
    query,
  );
}
