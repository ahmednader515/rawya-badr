import { domainCandidates } from "./domain-candidates";
import { formatFawaterakError } from "./format-error";
import { browserHostAllowed, isLocalDevHost, normalizeIframeDomain } from "./iframe-domain";
import { validateFawaterakCredentials } from "./validate";
import { getConfiguredIframeDomain, getProviderKey, getVendorKey } from "./config";

export type ResolvedCheckout = {
  iframeDomain: string;
  hashKey: string;
  vendorKey: string;
  providerKey: string;
  devLocalhost?: boolean;
};

export type ResolveCheckoutError = {
  code: "DOMAIN_MISMATCH" | "VALIDATION_FAILED" | "NOT_CONFIGURED";
  message: string;
  attempts?: Array<{ domain: string; error: string }>;
};

export async function resolveCheckoutContext(clientIframeDomain?: string): Promise<
  | { ok: true; data: ResolvedCheckout }
  | { ok: false; error: ResolveCheckoutError }
> {
  let vendorKey: string;
  let providerKey: string;
  let configuredDomain: string;

  try {
    vendorKey = getVendorKey();
    providerKey = getProviderKey();
    configuredDomain = getConfiguredIframeDomain();
  } catch (err) {
    return {
      ok: false,
      error: {
        code: "NOT_CONFIGURED",
        message: formatFawaterakError(err, "Fawaterak not configured"),
      },
    };
  }

  const browserDomain = clientIframeDomain
    ? normalizeIframeDomain(clientIframeDomain)
    : configuredDomain;

  const devLocalhost =
    process.env.NODE_ENV === "development" &&
    !!browserDomain &&
    isLocalDevHost(browserDomain);

  if (
    browserDomain &&
    !devLocalhost &&
    !browserHostAllowed(browserDomain, configuredDomain)
  ) {
    return {
      ok: false,
      error: {
        code: "DOMAIN_MISMATCH",
        message: `This site is open at ${browserDomain} but payments are configured for ${configuredDomain}. Open the deployed site or update NEXT_PUBLIC_APP_URL.`,
      },
    };
  }

  const seed = devLocalhost ? configuredDomain : (browserDomain ?? configuredDomain);
  const candidates = domainCandidates(seed);
  const attempts: Array<{ domain: string; error: string }> = [];

  for (const domain of candidates) {
    const result = await validateFawaterakCredentials(vendorKey, providerKey, domain);
    if (result.ok) {
      return {
        ok: true,
        data: {
          iframeDomain: domain,
          hashKey: result.hashKey,
          vendorKey,
          providerKey,
          devLocalhost,
        },
      };
    }
    attempts.push({ domain, error: result.error });
  }

  const firstError = attempts[0]?.error ?? "Fawaterak credential validation failed";
  return {
    ok: false,
    error: {
      code: "VALIDATION_FAILED",
      message: formatFawaterakError(firstError, "Fawaterak credential validation failed"),
      attempts,
    },
  };
}
