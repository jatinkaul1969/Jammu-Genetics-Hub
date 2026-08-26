import { prisma } from "@/lib/prisma";
import { sendWhatsAppText, verifyWhatsAppSignature } from "@/lib/whatsapp-cloud";
import { aiConfigured, getAnthropicClient, CHAT_MODEL } from "@/lib/ai";
import { SYSTEM_PROMPT, findRelevantProducts, formatProductContext } from "@/lib/chat-context";
import { fallbackReply } from "@/lib/chat-fallback";

// Customer explicitly asking for a person, or a request the bot can't act
// on (cancel/reschedule) — either way, stop auto-replying and let an admin
// take over via /admin/whatsapp.
const HANDOFF_PATTERN =
  /(cancel|resched|talk to (a |an )?(human|agent|person|someone)|speak to (a |an )?(human|agent|person)|real person|customer care|complaint)/i;

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;
const requestLog = new Map<string, number[]>();

function isRateLimited(phone: string) {
  const now = Date.now();
  const timestamps = (requestLog.get(phone) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(phone, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

// Meta's webhook verification handshake — called once when you register the
// callback URL in the Meta app dashboard.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;

  if (expected && mode === "subscribe" && token === expected) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  if (!verifyWhatsAppSignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new Response("Invalid signature", { status: 403 });
  }

  const payload = JSON.parse(raw);
  const value = payload?.entry?.[0]?.changes?.[0]?.value;
  const message = value?.messages?.[0];

  // Delivery/read status callbacks (no `messages` key) and non-text message
  // types (image, audio, etc.) are ignored — always 200 so Meta doesn't retry.
  if (!message || message.type !== "text") {
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const phone: string = message.from;
  const text: string = message.text?.body ?? "";
  if (!text || isRateLimited(phone)) {
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const conversation = await prisma.whatsAppConversation.upsert({
    where: { phone },
    create: { phone },
    update: {},
  });

  await prisma.whatsAppMessage.create({
    data: { conversationId: conversation.id, direction: "IN", sender: "customer", body: text },
  });

  if (conversation.botPaused) {
    // A human already owns this conversation — don't reply on top of them.
    return new Response("EVENT_RECEIVED", { status: 200 });
  }

  const needsHandoff = HANDOFF_PATTERN.test(text);
  const products = await findRelevantProducts(text);

  let reply: string;
  try {
    if (!aiConfigured) {
      reply = fallbackReply(text, products);
    } else {
      const history = await prisma.whatsAppMessage.findMany({
        where: { conversationId: conversation.id },
        orderBy: { createdAt: "asc" },
        take: 20,
      });
      const client = getAnthropicClient();
      const result = await client.messages.create({
        model: CHAT_MODEL,
        max_tokens: 1024,
        system: SYSTEM_PROMPT + formatProductContext(products),
        messages: history.map((m) => ({
          role: m.direction === "IN" ? ("user" as const) : ("assistant" as const),
          content: m.body,
        })),
      });
      const textBlock = result.content.find((b) => b.type === "text");
      reply = textBlock && "text" in textBlock ? textBlock.text : fallbackReply(text, products);
    }
  } catch (err) {
    console.error("whatsapp bot reply error", err);
    reply = "Sorry, I hit an error just now — our team will follow up with you here shortly.";
  }

  if (needsHandoff) {
    reply += "\n\nI've flagged this for our team — they'll follow up with you here shortly.";
  }

  await prisma.whatsAppMessage.create({
    data: { conversationId: conversation.id, direction: "OUT", sender: "bot", body: reply },
  });

  if (needsHandoff) {
    await prisma.whatsAppConversation.update({ where: { id: conversation.id }, data: { botPaused: true } });
  }

  await sendWhatsAppText(phone, reply);

  return new Response("EVENT_RECEIVED", { status: 200 });
}
