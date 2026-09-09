import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash } from "node:crypto";
export const sessionCookie = "stayzy_admin";
export const sessionLifetime = 8 * 60 * 60;
function secret() {
  const value = process.env.STAYZY_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error(
      "Admin sessions are unavailable. Configure a session secret of at least 32 characters.",
    );
  return createHash("sha256").update(value).digest();
}
export async function sealSession(token: string) {
  return new EncryptJWT({ token })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .setIssuer("stayzyweb")
    .setAudience("stayzy-admin")
    .encrypt(secret());
}
export async function openSession(value?: string) {
  if (!value) return null;
  try {
    const { payload } = await jwtDecrypt(value, secret(), {
      issuer: "stayzyweb",
      audience: "stayzy-admin",
      keyManagementAlgorithms: ["dir"],
      contentEncryptionAlgorithms: ["A256GCM"],
    });
    return typeof payload.token === "string" ? payload.token : null;
  } catch {
    return null;
  }
}
