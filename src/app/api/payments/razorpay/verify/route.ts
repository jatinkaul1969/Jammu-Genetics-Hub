import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { verifyRazorpaySignature } from "@/lib/razorpay";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: false, error: "Please log in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const orderId = typeof body?.razorpay_order_id === "string" ? body.razorpay_order_id : "";
  const paymentId = typeof body?.razorpay_payment_id === "string" ? body.razorpay_payment_id : "";
  const signature = typeof body?.razorpay_signature === "string" ? body.razorpay_signature : "";
  const bookingCodes: string[] = Array.isArray(body?.bookingCodes) ? body.bookingCodes : [];

  if (!orderId || !paymentId || !signature || bookingCodes.length === 0) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  if (!verifyRazorpaySignature(orderId, paymentId, signature)) {
    return NextResponse.json({ ok: false, error: "Payment could not be verified." }, { status: 400 });
  }

  await prisma.booking.updateMany({
    where: { bookingCode: { in: bookingCodes }, userId: user.id },
    data: {
      paymentStatus: "PAID",
      paymentMethod: "razorpay",
      razorpayOrderId: orderId,
      razorpayPaymentId: paymentId,
    },
  });

  return NextResponse.json({ ok: true });
}
