import { PaymentTopRedirect } from "@/components/fawaterak/PaymentTopRedirect";

export default function BalancePaymentPendingPage() {
  return <PaymentTopRedirect target="/dashboard/add-balance?topup=pending" />;
}
