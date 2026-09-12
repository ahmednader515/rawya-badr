import { createHmac, timingSafeEqual } from "crypto";

export function computeIframeHashKey(vendorKey: string, domain: string, providerKey: string): string {
  const queryParam = `Domain=${domain}&ProviderKey=${providerKey}`;
  return createHmac("sha256", vendorKey).update(queryParam).digest("hex");
}

export function computePaidWebhookHashKey(
  vendorKey: string,
  invoiceId: number | string,
  invoiceKey: string,
  paymentMethod: string,
): string {
  const queryParam = `InvoiceId=${invoiceId}&InvoiceKey=${invoiceKey}&PaymentMethod=${paymentMethod}`;
  return createHmac("sha256", vendorKey).update(queryParam).digest("hex");
}

export function verifyHashKey(expected: string, received: string): boolean {
  if (!expected || !received) return false;
  try {
    const a = Buffer.from(expected, "utf8");
    const b = Buffer.from(received, "utf8");
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
