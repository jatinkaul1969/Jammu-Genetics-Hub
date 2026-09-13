"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Phone, ShieldCheck, Loader2 } from "lucide-react";

type Props = {
  onClose: () => void;
  onSuccess: (user: { name: string; phone: string; age: number; membershipActive: boolean }) => void;
};

type Step = "phone" | "otp";

export function LoginModal({ onClose, onSuccess }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not send OTP.");
      setDevOtp(data.devOtp);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError("Enter the 6-digit OTP.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code, name, age }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("name and a valid age")) setIsNewUser(true);
        throw new Error(data.error ?? "Could not verify OTP.");
      }
      onSuccess(data.user);
      router.refresh();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-sm rounded-2xl bg-surface p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-ink-faint hover:text-ink"
          aria-label="Close"
        >
          <X size={20} />
        </button>

        <div className="mb-5 flex items-center gap-2 text-brand">
          <ShieldCheck size={22} />
          <span className="font-mono text-xs uppercase tracking-wider">Secure OTP Login</span>
        </div>

        {step === "phone" && (
          <form onSubmit={sendOtp}>
            <h3 className="mb-1 text-xl font-semibold text-ink">Log in or sign up</h3>
            <p className="mb-5 text-sm text-ink-soft">
              We&apos;ll send a one-time code to verify your number.
            </p>
            <label className="mb-1 block text-xs font-medium text-ink-soft">Mobile number</label>
            <div className="mb-3 flex items-center gap-2 rounded-lg border border-border bg-bg px-3 py-2.5">
              <Phone size={16} className="text-ink-faint" />
              <span className="text-sm text-ink-soft">+91</span>
              <input
                type="tel"
                inputMode="numeric"
                maxLength={10}
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                placeholder="98765 43210"
                className="w-full bg-transparent text-sm outline-none"
                autoFocus
              />
            </div>
            {error && <p className="mb-3 text-sm text-accent">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Send OTP
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={verifyOtp}>
            <h3 className="mb-1 text-xl font-semibold text-ink">Enter OTP</h3>
            <p className="mb-2 text-sm text-ink-soft">
              Sent to <span className="font-medium text-ink">+91 {phone}</span>{" "}
              <button type="button" className="text-brand underline underline-offset-2" onClick={() => setStep("phone")}>
                change
              </button>
            </p>
            {devOtp && (
              <p className="mb-4 rounded-lg border border-gold-soft bg-gold-soft px-3 py-2 font-mono text-xs text-gold">
                Dev mode — no WhatsApp gateway connected yet. Your OTP is <strong>{devOtp}</strong>.
              </p>
            )}
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="6-digit code"
              className="mb-3 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-center text-lg tracking-[0.4em] outline-none focus:border-brand"
              autoFocus
            />

            {isNewUser && (
              <div className="mb-3 space-y-3 rounded-lg border border-border bg-bg p-3">
                <p className="text-xs text-ink-soft">New here — tell us who&apos;s booking:</p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Patient name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-ink-soft">Age</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Age in years"
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}

            {error && <p className="mb-3 text-sm text-accent">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              Verify &amp; continue
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
