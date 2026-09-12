import { normalizeIframeDomain, parseHostname } from "./iframe-domain";

/** Generate www + apex domain variants for Fawaterak credential validation. */
export function domainCandidates(input: string): string[] {
  const normalized = normalizeIframeDomain(input);
  if (!normalized) return [];
  const host = parseHostname(normalized);
  if (!host) return [normalized];

  const out = new Set<string>();
  out.add(normalized);

  if (host.startsWith("www.")) {
    out.add(`https://${host.slice(4)}`);
  } else {
    out.add(`https://www.${host}`);
  }

  return [...out];
}
