import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getVisibleCouponsForUser } from "@/lib/coupons";

export async function GET(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ coupons: [] });

  const subtotal = Number(new URL(req.url).searchParams.get("subtotal") ?? 0);
  const coupons = await getVisibleCouponsForUser(user.id, Number.isFinite(subtotal) ? subtotal : 0);
  return NextResponse.json({ coupons });
}
