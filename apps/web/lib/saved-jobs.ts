import { isExtraction, type Requirement, type JobFact } from "./job-requirements";
import { claimId } from "./claims";
export type SavedJobContent = { title: string; sourceUrl: string | null; sourceType: "PASTED_TEXT" | "NAV_API" | "GROQ_BROWSER_EXCERPT"; text: string; locale: "nb" | "en"; requirements: Requirement[]; facts: JobFact[]; omittedItems: number; retrievedAt: string | null };
export type SavedJob = { id: string; content: SavedJobContent; createdAt: string };
export function isSavedContent(value: unknown): value is SavedJobContent {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  let validUrl = c.sourceUrl === null;
  if (typeof c.sourceUrl === "string" && c.sourceUrl.length <= 2048) { try { const u = new URL(c.sourceUrl); validUrl = u.protocol === "https:" && !!u.hostname && !u.username && !u.password && !u.port; } catch {} }
  return typeof c.title === "string" && c.title.trim().length > 0 && c.title.length <= 200 && typeof c.text === "string" && c.text.trim().length >= 40 && c.text.length <= 15000 && ["nb", "en"].includes(String(c.locale)) && ["PASTED_TEXT", "NAV_API", "GROQ_BROWSER_EXCERPT"].includes(String(c.sourceType)) && validUrl && (c.retrievedAt === null || typeof c.retrievedAt === "string" && Number.isFinite(Date.parse(c.retrievedAt))) && (c.sourceType === "PASTED_TEXT" || c.sourceUrl !== null && c.retrievedAt !== null) && isExtraction(c);
}
export function isSavedJob(value: unknown): value is SavedJob { if (!value || typeof value !== "object") return false; const v = value as Record<string, unknown>; return typeof v.id === "string" && claimId.test(v.id) && typeof v.createdAt === "string" && Number.isFinite(Date.parse(v.createdAt)) && isSavedContent(v.content); }
export const isSavedJobs = (value: unknown): value is SavedJob[] => Array.isArray(value) && value.length <= 100 && value.every(isSavedJob);
export const savedJobErrors = {
 nb: { AUTH_REQUIRED: "Logg inn for å lagre stillinger.", ACCESS_DENIED: "Tilgangen ble avvist. Logg inn igjen.", PROFILE_NOT_CREATED: "Lagre profilen din først.", PROFILE_DISABLED: "Profil og lagring er ikke aktivert på backend.", SAVED_JOB_INVALID: "Stillingen kunne ikke lagres. Kontroller innholdet.", SAVED_JOB_NOT_FOUND: "Denne stillingen finnes ikke lenger.", SAVED_JOB_LIMIT: "Piloten kan lagre 100 stillingsversjoner. Slett en du ikke trenger.", SAVED_JOB_UNAVAILABLE: "Lagring er utilgjengelig. Prøv igjen." },
 en: { AUTH_REQUIRED: "Sign in to save jobs.", ACCESS_DENIED: "Access denied. Sign in again.", PROFILE_NOT_CREATED: "Save your profile first.", PROFILE_DISABLED: "Profile storage is not enabled on the backend.", SAVED_JOB_INVALID: "Could not save this job. Check its content.", SAVED_JOB_NOT_FOUND: "This job no longer exists.", SAVED_JOB_LIMIT: "The pilot stores up to 100 job snapshots. Remove one you no longer need.", SAVED_JOB_UNAVAILABLE: "Storage is unavailable. Try again." }
};
export function savedError(code: string, locale: "nb" | "en") { const t = savedJobErrors[locale]; return t[code as keyof typeof t] ?? t.SAVED_JOB_UNAVAILABLE; }
