import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createFawaterakDeposit, getUserById } from "@/lib/db";
import { FAWATERAK_DEPOSIT_KIND, FAWATERAK_MAX_AMOUNT, FAWATERAK_MIN_AMOUNT } from "@/lib/fawaterak/constants";
import {
  getAppBaseUrl,
  getFawaterakEnvType,
  getFawaterakPluginScriptUrl,
} from "@/lib/fawaterak/config";
import { buildCheckoutRequestBody } from "@/lib/fawaterak/payload";
import { formatFawaterakError } from "@/lib/fawaterak/format-error";
import { resolveCheckoutContext } from "@/lib/fawaterak/resolve-checkout";
import { getLocaleFromCookie } from "@/lib/i18n/server";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = (session.user as { role?: string }).role;
  if (role !== "STUDENT") {
    return NextResponse.json({ error: "Only students can top up balance" }, { status: 403 });
  }

  const userId = (session.user as { id?: string }).id;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { amount?: unknown; iframeDomain?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < FAWATERAK_MIN_AMOUNT || amount > FAWATERAK_MAX_AMOUNT) {
    return NextResponse.json(
      {
        error: `Amount must be between ${FAWATERAK_MIN_AMOUNT} and ${FAWATERAK_MAX_AMOUNT} EGP`,
      },
      { status: 400 },
    );
  }

  const user = await getUserById(userId);
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const clientIframeDomain =
    typeof body.iframeDomain === "string" ? body.iframeDomain.trim() : undefined;

  const resolved = await resolveCheckoutContext(clientIframeDomain);
  if (!resolved.ok) {
    return NextResponse.json(
      {
        error: formatFawaterakError(resolved.error.message, "Payment setup failed"),
        code: resolved.error.code,
        attempts: resolved.error.attempts,
      },
      { status: 400 },
    );
  }

  const deposit = await createFawaterakDeposit({
    userId,
    amount,
    kind: FAWATERAK_DEPOSIT_KIND.BALANCE_TOPUP,
  });

  const locale = await getLocaleFromCookie();
  let appOrigin: string;
  try {
    appOrigin = getAppBaseUrl();
  } catch {
    appOrigin = clientIframeDomain?.replace(/\/+$/, "") ?? resolved.data.iframeDomain;
  }

  const requestBody = buildCheckoutRequestBody({
    amount,
    locale,
    appOrigin,
    depositId: deposit.id,
    user,
    kind: FAWATERAK_DEPOSIT_KIND.BALANCE_TOPUP,
  });

  return NextResponse.json({
    token: resolved.data.vendorKey,
    envType: getFawaterakEnvType(),
    hashKey: resolved.data.hashKey,
    iframeDomain: resolved.data.iframeDomain,
    pluginScriptUrl: getFawaterakPluginScriptUrl(),
    style: { listing: "horizontal" },
    version: "0",
    redirectOutIframe: true,
    requestBody,
    depositId: deposit.id,
    devLocalhost: resolved.data.devLocalhost ?? false,
  });
}
