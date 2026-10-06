"use client";

import { useState } from "react";
import { Check, Loader2, PhoneCall } from "lucide-react";
import { SERVICEABLE_CITIES } from "@/lib/serviceable-areas";

const TOPICS = [
  "I'm pregnant or planning a pregnancy",
  "My child has delays, seizures or a suspected genetic condition",
  "Cancer runs in my family",
  "Repeated miscarriages or infertility",
  "A genetic condition runs in my family",
  "I need help understanding a report",
  "Not sure — I need guidance",
];

export function GeneticistRequestForm({ defaultCity }: { defaultCity: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(defaultCity);
  const [topic, setTopic] = useState(TOPICS[TOPICS.length - 1]);
  const [details, setDetails] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter your name and a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phone,
          city,
          source: "geneticist_request",
          topic: details.trim() ? `${topic} — ${details.trim()}` : topic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit — please try again.");
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const input =
    "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand";

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
          <Check size={20} />
        </span>
        <p className="font-display text-base font-semibold text-ink">Thank you — we&apos;ve got your request.</p>
        <p className="max-w-xs text-sm text-ink-soft">
          Our team will call you shortly to understand what you need and connect you with a geneticist.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="gr-name">Your name</label>
        <input id="gr-name" value={name} onChange={(e) => setName(e.target.value)} className={input} autoComplete="name" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="gr-phone">Mobile number</label>
          <input
            id="gr-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            autoComplete="tel-national"
            className={input}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="gr-city">City</label>
          <select id="gr-city" value={city} onChange={(e) => setCity(e.target.value)} className={input}>
            {SERVICEABLE_CITIES.map((c) => (
              <option key={c.key} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="gr-topic">What would you like help with?</label>
        <select id="gr-topic" value={topic} onChange={(e) => setTopic(e.target.value)} className={input}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="gr-details">
          Anything else we should know? <span className="text-ink-faint">(optional)</span>
        </label>
        <textarea
          id="gr-details"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="e.g. the test you were advised, weeks of pregnancy, child's age"
          className={input}
        />
      </div>
      {error && <p className="text-xs text-accent">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <PhoneCall size={15} />} Request a call from a geneticist
      </button>
      <p className="text-center text-[11px] text-ink-faint">
        We&apos;ll only use your number to call you about this request. This is not an emergency service.
      </p>
    </form>
  );
}
