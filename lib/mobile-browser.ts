export const MOBILE_BLOCKED_PATH = "/mobile-blocked";

/** Paths that mobile users may access (blocked notice + static assets). */
export function isMobileBlockExemptPath(pathname: string): boolean {
  if (pathname === MOBILE_BLOCKED_PATH) return true;
  if (pathname.startsWith("/_next/")) return true;
  if (/\.(ico|png|jpg|jpeg|svg|webp|gif|woff2?|txt|xml)$/i.test(pathname)) return true;
  return false;
}

/**
 * Detect common mobile phone browsers from User-Agent.
 * Covers Safari, Chrome, Firefox, Edge, Opera, Samsung Internet, UC, etc. on iOS/Android.
 */
export function isMobilePhoneUserAgent(ua: string | null | undefined): boolean {
  if (!ua) return false;
  const s = ua;

  // Desktop browsers — never treat as phone
  if (/Windows NT|Macintosh|CrOS|X11; Linux x86/i.test(s) && !/iPhone|iPod|Android.*Mobile/i.test(s)) {
    return false;
  }

  const phonePatterns = [
    /iPhone/i,
    /iPod/i,
    /Android.*Mobile/i,
    /Mobile.*Android/i,
    /BlackBerry/i,
    /BB10/i,
    /Opera Mini/i,
    /IEMobile/i,
    /Windows Phone/i,
    /webOS/i,
    /Palm/i,
    /Symbian/i,
    /Kindle/i,
    /Silk\//i,
    /MiuiBrowser/i,
    /UCBrowser/i,
    /SamsungBrowser/i,
  ];

  if (phonePatterns.some((pattern) => pattern.test(s))) return true;

  // iOS in-app / alternate mobile browsers (Chrome CriOS, Firefox FxiOS, Edge EdgiOS, Opera OPiOS)
  if (/iPhone|iPod/i.test(s)) return true;
  if (/CriOS|FxiOS|EdgiOS|OPiOS|Mercury/i.test(s)) return true;

  return false;
}
