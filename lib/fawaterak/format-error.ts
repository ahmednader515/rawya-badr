/** Coerce API / Fawaterak errors into a safe string for JSON responses and React. */
export function formatFawaterakError(value: unknown, fallback = "Unknown error"): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value instanceof Error && value.message.trim()) return value.message.trim();
  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;

    if (typeof record.message === "string" && record.message.trim()) {
      return record.message.trim();
    }
    if (record.message && typeof record.message === "object") {
      const flattened = flattenFieldErrors(record.message);
      if (flattened) return flattened;
    }

    const flattened = flattenFieldErrors(record);
    if (flattened) return flattened;

    if (typeof record.error === "string" && record.error.trim()) {
      return record.error.trim();
    }
    try {
      const serialized = JSON.stringify(value);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      /* ignore */
    }
  }
  return fallback;
}

function flattenFieldErrors(value: unknown): string {
  if (!value || typeof value !== "object") return "";
  const parts: string[] = [];
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (Array.isArray(val)) {
      const messages = val.filter((item) => typeof item === "string").join(", ");
      if (messages) parts.push(`${key}: ${messages}`);
    } else if (typeof val === "string" && val.trim()) {
      parts.push(`${key}: ${val}`);
    }
  }
  return parts.join("; ");
}
