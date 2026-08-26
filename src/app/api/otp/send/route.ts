import { NextResponse } from "next/server";
import { issueOtp } from "@/lib/otp";
import { prisma } from "@/lib/prisma";

const PHONE_RE = /^[6-9]\d{9}$/;
const RATE_LIMIT_WINDOW_MIN = 10;
const RATE_LIMIT_MAX = 5;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";

  if (!PHONE_RE.test(phone)) {
    return NextResponse.json(
      { ok: false, error: "Enter a valid 10-digit Indian mobile number." },
      { status: 400 }
    );
  }

  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MIN * 60 * 1000);
  const recentCount = await prisma.otpCode.count({
    where: { phone, purpose: "login", createdAt: { gte: since } },
  });
  if (recentCount >= RATE_LIMIT_MAX) {
    return NextResponse.json(
      { ok: false, error: "Too many OTP requests. Please try again in a few minutes." },
      { status: 429 }
    );
  }

  const { devOtp, expiresAt, smsError } = await issueOtp(phone, "login");

  if (!devOtp && smsError) {
    // A provider is configured but the send failed — don't silently fall
    // back to showing the code, since that would leak it in a real deployment.
    return NextResponse.json(
      { ok: false, error: "Could not send the SMS right now. Please try again shortly." },
      { status: 502 }
    );
  }

  // devOtp is only present when no SMS gateway is configured — dev mode.
  return NextResponse.json({ ok: true, devOtp, expiresAt });
}
