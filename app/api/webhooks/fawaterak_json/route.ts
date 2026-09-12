import { NextResponse } from "next/server";
import { completeFawaterakDeposit } from "@/lib/db";
import { FAWATERAK_DEPOSIT_KIND } from "@/lib/fawaterak/constants";
import { getVendorKey } from "@/lib/fawaterak/config";
import { computePaidWebhookHashKey, verifyHashKey } from "@/lib/fawaterak/hmac";
import { parsePayLoad } from "@/lib/fawaterak/payload";

type WebhookBody = {
  hashKey?: string;
  invoice_id?: number | string;
  invoice_key?: string;
  payment_method?: string;
  invoice_status?: string;
  pay_load?: unknown;
  referenceNumber?: string;
};

export async function POST(request: Request) {
  let body: WebhookBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const status = String(body.invoice_status ?? "").toLowerCase();
  if (status !== "paid") {
    return NextResponse.json({ ok: true, ignored: true, reason: "not_paid" });
  }

  const invoiceId = body.invoice_id;
  const invoiceKey = body.invoice_key;
  const paymentMethod = body.payment_method;
  const receivedHash = body.hashKey;

  if (invoiceId == null || !invoiceKey || !paymentMethod || !receivedHash) {
    return NextResponse.json({ error: "Missing required webhook fields" }, { status: 400 });
  }

  let vendorKey: string;
  try {
    vendorKey = getVendorKey();
  } catch {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  const expectedHash = computePaidWebhookHashKey(
    vendorKey,
    invoiceId,
    invoiceKey,
    paymentMethod,
  );

  if (!verifyHashKey(expectedHash, receivedHash)) {
    return NextResponse.json({ error: "Invalid hashKey" }, { status: 403 });
  }

  const payLoad = parsePayLoad(body.pay_load);
  if (!payLoad) {
    return NextResponse.json({ error: "Invalid pay_load" }, { status: 400 });
  }

  if (payLoad.kind !== FAWATERAK_DEPOSIT_KIND.BALANCE_TOPUP) {
    return NextResponse.json({ error: "Unsupported deposit kind" }, { status: 400 });
  }

  const result = await completeFawaterakDeposit({
    depositId: payLoad.depositId,
    userId: payLoad.userId,
    kind: FAWATERAK_DEPOSIT_KIND.BALANCE_TOPUP,
    invoiceId: String(invoiceId),
    invoiceKey,
    referenceNumber: body.referenceNumber ?? null,
  });

  switch (result.status) {
    case "completed":
      return NextResponse.json({ ok: true, credited: true, depositId: result.deposit.id });
    case "already_completed":
      return NextResponse.json({ ok: true, credited: false, alreadyCompleted: true });
    case "invoice_conflict":
      return NextResponse.json(
        { error: "Invoice already used", existingDepositId: result.existingDepositId },
        { status: 409 },
      );
    case "not_found":
      return NextResponse.json({ error: "Deposit not found" }, { status: 404 });
    case "user_mismatch":
    case "kind_mismatch":
      return NextResponse.json({ error: "Payload mismatch" }, { status: 400 });
    default:
      return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
