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
