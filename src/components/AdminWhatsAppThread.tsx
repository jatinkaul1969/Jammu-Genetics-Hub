"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send, Bot, UserRound, Pause, Play } from "lucide-react";

type Message = {
  id: string;
  direction: "IN" | "OUT";
  sender: "customer" | "bot" | "admin";
  body: string;
  createdAt: string;
};

const SENDER_STYLE: Record<Message["sender"], string> = {
  customer: "bg-surface-muted text-ink",
  bot: "bg-brand-soft text-brand-dark",
  admin: "bg-brand text-white",
};

export function AdminWhatsAppThread({
  phone,
  botPaused,
  messages,
}: {
  phone: string;
  botPaused: boolean;
  messages: Message[];
}) {
  const router = useRouter();
  const [paused, setPaused] = useState(botPaused);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    const text = reply.trim();
    if (!text || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/whatsapp/${phone}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not send message.");
      setReply("");
      setPaused(true);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  async function toggleBot() {
    setToggling(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/whatsapp/${phone}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botPaused: !paused }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not update.");
      setPaused((v) => !v);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setToggling(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">+{phone}</h2>
          <p className="text-xs text-ink-faint">
            {paused ? "Bot paused — you're handling this conversation." : "Bot is replying automatically."}
          </p>
        </div>
        <button
          onClick={toggleBot}
          disabled={toggling}
          className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium disabled:opacity-50 ${
            paused ? "border-success text-success hover:bg-success-soft" : "border-accent text-accent hover:bg-accent-soft"
          }`}
        >
          {toggling ? <Loader2 size={13} className="animate-spin" /> : paused ? <Play size={13} /> : <Pause size={13} />}
          {paused ? "Resume bot" : "Pause bot"}
        </button>
      </div>

      <div className="mb-4 space-y-3 rounded-xl border border-border bg-surface p-4">
        {messages.length === 0 ? (
          <p className="text-sm text-ink-soft">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex flex-col ${m.direction === "IN" ? "items-start" : "items-end"}`}>
              <div className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-sm ${SENDER_STYLE[m.sender]}`}>
                {m.body}
              </div>
              <span className="mt-1 flex items-center gap-1 text-[11px] text-ink-faint">
                {m.sender === "bot" && <Bot size={11} />}
                {m.sender === "admin" && <UserRound size={11} />}
                {m.sender === "customer" ? "Customer" : m.sender === "bot" ? "Bot" : "You"} ·{" "}
                {new Date(m.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={sendReply} className="flex items-start gap-2">
        <textarea
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          rows={2}
          placeholder="Reply as Jammu Genetics Hub… (this pauses the bot on this chat)"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
          disabled={sending}
        />
        <button
          type="submit"
          disabled={sending || !reply.trim()}
          className="flex shrink-0 items-center justify-center rounded-lg bg-brand p-2.5 text-white hover:bg-brand-dark disabled:opacity-50"
          aria-label="Send reply"
        >
          {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
    </div>
  );
}
