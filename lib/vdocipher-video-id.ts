const VDOCIPHER_PREFIX = "vdocipher:";

/** Normalize stored lesson video_url into a VdoCipher video ID, or null if empty. */
export function normalizeVdoCipherVideoId(value: string | null | undefined): string | null {
  const trimmed = String(value ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.toLowerCase().startsWith(VDOCIPHER_PREFIX)) {
    const id = trimmed.slice(VDOCIPHER_PREFIX.length).trim();
    return id || null;
  }
  return trimmed;
}

/** Prepare value for storage in lesson video_url. */
export function formatVdoCipherVideoId(videoId: string): string {
  return normalizeVdoCipherVideoId(videoId) ?? videoId.trim();
}
