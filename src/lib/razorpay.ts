import { createHmac } from "crypto";

// Optional — leave RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET unset and checkout
// still works exactly as before (pay cash to the phlebotomist on
// collection). Set both to enable "Pay online now" on the confirmation
// page, via Razorpay's standard Checkout widget — that single integration
// covers cards, UPI, netbanking and wallets, since Razorpay's hosted
// checkout handles method selection itself rather than needing separate
// code per payment method.
export const razorpayConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

function authHeader() {
  const credentials = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString("base64");
  return `Basic ${credentials}`;
}

export async function createRazorpayOrder(amountInRupees: number, receipt: string) {
  const res = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: authHeader(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(amountInRupees * 100), // Razorpay amounts are in paise
      currency: "INR",
      receipt,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Razorpay order creation failed: ${res.status} ${text}`);
  }

  return res.json() as Promise<{ id: string; amount: number; currency: string }>;
}

// Razorpay's signature scheme for verifying a successful checkout payment:
// HMAC-SHA256("<order_id>|<payment_id>", key_secret) must equal the
// signature the client got back from Checkout — proves the payment wasn't
// forged client-side.
export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string) {
  const expected = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return expected === signature;
}
