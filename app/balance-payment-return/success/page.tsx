import { PaymentTopRedirect } from "@/components/fawaterak/PaymentTopRedirect";

export default function BalancePaymentSuccessPage() {
  return <PaymentTopRedirect target="/dashboard/add-balance?topup=success" />;
}
