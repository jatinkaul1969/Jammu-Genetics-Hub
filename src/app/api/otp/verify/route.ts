import { NextResponse } from "next/server";
import { verifyOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";
import { isMembershipActive } from "@/lib/collection-slots";

const PHONE_RE = /^[6-9]\d{9}$/;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const code = typeof body?.code === "string" ? body.code.trim() : "";
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const age = Number(body?.age);

  if (!PHONE_RE.test(phone) || code.length !== 6) {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { phone } });

  if (!existing) {
    if (!name || name.length < 2 || !Number.isFinite(age) || age < 1 || age > 120) {
      return NextResponse.json(
        { ok: false, error: "Enter your name and a valid age to create your account." },
        { status: 400 }
      );
    }
  }

  const result = await verifyOtp(phone, code, "login");
  if (!result.ok) {
    const message = result.reason === "expired" ? "That OTP has expired. Request a new one." : "Incorrect OTP.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const user = existing
    ? existing
    : await prisma.user.create({ data: { phone, name, age } });

  await createSession(user.id);

  return NextResponse.json({
    ok: true,
    user: { name: user.name, phone: user.phone, age: user.age, membershipActive: isMembershipActive(user) },
  });
}
