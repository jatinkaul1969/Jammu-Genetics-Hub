"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { MessageCircle, X, Send, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { formatInr } from "@/lib/format";
import { buildWhatsAppLink, WHATSAPP_GREETING } from "@/lib/contact";

type ProductChip = { slug: string; name: string; price: number | null };
type ChatMessage = { role: "user" | "assistant"; content: string; products?: ProductChip[] };

const QUICK_QUESTIONS = [
  "How does home collection work?",
  "How do I download my report?",
  "What's the price of a Full Body Checkup?",
];

function decodeProducts(header: string | null): ProductChip[] {
  if (!header) return [];
  try {
    return JSON.parse(atob(header));
  } catch {
    return [];
  }
}

export function ChatWidget() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: "Hi! I'm the Jammu Genetics Hub assistant. Ask me about test prices, home collection, booking, or your reports." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  if (pathname?.startsWith("/admin")) return null;

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: trimmed }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })).slice(-20) }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => "Something went wrong.");
        setError(text || "Something went wrong.");
        setLoading(false);
        return;
      }

      const products = decodeProducts(res.headers.get("X-Chat-Products"));
      setMessages((m) => [...m, { role: "assistant", content: "", products }]);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc, products };
          return copy;
        });
      }
    } catch {
      setError("Couldn't reach the assistant — check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function goToProduct(slug: string) {
    setOpen(false);
    router.push(`/product/${slug}`);
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-4 z-40 flex h-[32rem] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl sm:right-6">
          <div className="flex items-center justify-between border-b border-border bg-brand px-4 py-3">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={17} />
              <div>
                <p className="text-sm font-semibold leading-tight">JGH Assistant</p>
                <p className="text-[11px] leading-tight text-white/80">Usually replies instantly</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white" aria-label="Close chat">
              <X size={18} />
            </button>
          </div>

          <a
            href={buildWhatsAppLink(WHATSAPP_GREETING)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 border-b border-border bg-[#25D366]/10 py-2 text-xs font-medium text-[#128C7E] hover:bg-[#25D366]/20"
          >
            <WhatsAppIcon size={14} /> Prefer WhatsApp? Chat with our team there instead
          </a>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user" ? "bg-brand text-white" : "bg-surface-muted text-ink"
                  }`}
                >
                  {m.content || (loading && i === messages.length - 1 ? "…" : "")}
                </div>
                {m.products && m.products.length > 0 && (
                  <div className="mt-1.5 flex max-w-[85%] flex-col gap-1.5">
                    {m.products.map((p) => (
                      <button
                        key={p.slug}
                        onClick={() => goToProduct(p.slug)}
                        className="flex items-center justify-between gap-2 rounded-lg border border-brand bg-brand-soft px-3 py-2 text-left text-xs font-medium text-brand-dark hover:bg-brand hover:text-white"
                      >
                        <span className="truncate">{p.name}</span>
                        <span className="flex shrink-0 items-center gap-1">
                          {p.price !== null && <span className="font-mono">{formatInr(p.price)}</span>}
                          <ArrowRight size={12} />
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {messages.length === 1 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => send(q)}
                    className="rounded-full border border-border px-2.5 py-1 text-xs text-ink-soft hover:border-brand hover:text-brand"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            {error && <p className="text-xs text-accent">{error}</p>}
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border p-2.5">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question…"
              className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="flex shrink-0 items-center justify-center rounded-lg bg-brand p-2.5 text-white hover:bg-brand-dark disabled:opacity-50"
              aria-label="Send"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}

      <a
        href={buildWhatsAppLink(WHATSAPP_GREETING)}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-[5.75rem] right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:opacity-90 sm:right-6"
        aria-label="Chat on WhatsApp"
        title="Chat on WhatsApp"
      >
        <WhatsAppIcon size={22} />
      </a>

      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-4 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg hover:bg-brand-dark sm:right-6"
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}

function WhatsAppIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.85 9.85 0 0 0 12.04 2Zm5.8 14.14c-.24.68-1.4 1.3-1.93 1.35-.5.05-.99.24-3.32-.7-2.82-1.14-4.63-3.98-4.77-4.16-.14-.19-1.14-1.51-1.14-2.88 0-1.37.72-2.05.97-2.33.25-.28.55-.35.73-.35.19 0 .37 0 .53.01.17.01.4-.06.62.48.24.58.81 2 .88 2.14.07.14.11.31.02.5-.09.19-.14.31-.27.47-.14.17-.29.37-.41.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.61-.07.16-.19.7-.82.89-1.1.19-.28.37-.23.62-.14.25.09 1.6.75 1.87.89.28.14.46.21.53.32.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}
