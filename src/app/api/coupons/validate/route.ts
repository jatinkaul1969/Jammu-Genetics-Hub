import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { validateCoupon } from "@/lib/coupons";

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ valid: false, error: "Please log in first." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const subtotal = Number(body?.subtotal);

  if (!code || !Number.isFinite(subtotal) || subtotal < 0) {
    return NextResponse.json({ valid: false, error: "Invalid request." }, { status: 400 });
  }

  const result = await validateCoupon(code, subtotal, user.id);
  return NextResponse.json(result);
}
