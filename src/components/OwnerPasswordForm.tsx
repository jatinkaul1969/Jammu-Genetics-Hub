"use client";

import { useState } from "react";
import { Loader2, Check } from "lucide-react";

export function OwnerPasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not change password.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-sm space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Change admin password</h2>
      <p className="text-xs text-ink-soft">
        This is the owner login password for /admin. Staff and phlebotomist passwords are
        managed separately from Team and Phlebotomists.
      </p>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Current password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="input"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">New password</span>
        <input
          type="password"
          minLength={6}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="input"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Confirm new password</span>
        <input
          type="password"
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="input"
        />
      </label>

      {error && <p className="text-sm text-accent">{error}</p>}
      <button
        onClick={save}
        disabled={saving || !currentPassword || !newPassword}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
        {saved ? "Saved" : "Change password"}
      </button>
    </div>
  );
}
