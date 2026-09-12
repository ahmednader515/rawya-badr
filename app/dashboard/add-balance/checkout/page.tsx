import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { FawaterakFullScreenCheckout } from "@/components/fawaterak/FawaterakFullScreenCheckout";
import { FAWATERAK_MAX_AMOUNT, FAWATERAK_MIN_AMOUNT } from "@/lib/fawaterak/constants";
import { getServerTranslator } from "@/lib/i18n/server";

const ABS = "dashboard.addBalanceStudent";

type CheckoutPageProps = {
  searchParams: Promise<{ amount?: string }>;
};

export default async function FawaterakCheckoutPage({ searchParams }: CheckoutPageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "STUDENT") redirect("/dashboard");

  const params = await searchParams;
  const amount = Number(params.amount);
  if (!Number.isFinite(amount) || amount < FAWATERAK_MIN_AMOUNT || amount > FAWATERAK_MAX_AMOUNT) {
    redirect("/dashboard/add-balance");
  }

  const t = await getServerTranslator();

  const labels = {
    title: t(`${ABS}.fawaterak.checkoutTitle`, "Complete payment"),
    amountLabel: t(`${ABS}.fawaterak.amountLabel`, "Amount"),
    payButton: t(`${ABS}.fawaterak.payButton`, "Pay with Fawaterak"),
    loading: t(`${ABS}.fawaterak.loading`, "Loading…"),
    backLink: t(`${ABS}.fawaterak.backToAddBalance`, "← Back to add balance"),
    errorGeneric: t(`${ABS}.fawaterak.errorGeneric`, "Could not start payment. Try again or use manual transfer."),
    localhostWarning: t(
      `${ABS}.fawaterak.localhostWarning`,
      "You are on localhost — checkout may not work here. Open the deployed Vercel site to complete payment.",
    ),
    preparing: t(`${ABS}.fawaterak.preparing`, "Preparing secure checkout…"),
  };

  return (
    <FawaterakFullScreenCheckout
      amount={amount}
      labels={labels}
      currencyShort={t("common.egyptianPoundShort", "EGP")}
      backHref="/dashboard/add-balance"
    />
  );
}
