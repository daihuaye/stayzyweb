export type Administrator = {
  id: string;
  email: string;
  role: "owner" | "admin";
  active: boolean;
  must_change_password: boolean;
  created_at: string;
};
export type LoginResponse = {
  session_token: string;
  expires_at: string;
  account: Administrator;
};
export type FormState = { error: string; success?: string };
export function validAdministrator(value: unknown): value is Administrator {
  if (!value || typeof value !== "object") return false;
  const a = value as Administrator;
  return (
    typeof a.id === "string" &&
    typeof a.email === "string" &&
    ["owner", "admin"].includes(a.role) &&
    typeof a.active === "boolean" &&
    typeof a.must_change_password === "boolean"
  );
}
export function passwordError(value: unknown): string {
  return typeof value === "string" &&
    [...value].length >= 15 &&
    [...value].length <= 128
    ? ""
    : "Use a password with 15–128 characters. Spaces are welcome.";
}
