export type Rule = {
  enabled: boolean;
  rolloutPercentage: number;
  allocationSalt: string;
};
export type RuleInput = Pick<Rule, "enabled" | "rolloutPercentage">;
export type NewRule = RuleInput & { key: string };
export type Configuration = { schemaVersion: 1; rules: Record<string, Rule> };
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string; uncertain?: boolean };
export function keyError(key: unknown) {
  return typeof key === "string" &&
    key === key.trim() &&
    /^[a-z][a-z0-9_]{0,79}$/.test(key)
    ? ""
    : "Use 1–80 lowercase letters, numbers, or underscores, starting with a letter.";
}
export function rolloutError(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 100
    ? ""
    : "Enter a whole number between 0 and 100.";
}
export function validRule(value: unknown): value is Rule {
  if (!value || typeof value !== "object") return false;
  const r = value as Rule;
  return (
    typeof r.enabled === "boolean" &&
    !rolloutError(r.rolloutPercentage) &&
    typeof r.allocationSalt === "string" &&
    r.allocationSalt.length > 0 &&
    r.allocationSalt.length <= 80
  );
}
export function validConfiguration(value: unknown): value is Configuration {
  if (!value || typeof value !== "object") return false;
  const c = value as Configuration;
  return (
    c.schemaVersion === 1 &&
    !!c.rules &&
    typeof c.rules === "object" &&
    !Array.isArray(c.rules) &&
    Object.entries(c.rules).every(
      ([key, rule]) => !keyError(key) && validRule(rule),
    )
  );
}
export const clientNotice =
  "The key must be registered and checked in the app. Older clients ignore unknown keys. Updates apply after the app refreshes; ongoing sessions keep their saved configuration.";
