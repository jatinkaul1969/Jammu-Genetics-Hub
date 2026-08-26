const MSG91_AUTH_KEY = process.env.MSG91_AUTH_KEY;
const MSG91_TEMPLATE_ID = process.env.MSG91_OTP_TEMPLATE_ID;
const MSG91_SENDER_ID = process.env.MSG91_SENDER_ID ?? "JGHLAB";

export const smsProviderConfigured = Boolean(MSG91_AUTH_KEY && MSG91_TEMPLATE_ID);

type SendResult = { sent: boolean; error?: string };

// Sends the OTP over real SMS via MSG91's OTP API when credentials are
// configured (MSG91_AUTH_KEY + MSG91_OTP_TEMPLATE_ID env vars). Falls back to
// a no-op (dev mode: the OTP is shown on-screen instead) when they aren't —
// see issueOtp() in src/lib/otp.ts, which is the only caller.
export async function sendOtpSms(phone: string, code: string): Promise<SendResult> {
  if (!smsProviderConfigured) {
    return { sent: false, error: "no_provider_configured" };
  }

  try {
    const url = new URL("https://control.msg91.com/api/v5/otp");
    url.searchParams.set("template_id", MSG91_TEMPLATE_ID!);
    url.searchParams.set("mobile", `91${phone}`);
    url.searchParams.set("authkey", MSG91_AUTH_KEY!);
    url.searchParams.set("otp", code);
    url.searchParams.set("sender", MSG91_SENDER_ID);

    const res = await fetch(url.toString(), { method: "POST" });
    const data = await res.json().catch(() => null);

    if (!res.ok || data?.type === "error") {
      return { sent: false, error: data?.message ?? `MSG91 responded ${res.status}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "network error" };
  }
}
