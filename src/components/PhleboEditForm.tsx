"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Trash2 } from "lucide-react";

export function PhleboEditForm({
  phleboId,
  initial,
}: {
  phleboId: string;
  initial: { name: string; username: string; phone: string; enabled: boolean };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/phlebos/${phleboId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, enabled, ...(newPassword ? { password: newPassword } : {}) }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save.");
      setSaved(true);
      setNewPassword("");
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${initial.name}'s account? Their open pickups will become unassigned.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/phlebos/${phleboId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not remove account.");
      router.push("/admin/phlebos");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">
          {initial.name} <span className="font-normal text-ink-faint">@{initial.username}</span>
        </h2>
        <button onClick={remove} disabled={deleting} className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50">
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Remove
        </button>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Name</span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input" />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Phone (shown to customers)</span>
        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
          inputMode="numeric"
          className="input"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Account enabled (unchecking logs them out and blocks login immediately)
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Reset password (optional)</span>
        <input
          type="password"
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="Leave blank to keep current password"
          className="input"
        />
      </label>

      {error && <p className="text-sm text-accent">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
        {saved ? "Saved" : "Save changes"}
      </button>
    </div>
  );
}
