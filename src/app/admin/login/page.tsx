"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not log in.");
      router.push("/admin/bookings");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <div className="mb-6 flex items-center gap-2 text-brand">
        <ShieldCheck size={22} />
        <span className="font-mono text-xs uppercase tracking-wider">Admin Access</span>
      </div>
      <h1 className="mb-1 font-display text-xl font-semibold text-ink">Jammu Genetics Hub — Admin</h1>
      <p className="mb-6 text-sm text-ink-soft">Manage bookings, statuses and reports.</p>

      <form onSubmit={submit} className="rounded-xl border border-border bg-surface p-5">
        <label className="mb-1 block text-xs font-medium text-ink-soft">Admin password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-3 w-full rounded-lg border border-border bg-bg px-3 py-2.5 text-sm outline-none focus:border-brand"
          autoFocus
        />
        {error && <p className="mb-3 text-sm text-accent">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Log in
        </button>
      </form>
    </div>
  );
}
