export type CourseCertKind = "ceu" | "pdu";
export type CourseCreditCategory = "general" | "ethics" | "supervision";

export const COURSE_CERT_KINDS: CourseCertKind[] = ["ceu", "pdu"];
export const COURSE_CREDIT_CATEGORIES: CourseCreditCategory[] = [
  "general",
  "ethics",
  "supervision",
];

export function parseCourseCertKind(value: unknown): CourseCertKind | null {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (v === "ceu" || v === "pdu") return v;
  return null;
}

export function parseCourseCreditCategory(value: unknown): CourseCreditCategory | null {
  const v = String(value ?? "")
    .trim()
    .toLowerCase();
  if (v === "general" || v === "ethics" || v === "supervision") return v;
  return null;
}

/** Accepts 0, 1, 1.5, 2, etc. (0–999.9, one decimal). */
export function parseCourseCreditPoints(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.min(999.9, Math.round(n * 10) / 10);
}

export function formatCoursePublicCode(seq: number): string {
  return `rb-${String(Math.max(1, Math.floor(seq))).padStart(3, "0")}`;
}

export function parseCoursePublicCodeSeq(code: string | null | undefined): number | null {
  if (!code) return null;
  const m = /^rb-(\d+)$/i.exec(String(code).trim());
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

export function formatCertKindLabel(kind: CourseCertKind | null | undefined): string {
  if (!kind) return "";
  return kind.toUpperCase();
}

export function formatCreditCategoryLabel(
  category: CourseCreditCategory | null | undefined,
): string {
  if (!category) return "";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

export function formatCreditPointsLabel(points: number | null | undefined): string {
  if (points == null || !Number.isFinite(points)) return "";
  return Number.isInteger(points) ? String(points) : points.toFixed(1);
}
