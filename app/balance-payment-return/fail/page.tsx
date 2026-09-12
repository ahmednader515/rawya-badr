import { PaymentTopRedirect } from "@/components/fawaterak/PaymentTopRedirect";

export default function BalancePaymentFailPage() {
  return <PaymentTopRedirect target="/dashboard/add-balance?topup=failed" />;
}
