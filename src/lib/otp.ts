import { prisma } from "@/lib/prisma";
import { sendOtpSms, smsProviderConfigured } from "@/lib/sms";

const OTP_TTL_MINUTES = 5;

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

type IssueOtpResult = {
  code: string;
  expiresAt: Date;
  devOtp: string | null;
  smsError: string | undefined;
};

export async function issueOtp(phone: string, purpose: string = "login"): Promise<IssueOtpResult> {
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  await prisma.otpCode.create({
    data: { phone, code, purpose, expiresAt },
  });

  if (!smsProviderConfigured) {
    // Dev mode: no MSG91 credentials set, so the OTP is handed back to the
    // client to show on-screen instead of being texted.
    return { code, expiresAt, devOtp: code, smsError: undefined };
  }

  const result = await sendOtpSms(phone, code);
  if (!result.sent) {
    return { code, expiresAt, devOtp: null, smsError: result.error };
  }
  return { code, expiresAt, devOtp: null, smsError: undefined };
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
