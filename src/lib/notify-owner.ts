// Instant alerts to the owner, so a new enquiry, booking or WhatsApp chat never
// sits unnoticed. Each channel switches on only when its settings exist:
//   • Telegram: TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (the fastest — a phone push)
//   • Email via Resend: RESEND_API_KEY + OWNER_ALERT_EMAIL (+ optional ALERT_FROM_EMAIL)
// A failure here is logged and swallowed — an alert problem must never break the
// customer's own request. Call it from `after()` so it runs once the response is sent.

export type OwnerAlert = { title: string; lines: (string | null | undefined | false)[] };

const TIMEOUT_MS = 6000;

async function post(label: string, url: string, body: unknown, headers: Record<string, string> = {}) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) console.error(`owner alert (${label}) failed`, res.status, (await res.text().catch(() => "")).slice(0, 200));
  } catch (err) {
    console.error(`owner alert (${label}) error`, err instanceof Error ? err.message : err);
  }
}

export function ownerAlertChannels() {
  return {
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID),
    email: Boolean(process.env.RESEND_API_KEY && process.env.OWNER_ALERT_EMAIL),
  };
}

export async function notifyOwner(alert: OwnerAlert): Promise<void> {
  const body = alert.lines.filter(Boolean).join("\n");
  const jobs: Promise<void>[] = [];

  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (token && chat) {
    jobs.push(post("telegram", `https://api.telegram.org/bot${token}/sendMessage`, { chat_id: chat, text: `${alert.title}\n${body}`, disable_web_page_preview: true }));
  }

  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.OWNER_ALERT_EMAIL;
  if (resendKey && to) {
    jobs.push(
      post(
        "email",
        "https://api.resend.com/emails",
        { from: process.env.ALERT_FROM_EMAIL || "JGH Alerts <onboarding@resend.dev>", to: [to], subject: alert.title, text: body },
        { Authorization: `Bearer ${resendKey}` }
      )
    );
  }

  await Promise.all(jobs);
}
