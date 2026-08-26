import { aiConfigured, getAnthropicClient, CHAT_MODEL } from "@/lib/ai";
import { SYSTEM_PROMPT, findRelevantProducts, formatProductContext } from "@/lib/chat-context";
import { fallbackReply } from "@/lib/chat-fallback";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 15;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 1000;

// In-memory sliding-window limiter, keyed by IP. Fine for a single dev/small
// deployment; swap for a shared store (e.g. Redis) behind a load balancer.
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

type ChatMessage = { role: "user" | "assistant"; content: string };

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return new Response("You're sending messages a bit fast — please wait a moment and try again.", {
      status: 429,
    });
  }

  const body = await req.json().catch(() => null);
  const messages: ChatMessage[] = Array.isArray(body?.messages) ? body.messages : [];

  if (
    messages.length === 0 ||
    messages.length > MAX_MESSAGES ||
    messages.some(
      (m) =>
        (m.role !== "user" && m.role !== "assistant") ||
        typeof m.content !== "string" ||
        m.content.length === 0 ||
        m.content.length > MAX_MESSAGE_LENGTH
    )
  ) {
    return new Response("Invalid request.", { status: 400 });
  }

  const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const products = await findRelevantProducts(lastUserMessage);

  // Handed back as a header (base64 JSON — keeps header values ASCII-safe)
  // so the widget can render clickable "View & book" chips under the reply,
  // regardless of which path (fallback or AI) answered.
  const productChips = products.slice(0, 3).map((p) => {
    const own = p.prices.find((pr) => pr.lab.isOwn);
    const price = own?.price ?? p.prices[0]?.price ?? null;
    return { slug: p.slug, name: p.name, price };
  });
  const chipsHeader = Buffer.from(JSON.stringify(productChips)).toString("base64");

  if (!aiConfigured) {
    const reply = fallbackReply(lastUserMessage, products);
    return new Response(reply, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Products": chipsHeader },
    });
  }

  const client = getAnthropicClient();
  const productContext = formatProductContext(products);

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      try {
        const anthropicStream = client.messages.stream({
          model: CHAT_MODEL,
          max_tokens: 1024,
          system: SYSTEM_PROMPT + productContext,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        });

        anthropicStream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await anthropicStream.finalMessage();
        controller.close();
      } catch (err) {
        controller.enqueue(
          encoder.encode("\n\nSorry, I hit an error answering that — please try again in a moment.")
        );
        controller.close();
        console.error("chat stream error", err);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Chat-Products": chipsHeader },
  });
}
