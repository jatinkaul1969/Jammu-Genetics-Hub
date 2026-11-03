import { createHmac, timingSafeEqual } from "crypto";

const GRAPH_VERSION = "v21.0";

// True once real Meta credentials are set — until then the webhook still
// receives and stores messages (useful for testing the flow end to end),
// it just can't actually send replies back out.
export const whatsappCloudConfigured = Boolean(
  process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID
);

export async function sendWhatsAppText(to: string, body: string) {
  if (!whatsappCloudConfigured) {
    console.warn("WhatsApp Cloud API not configured — skipping send to", to);
    return;
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: { body },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("WhatsApp send failed", res.status, errText);
  }
}

type OtpSendResult = { sent: boolean; error?: string };

// Sends the login OTP over WhatsApp using a pre-approved "Authentication"
// category template (WHATSAPP_OTP_TEMPLATE_NAME). Meta requires authentication
// templates to carry the code in both the message body and a copy-code button,
// so `code` is passed twice. Reuses the same Cloud API credentials as
// sendWhatsAppText (see whatsappCloudConfigured). Returns
// { sent: false, error: "no_provider_configured" } when nothing is wired up yet
// so the caller can fall back to dev mode; issueOtp() in src/lib/otp.ts is the
// only caller.
export async function sendOtpWhatsApp(to: string, code: string): Promise<OtpSendResult> {
  const templateName = process.env.WHATSAPP_OTP_TEMPLATE_NAME;
  if (!whatsappCloudConfigured || !templateName) {
    return { sent: false, error: "no_provider_configured" };
  }

  const templateLang = process.env.WHATSAPP_OTP_TEMPLATE_LANG ?? "en_US";
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: templateLang },
            components: [
              { type: "body", parameters: [{ type: "text", text: code }] },
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
      }
    );

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      const msg = data?.error?.message ?? `WhatsApp API responded ${res.status}`;
      return { sent: false, error: msg };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, error: err instanceof Error ? err.message : "network error" };
  }
}

// Sends a pre-approved message template with text variables ({{1}}, {{2}}…) in
// the body. Business-initiated messages outside WhatsApp's 24-hour window must
// be a template, so this is what every automatic follow-up uses. Returns true
// when Meta accepted the request. The template's language must match the one it
// was created with (set WHATSAPP_TEMPLATE_LANG if that isn't "en").
export async function sendWhatsAppTemplate(to: string, templateName: string, bodyParams: string[] = []): Promise<boolean> {
  if (!whatsappCloudConfigured) return false;
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: process.env.WHATSAPP_TEMPLATE_LANG ?? "en" },
          ...(bodyParams.length ? { components: [{ type: "body", parameters: bodyParams.map((text) => ({ type: "text", text })) }] } : {}),
        },
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) console.error("WhatsApp template send failed", templateName, res.status, (await res.text().catch(() => "")).slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error("WhatsApp template send error", templateName, err instanceof Error ? err.message : err);
    return false;
  }
}

// Meta signs every webhook POST with the app secret. If WHATSAPP_APP_SECRET
// isn't set yet (e.g. still setting up the Meta app), we allow requests
// through unverified so local testing isn't blocked — but this must be set
// before going live, or anyone could POST fake messages to the webhook.
export function verifyWhatsAppSignature(rawBody: string, signatureHeader: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!signatureHeader?.startsWith("sha256=")) return false;

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const provided = signatureHeader.slice("sha256=".length);

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(provided, "hex"));
  } catch {
    return false;
  }
}
