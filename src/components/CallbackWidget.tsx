"use client";

import { useEffect, useState } from "react";
import { PhoneCall, X, Check, Loader2 } from "lucide-react";

// Only the auto-popup is dismissible for the session — the corner button
// underneath it always stays put so a callback can still be requested later.
const MODAL_DISMISS_KEY = "jgh_callback_modal_dismissed";
const MODAL_DELAY_MS = 1200;

export function CallbackWidget() {
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Jammu");
  const [area, setArea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Reading from sessionStorage (external store) on mount — can't run
    // during SSR, so this has to be an effect, not a lazy initializer.
    if (sessionStorage.getItem(MODAL_DISMISS_KEY) === "1") return;
    const timer = setTimeout(() => setShowModal(true), MODAL_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismissModal() {
    sessionStorage.setItem(MODAL_DISMISS_KEY, "1");
    setShowModal(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !/^[6-9]\d{9}$/.test(phone) || !city.trim() || !area.trim()) {
      setError("Please fill in every field with a valid 10-digit number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone, city: city.trim(), area: area.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit — please try again.");
      setDone(true);
      sessionStorage.setItem(MODAL_DISMISS_KEY, "1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const fields = (
    <>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Your name"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <input
        value={phone}
        onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
        inputMode="numeric"
        placeholder="Mobile number"
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <input
          value={area}
          onChange={(e) => setArea(e.target.value)}
          placeholder="Area / locality"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-accent"
        />
      </div>
      {error && <p className="text-xs text-accent">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {loading && <Loader2 size={14} className="animate-spin" />}
        Request callback
      </button>
      <p className="text-center text-[11px] text-ink-faint">No spam — just a quick call from our team.</p>
    </>
  );

  const doneState = (
    <div className="flex flex-col items-center gap-2 py-3 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-soft text-success">
        <Check size={18} />
      </span>
      <p className="text-sm text-ink">Got it — our team will call you shortly.</p>
    </div>
  );

  return (
    <>
      {showModal && !done && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4"
          onClick={dismissModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-display text-base font-semibold text-ink">
                <PhoneCall size={18} className="text-accent" /> Want us to call you instead?
              </p>
              <button onClick={dismissModal} className="text-ink-faint hover:text-ink" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <p className="mb-3 text-sm text-ink-soft">
              Leave your number and our team will call you back to help you find and book the right test.
            </p>
            <form onSubmit={submit} className="space-y-2">
              {fields}
            </form>
            <button onClick={dismissModal} className="mt-2 w-full text-center text-xs text-ink-faint hover:text-ink-soft">
              No thanks, maybe later
            </button>
          </div>
        </div>
      )}

      <div className="fixed bottom-4 left-4 z-30 sm:bottom-6 sm:left-6">
        {open ? (
          <div className="w-72 rounded-2xl border border-border bg-surface p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <p className="flex items-center gap-1.5 font-display text-sm font-semibold text-ink">
                <PhoneCall size={16} className="text-accent" /> Request a callback
              </p>
              <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink" aria-label="Close">
                <X size={16} />
              </button>
            </div>

            {done ? doneState : <form onSubmit={submit} className="space-y-2">{fields}</form>}
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:opacity-90"
          >
            <PhoneCall size={16} /> Request a callback
          </button>
        )}
      </div>
    </>
  );
}
