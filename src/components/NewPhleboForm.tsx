"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NewPhleboForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/phlebos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create phlebotomist account.");
      router.push("/admin/phlebos");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={create} className="max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-ink">New phlebotomist</h2>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Ramesh Kumar" />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Phone (shown to customers as their contact)</span>
        <input
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          className="input"
          placeholder="10-digit mobile number"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Username (for login)</span>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          className="input"
          placeholder="e.g. ramesh"
          pattern="[a-z0-9._-]{3,32}"
          title="3-32 characters: lowercase letters, numbers, dots, underscores, hyphens"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Password</span>
        <input
          required
          type="password"
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input"
          placeholder="At least 6 characters"
        />
      </label>

      {error && <p className="text-sm text-accent">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving && <Loader2 size={15} className="animate-spin" />}
        Create account
      </button>
    </form>
  );
}
