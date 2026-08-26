import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { razorpayConfigured, createRazorpayOrder } from "@/lib/razorpay";

export async function POST(req: Request) {
  if (!razorpayConfigured) {
    return NextResponse.json({ error: "Online payment isn't set up yet." }, { status: 503 });
  }

  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const bookingCodes: string[] = Array.isArray(body?.bookingCodes) ? body.bookingCodes : [];
  if (bookingCodes.length === 0) {
    return NextResponse.json({ error: "No bookings specified." }, { status: 400 });
  }

  const bookings = await prisma.booking.findMany({
    where: { bookingCode: { in: bookingCodes }, userId: user.id },
  });
  if (bookings.length === 0) {
    return NextResponse.json({ error: "Bookings not found." }, { status: 404 });
  }
  if (bookings.some((b) => b.paymentStatus === "PAID")) {
    return NextResponse.json({ error: "One or more of these bookings is already paid." }, { status: 409 });
  }

  const amount = bookings.reduce((sum, b) => sum + b.totalAmount, 0);
  const order = await createRazorpayOrder(amount, bookingCodes.join("-").slice(0, 40));

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    keyId: process.env.RAZORPAY_KEY_ID,
    customerName: user.name,
    customerPhone: user.phone,
  });
}
