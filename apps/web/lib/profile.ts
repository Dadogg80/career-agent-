export type SessionView = { authenticated: boolean; loginAvailable: boolean; profilesAvailable: boolean; csrfToken: string };
export type CareerProfile = { id: string; displayName: string; preferredLanguage: "nb" | "en"; revision: number };
export function isSession(value: unknown): value is SessionView {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.authenticated === "boolean" && typeof v.loginAvailable === "boolean" && typeof v.profilesAvailable === "boolean" && typeof v.csrfToken === "string" && v.csrfToken.length > 0 && v.csrfToken.length <= 512;
}
export function isProfile(value: unknown): value is CareerProfile {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.id === "string" && /^[a-f0-9-]{36}$/.test(v.id) && typeof v.displayName === "string" && v.displayName.trim().length > 0 && v.displayName.length <= 200 && ["nb", "en"].includes(String(v.preferredLanguage)) && typeof v.revision === "number" && Number.isSafeInteger(v.revision) && v.revision >= 1;
}
