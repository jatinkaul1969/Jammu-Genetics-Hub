"use client";

import { useState } from "react";
import { Check, Loader2, PhoneCall } from "lucide-react";
import { SERVICEABLE_CITIES } from "@/lib/serviceable-areas";
import { getAttribution } from "@/lib/attribution";
import { trackEvent } from "@/lib/analytics";

const SPECIALITIES = [
  "Obstetrics & gynaecology",
  "Fertility / IVF",
  "Paediatrics / neonatology",
  "Oncology",
  "Neurology",
  "General physician",
  "Pathology / diagnostic centre",
  "Other",
];

export function DoctorPartnerForm() {
  const [name, setName] = useState("");
  const [clinic, setClinic] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(SERVICEABLE_CITIES[0].label);
  const [speciality, setSpeciality] = useState(SPECIALITIES[0]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim() || !clinic.trim() || !/^[6-9]\d{9}$/.test(phone)) {
      setError("Please enter your name, your clinic or hospital, and a valid 10-digit mobile number.");
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
          area: clinic.trim(),
          source: "doctor_partner",
          topic: message.trim() ? `${speciality} — ${message.trim()}` : speciality,
          attribution: getAttribution() ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not submit — please try again.");
      trackEvent("generate_lead", { form: "doctor_partner" });
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const input = "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand";

  if (done) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success">
          <Check size={20} />
        </span>
        <p className="font-display text-base font-semibold text-ink">Thank you, doctor — we&apos;ve got your details.</p>
        <p className="max-w-xs text-sm text-ink-soft">Our team will call you shortly to understand how we can help your patients.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="dp-name">Your name</label>
          <input id="dp-name" value={name} onChange={(e) => setName(e.target.value)} className={input} autoComplete="name" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="dp-clinic">Clinic or hospital</label>
          <input id="dp-clinic" value={clinic} onChange={(e) => setClinic(e.target.value)} className={input} autoComplete="organization" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="dp-phone">Mobile number</label>
          <input
            id="dp-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            autoComplete="tel-national"
            className={input}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="dp-city">City</label>
          <select id="dp-city" value={city} onChange={(e) => setCity(e.target.value)} className={input}>
            {SERVICEABLE_CITIES.map((c) => (
              <option key={c.key} value={c.label}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="dp-speciality">Speciality</label>
        <select id="dp-speciality" value={speciality} onChange={(e) => setSpeciality(e.target.value)} className={input}>
          {SPECIALITIES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-xs font-medium text-ink-soft" htmlFor="dp-message">
          How can we help? <span className="text-ink-faint">(optional)</span>
        </label>
        <textarea
          id="dp-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          maxLength={300}
          placeholder="e.g. prenatal screening for my patients, a price list, sample pick-up from the clinic"
          className={input}
        />
      </div>
      {error && <p className="text-xs text-accent">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <PhoneCall size={15} />} Ask us to call me
      </button>
      <p className="text-center text-[11px] text-ink-faint">
        We&apos;ll use your number only to call or WhatsApp you about this enquiry.
      </p>
    </form>
  );
}
