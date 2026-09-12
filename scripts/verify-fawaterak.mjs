#!/usr/bin/env node
/**
 * Verify Fawaterak iframe credentials against getPaymentmethods API.
 * Usage: node scripts/verify-fawaterak.mjs [https://your-domain.com]
 */
import { createHmac } from "crypto";
import "dotenv/config";

const env = (process.env.FAWATERAK_ENV ?? "staging").trim().toLowerCase() === "live" ? "live" : "staging";
const origin = env === "live" ? "https://app.fawaterk.com" : "https://staging.fawaterk.com";
const vendorKey =
  process.env.FAWATERAK_VENDOR_KEY?.trim() ||
  process.env.FAWATERAK_API_KEY?.trim() ||
  "";
const providerKey = process.env.FAWATERAK_PROVIDER_KEY?.trim() || "";
const configuredDomain = (
  process.argv[2]?.trim() ||
  process.env.FAWATERAK_IFRAME_DOMAIN?.trim() ||
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  process.env.NEXTAUTH_URL?.trim() ||
  ""
).replace(/\/+$/, "");

function computeHash(domain) {
  const queryParam = `Domain=${domain}&ProviderKey=${providerKey}`;
  return createHmac("sha256", vendorKey).update(queryParam).digest("hex");
}

function domainCandidates(input) {
  let host;
  try {
    const url = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return [];
  }
  const base = `https://${host}`;
  const out = new Set([base]);
  if (host.startsWith("www.")) out.add(`https://${host.slice(4)}`);
  else out.add(`https://www.${host}`);
  return [...out];
}

async function validate(domain) {
  const hashKey = computeHash(domain);
  const res = await fetch(`${origin}/api/v2/getPaymentmethods`, {
    headers: {
      Authorization: `Bearer ${vendorKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      "FAWATERAK-HASH-KEY": hashKey,
      "FAWATERAK-DOMAIN": domain,
      "DOMAIN-VERSION": "0",
    },
  });
  let body = "";
  try {
    body = JSON.stringify(await res.json());
  } catch {
    body = await res.text();
  }
  return { domain, status: res.status, ok: res.ok, hashKeyPreview: `${hashKey.slice(0, 12)}…`, body: body.slice(0, 200) };
}

async function main() {
  console.log(`Fawaterak env: ${env}`);
  console.log(`Origin: ${origin}`);

  if (!vendorKey || !providerKey) {
    console.error("Missing FAWATERAK_VENDOR_KEY or FAWATERAK_PROVIDER_KEY");
    process.exit(1);
  }
  if (!configuredDomain) {
    console.error("Pass domain as argv[2] or set NEXT_PUBLIC_APP_URL / FAWATERAK_IFRAME_DOMAIN");
    process.exit(1);
  }

  const candidates = domainCandidates(configuredDomain);
  if (candidates.length === 0) {
    console.error("Invalid domain:", configuredDomain);
    process.exit(1);
  }

  let anyOk = false;
  for (const domain of candidates) {
    const result = await validate(domain);
    console.log(result);
    if (result.ok) anyOk = true;
  }

  process.exit(anyOk ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
