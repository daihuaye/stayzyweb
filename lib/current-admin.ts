import { cache } from "react";
import { cookies } from "next/headers";
import { adminRequest } from "./api";
import { openSession, sessionCookie } from "./session";
import { validAdministrator, type Administrator } from "./admin-auth";
import type { Result } from "./experiments";
export const currentAdmin = cache(async (): Promise<Result<Administrator>> => {
  const token = await openSession((await cookies()).get(sessionCookie)?.value);
  if (!token)
    return { ok: false, error: "Please sign in.", code: "unauthorized" };
  const result = await adminRequest<Administrator>(token, "/auth/me");
  if (result.ok && !validAdministrator(result.data))
    return {
      ok: false,
      error: "The backend returned an unsupported account response.",
    };
  return result;
});
