import type { Locale } from "@/lib/i18n/types";
import type { User } from "@/lib/types";
import type { FawaterakDepositKindValue } from "./constants";
import { buildFawaterakCustomer } from "./customer";

export type FawaterakPayLoad = {
  depositId: string;
  userId: string;
  kind: FawaterakDepositKindValue;
};

export type FawaterakRequestBody = {
  cartTotal: string;
  currency: string;
  lang: string;
  customer: ReturnType<typeof buildFawaterakCustomer>;
  redirectionUrls: {
    successUrl: string;
    failUrl: string;
    pendingUrl: string;
    webhookUrl: string;
  };
  cartItems: Array<{ name: string; price: string; quantity: string }>;
  payLoad: FawaterakPayLoad;
};

export function buildCheckoutRequestBody(params: {
  amount: number;
  locale: Locale;
  appOrigin: string;
  depositId: string;
  user: User;
  kind: FawaterakDepositKindValue;
}): FawaterakRequestBody {
  const { amount, locale, appOrigin, depositId, user, kind } = params;
  const cartTotal = amount.toFixed(2);
  const origin = appOrigin.replace(/\/+$/, "");

  return {
    cartTotal,
    currency: "EGP",
    lang: locale === "ar" ? "ar" : "en",
    customer: buildFawaterakCustomer(user),
    redirectionUrls: {
      successUrl: `${origin}/balance-payment-return/success`,
      failUrl: `${origin}/balance-payment-return/fail`,
      pendingUrl: `${origin}/balance-payment-return/pending`,
      webhookUrl: `${origin}/api/webhooks/fawaterak_json`,
    },
    cartItems: [
      {
        name: locale === "ar" ? "إضافة رصيد" : "Balance top-up",
        price: cartTotal,
        quantity: "1",
      },
    ],
    payLoad: {
      depositId,
      userId: user.id,
      kind,
    },
  };
}

export function parsePayLoad(raw: unknown): FawaterakPayLoad | null {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (
    typeof o.depositId === "string" &&
    typeof o.userId === "string" &&
    typeof o.kind === "string"
  ) {
    return {
      depositId: o.depositId,
      userId: o.userId,
      kind: o.kind as FawaterakDepositKindValue,
    };
  }
  return null;
}
