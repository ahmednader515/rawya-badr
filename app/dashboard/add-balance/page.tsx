import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getHomepageSettings } from "@/lib/db";
import { TopupStatusBanner, type TopupStatus } from "./TopupStatusBanner";
import { getLocaleFromCookie, getServerTranslator } from "@/lib/i18n/server";
import type { Locale } from "@/lib/i18n/types";
import { FawaterakPayLauncher } from "@/components/fawaterak/FawaterakPayLauncher";
import { FAWATERAK_MAX_AMOUNT, FAWATERAK_MIN_AMOUNT } from "@/lib/fawaterak/constants";

const ABS = "dashboard.addBalanceStudent";

type AddBalanceMsgKey = "title" | "subtitle";

const ADD_BALANCE_FALLBACK_EN: Record<AddBalanceMsgKey, string> = {
  title: "Add balance",
  subtitle: "Choose a payment method then follow the instructions",
};

function resolveAddBalanceCopy(
  locale: Locale,
  adminAr: string | null | undefined,
  adminEn: string | null | undefined,
  t: (key: string, fallback: string) => string,
  key: AddBalanceMsgKey,
): string {
  if (locale === "en") {
    const fromAdmin = (adminEn ?? "").trim();
    if (fromAdmin) return fromAdmin;
    return t(`${ABS}.${key}`, ADD_BALANCE_FALLBACK_EN[key]);
  }
  const fromAdmin = (adminAr ?? "").trim();
  if (fromAdmin) return fromAdmin;
  return t(`${ABS}.${key}`, ADD_BALANCE_FALLBACK_EN[key]);
}

function parseTopupStatus(raw: string | undefined): TopupStatus | null {
  if (raw === "success" || raw === "failed" || raw === "pending") return raw;
  return null;
}

type AddBalancePageProps = {
  searchParams: Promise<{ topup?: string }>;
};

export default async function AddBalancePage({ searchParams }: AddBalancePageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const params = await searchParams;
  const topupStatus = parseTopupStatus(params.topup);

  const [settings, locale, t] = await Promise.all([
    getHomepageSettings(),
    getLocaleFromCookie(),
    getServerTranslator(),
  ]);

  const pageTitle = resolveAddBalanceCopy(locale, settings.addBalanceTitle, settings.addBalanceTitleEn, t, "title");
  const pageSubtitle = resolveAddBalanceCopy(
    locale,
    settings.addBalanceSubtitle,
    settings.addBalanceSubtitleEn,
    t,
    "subtitle",
  );

  const fawaterakLabels = {
    amountLabel: t(`${ABS}.fawaterak.amountLabel`, "Amount"),
    amountPlaceholder: t(`${ABS}.fawaterak.amountPlaceholder`, "100"),
    continueButton: t(`${ABS}.fawaterak.continueButton`, "Continue to payment"),
    minMaxHint: t(
      `${ABS}.fawaterak.minMaxHint`,
      `Enter an amount between ${FAWATERAK_MIN_AMOUNT} and ${FAWATERAK_MAX_AMOUNT} EGP`,
    ),
  };

  const topupLabels = {
    successTitle: t(`${ABS}.topup.successTitle`, "Payment successful"),
    successBody: t(
      `${ABS}.topup.successBody`,
      "Your balance will be credited after the payment is confirmed. This may take a few minutes — refresh your dashboard if it does not appear right away.",
    ),
    failedTitle: t(`${ABS}.topup.failedTitle`, "Payment failed"),
    failedBody: t(
      `${ABS}.topup.failedBody`,
      "The payment did not complete. Try again or use manual transfer.",
    ),
    pendingTitle: t(`${ABS}.topup.pendingTitle`, "Payment pending"),
    pendingBody: t(
      `${ABS}.topup.pendingBody`,
      "Your payment is being processed. Balance will be added once confirmed.",
    ),
  };

  return (
    <div className="max-w-2xl">
      <Link
        href="/dashboard"
        className="text-sm font-medium text-[var(--color-primary)] hover:underline"
      >
        {t("dashboard.title", "Dashboard")} ←
      </Link>
      <h2 className="mt-6 text-2xl font-bold text-[var(--color-foreground)]">{pageTitle}</h2>
      <p className="mt-1 text-[var(--color-muted)]">{pageSubtitle}</p>

      {topupStatus ? <TopupStatusBanner status={topupStatus} labels={topupLabels} /> : null}

      <div className="mt-8">
        <FawaterakPayLauncher
          labels={fawaterakLabels}
          minAmount={FAWATERAK_MIN_AMOUNT}
          maxAmount={FAWATERAK_MAX_AMOUNT}
          currencyShort={t("common.egyptianPoundShort", "EGP")}
          checkoutPath="/dashboard/add-balance/checkout"
        />
      </div>
    </div>
  );
}
