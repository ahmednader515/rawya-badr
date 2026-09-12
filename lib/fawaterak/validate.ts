import { getFawaterakValidateUrl } from "./config";
import { formatFawaterakError } from "./format-error";
import { computeIframeHashKey } from "./hmac";

export type ValidateResult =
  | { ok: true; domain: string; hashKey: string }
  | { ok: false; domain: string; error: string; status?: number };

function extractApiError(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const fromMessage = formatFawaterakError(record.message, "");
    if (fromMessage) return fromMessage;
    const fromBody = formatFawaterakError(body, "");
    if (fromBody) return fromBody;
  }
  return `Fawaterak validate failed (${status})`;
}

export async function validateFawaterakCredentials(
  vendorKey: string,
  providerKey: string,
  domain: string,
): Promise<ValidateResult> {
  const hashKey = computeIframeHashKey(vendorKey, domain, providerKey);
  const url = getFawaterakValidateUrl();

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${vendorKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "FAWATERAK-HASH-KEY": hashKey,
        "FAWATERAK-DOMAIN": domain,
        "DOMAIN-VERSION": "0",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      let detail = "";
      try {
        detail = extractApiError(await res.json(), res.status);
      } catch {
        detail = `Fawaterak validate failed (${res.status})`;
      }
      return {
        ok: false,
        domain,
        status: res.status,
        error: detail,
      };
    }

    return { ok: true, domain, hashKey };
  } catch (err) {
    return {
      ok: false,
      domain,
      error: formatFawaterakError(err, "Network error"),
    };
  }
}
