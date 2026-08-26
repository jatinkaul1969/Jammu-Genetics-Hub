import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getEligibleAutoCoupon } from "@/lib/coupons";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ coupon: null });

  const subtotal = Number(new URL(req.url).searchParams.get("subtotal") ?? 0);
  const coupon = await getEligibleAutoCoupon(user.id, Number.isFinite(subtotal) ? subtotal : 0);
  return NextResponse.json({ coupon });
}
