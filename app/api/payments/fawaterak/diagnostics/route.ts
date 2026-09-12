import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { domainCandidates } from "@/lib/fawaterak/domain-candidates";
import {
  getAppBaseUrl,
  getConfiguredIframeDomain,
  getFawaterakEnv,
  getFawaterakOrigin,
  getFawaterakPluginScriptUrl,
  getProviderKey,
  getVendorKey,
} from "@/lib/fawaterak/config";
import { computeIframeHashKey } from "@/lib/fawaterak/hmac";
import { validateFawaterakCredentials } from "@/lib/fawaterak/validate";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domainParam = searchParams.get("domain")?.trim();

  let configuredDomain: string;
  let vendorKey: string;
  let providerKey: string;
  let appBaseUrl: string;

  try {
    configuredDomain = getConfiguredIframeDomain();
    vendorKey = getVendorKey();
    providerKey = getProviderKey();
    appBaseUrl = getAppBaseUrl();
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Not configured",
      },
      { status: 500 },
    );
  }

  const seed = domainParam || configuredDomain;
  const candidates = domainCandidates(seed);
  const results = [];

  for (const domain of candidates) {
    const hashKey = computeIframeHashKey(vendorKey, domain, providerKey);
    const validation = await validateFawaterakCredentials(vendorKey, providerKey, domain);
    results.push({
      domain,
      hashKeyPreview: `${hashKey.slice(0, 8)}…`,
      validation,
    });
  }

  const anyOk = results.some((r) => r.validation.ok);

  return NextResponse.json({
    ok: anyOk,
    env: getFawaterakEnv(),
    origin: getFawaterakOrigin(),
    pluginScriptUrl: getFawaterakPluginScriptUrl(),
    appBaseUrl,
    configuredIframeDomain: configuredDomain,
    testedDomains: results,
  });
}
