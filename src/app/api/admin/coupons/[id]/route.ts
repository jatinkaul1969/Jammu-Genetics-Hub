import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { COUPON_AUDIENCES } from "@/lib/coupon-constants";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.description === "string" && body.description.trim()) data.description = body.description.trim();
  if (body.type === "PERCENT" || body.type === "FLAT") data.type = body.type;
  if (Number.isFinite(Number(body.value)) && Number(body.value) > 0) data.value = Number(body.value);
  if (body.maxDiscount === null || body.maxDiscount === "") data.maxDiscount = null;
  else if (Number.isFinite(Number(body.maxDiscount))) data.maxDiscount = Number(body.maxDiscount);
  if (Number.isFinite(Number(body.minOrderAmount))) data.minOrderAmount = Number(body.minOrderAmount);
  if (COUPON_AUDIENCES.some((a) => a.key === body.audience)) {
    data.audience = body.audience;
    data.firstOrderOnly = body.audience === "NEW_USER";
  }
  if (typeof body.active === "boolean") data.active = body.active;
  if (body.expiresAt === null || body.expiresAt === "") data.expiresAt = null;
  else if (typeof body.expiresAt === "string") data.expiresAt = new Date(body.expiresAt);

  if (data.type === "PERCENT" && typeof data.value === "number" && data.value > 100) {
    return NextResponse.json({ ok: false, error: "A percent coupon can't exceed 100." }, { status: 400 });
  }

  const coupon = await prisma.coupon.update({ where: { id }, data });
  return NextResponse.json({ ok: true, coupon });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
