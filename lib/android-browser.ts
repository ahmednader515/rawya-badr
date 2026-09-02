const ZEN_PLAYER_PACKAGE = "com.vdocipher.zenplayer";

export const ZEN_PLAYER_PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ZEN_PLAYER_PACKAGE}`;

/** True for Android phones (excludes most desktop user agents). */
export function isAndroidMobileUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  return /Android/i.test(ua) && /Mobile/i.test(ua);
}

/** Use on the client after mount. */
export function isAndroidMobileClient(): boolean {
  if (typeof navigator === "undefined") return false;
  return isAndroidMobileUserAgent(navigator.userAgent);
}
