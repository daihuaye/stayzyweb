import { EncryptJWT, jwtDecrypt } from "jose";
import { createHash } from "node:crypto";
export const sessionCookie = "stayzy_admin_v2";
export const sessionLifetime = 8 * 60 * 60;
function secret() {
  const value = process.env.STAYZY_SESSION_SECRET;
  if (!value || value.length < 32)
    throw new Error(
      "Admin sessions are unavailable. Configure a session secret of at least 32 characters.",
    );
  return createHash("sha256").update(value).digest();
}
export async function sealSession(
  token: string,
  expiresAt = new Date(Date.now() + sessionLifetime * 1000).toISOString(),
) {
  return new EncryptJWT({ token, version: 2 })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(
      Math.min(
        Math.floor(new Date(expiresAt).getTime() / 1000),
        Math.floor(Date.now() / 1000) + sessionLifetime,
      ),
    )
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
    return payload.version === 2 && typeof payload.token === "string"
      ? payload.token
      : null;
  } catch {
    return null;
  }
}
