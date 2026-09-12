/** Strip protocol/trailing slash; return hostname only (lowercase). */
export function parseHostname(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return null;
  }
}

/** Normalize to https://hostname (no path, no trailing slash). */
export function normalizeIframeDomain(input: string): string | null {
  const host = parseHostname(input);
  if (!host) return null;
  return `https://${host}`;
}

/** Treat www.example.com and example.com as equivalent. */
export function hostnamesMatch(a: string, b: string): boolean {
  const ha = parseHostname(a);
  const hb = parseHostname(b);
  if (!ha || !hb) return false;
  const stripWww = (h: string) => (h.startsWith("www.") ? h.slice(4) : h);
  return stripWww(ha) === stripWww(hb);
}

export function browserHostAllowed(browserDomain: string, configuredDomain: string): boolean {
  return hostnamesMatch(browserDomain, configuredDomain);
}

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function isLocalDevHost(input: string): boolean {
  const host = parseHostname(input);
  return host != null && LOCAL_HOSTS.has(host);
}
