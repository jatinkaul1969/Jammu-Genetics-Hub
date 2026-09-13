import { prisma } from "@/lib/prisma";
import { sendOtpWhatsApp } from "@/lib/whatsapp-cloud";

const OTP_TTL_MINUTES = 5;

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

type IssueOtpResult = {
  code: string;
  expiresAt: Date;
  devOtp: string | null;
  sendError: string | undefined;
};

export async function issueOtp(phone: string, purpose: string = "login"): Promise<IssueOtpResult> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await prisma.otpCode.create({
    data: { phone, code, purpose, expiresAt },
  });

  const result = await sendOtpWhatsApp(`91${phone}`, code);

  if (result.sent) {
    return { code, expiresAt, devOtp: null, sendError: undefined };
  }

  if (result.error === "no_provider_configured") {
    // No WhatsApp OTP template wired up yet — hand the code back to the client
    // to show on-screen instead of sending it (dev mode).
    return { code, expiresAt, devOtp: code, sendError: undefined };
  }

  // A provider is configured but the send failed — don't fall back to showing
  // the code, since that would leak it in a real deployment.
  return { code, expiresAt, devOtp: null, sendError: result.error };
}

export async function verifyOtp(phone: string, code: string, purpose: string = "login") {
  const otp = await prisma.otpCode.findFirst({
    where: { phone, code, purpose, consumed: false },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false as const, reason: "invalid" as const };
  if (otp.expiresAt.getTime() < Date.now()) {
    return { ok: false as const, reason: "expired" as const };
  }
  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumed: true } });
  return { ok: true as const };
}
