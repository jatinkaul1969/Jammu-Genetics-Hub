import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { COUPON_AUDIENCES } from "@/lib/coupon-constants";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const type = body?.type === "FLAT" ? "FLAT" : "PERCENT";
  const value = Number(body?.value);
  const maxDiscount =
    type === "PERCENT" && body?.maxDiscount !== "" && body?.maxDiscount != null ? Number(body.maxDiscount) : null;
  const minOrderAmount = Number(body?.minOrderAmount) || 0;
  const audience = COUPON_AUDIENCES.some((a) => a.key === body?.audience) ? body.audience : "ALL";
  const expiresAt = typeof body?.expiresAt === "string" && body.expiresAt ? new Date(body.expiresAt) : null;

  if (!/^[A-Z0-9_-]{3,20}$/.test(code) || !description || !Number.isFinite(value) || value <= 0) {
    return NextResponse.json(
      { ok: false, error: "Code must be 3-20 chars (letters/numbers/_/-); description and a positive value are required." },
      { status: 400 }
    );
  }
  if (type === "PERCENT" && value > 100) {
    return NextResponse.json({ ok: false, error: "A percent coupon can't exceed 100." }, { status: 400 });
  }

  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "A coupon with that code already exists." }, { status: 409 });
  }

  const coupon = await prisma.coupon.create({
    data: {
      code,
      description,
      type,
      value,
      maxDiscount,
      minOrderAmount,
      audience,
      firstOrderOnly: audience === "NEW_USER",
      expiresAt,
    },
  });

  return NextResponse.json({ ok: true, coupon });
}
