export type FawaterakEnv = "staging" | "live";

export function getFawaterakEnv(): FawaterakEnv {
  const raw = (process.env.FAWATERAK_ENV ?? "staging").trim().toLowerCase();
  return raw === "live" ? "live" : "staging";
}

export function getFawaterakOrigin(): string {
  return getFawaterakEnv() === "live"
    ? "https://app.fawaterk.com"
    : "https://staging.fawaterk.com";
}

export function getFawaterakPluginScriptUrl(): string {
  return `${getFawaterakOrigin()}/fawaterkPlugin/fawaterkPlugin.min.js`;
}

export function getFawaterakValidateUrl(): string {
  return `${getFawaterakOrigin()}/api/v2/getPaymentmethods`;
}

export function getFawaterakEnvType(): "test" | "live" {
  return getFawaterakEnv() === "live" ? "live" : "test";
}

export function getVendorKey(): string {
  const key =
    process.env.FAWATERAK_VENDOR_KEY?.trim() ||
    process.env.FAWATERAK_API_KEY?.trim() ||
    "";
  if (!key) throw new Error("FAWATERAK_VENDOR_KEY is not configured");
  return key;
}

export function getProviderKey(): string {
  const key = process.env.FAWATERAK_PROVIDER_KEY?.trim() || "";
  if (!key) throw new Error("FAWATERAK_PROVIDER_KEY is not configured");
  return key;
}

export function getAppBaseUrl(): string {
  const url =
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.NEXTAUTH_URL?.trim() ||
    "";
  if (!url) throw new Error("NEXT_PUBLIC_APP_URL is not configured");
  return url.replace(/\/+$/, "");
}

export function getConfiguredIframeDomain(): string {
  const override = process.env.FAWATERAK_IFRAME_DOMAIN?.trim();
  if (override) return override.replace(/\/+$/, "");
  return getAppBaseUrl();
}
