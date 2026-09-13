"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Trash2 } from "lucide-react";
import { PERMISSIONS, STAFF_TEAMS } from "@/lib/permissions";
import { PasswordInput } from "@/components/PasswordInput";

export function StaffEditForm({
  staffId,
  initial,
}: {
  staffId: string;
  initial: { name: string; username: string; enabled: boolean; permissions: string[]; team: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(initial.name);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [team, setTeam] = useState(initial.team);
  const [permissions, setPermissions] = useState(initial.permissions);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePermission(key: string) {
    setPermissions((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  }

  async function save() {
    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          enabled,
          permissions,
          team,
          ...(newPassword ? { password: newPassword } : {}),
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save.");
      setSaved(true);
      setNewPassword("");
      setConfirmPassword("");
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Remove ${initial.name}'s account? Their assigned leads will become unassigned.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/staff/${staffId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not remove account.");
      router.push("/admin/team");
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

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        Account enabled (unchecking logs them out and blocks login immediately)
      </label>

      <div>
        <span className="mb-2 block text-xs font-medium text-ink-soft">Team</span>
        <div className="flex flex-wrap gap-2">
          {STAFF_TEAMS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTeam(t.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                team === t.key ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:border-brand"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium text-ink-soft">Access</span>
        <div className="space-y-2">
          {PERMISSIONS.map((p) => (
            <label key={p.key} className="flex items-start gap-2 rounded-lg border border-border p-2.5 hover:border-brand">
              <input
                type="checkbox"
                checked={permissions.includes(p.key)}
                onChange={() => togglePermission(p.key)}
                className="mt-0.5"
              />
              <span>
                <span className="block text-sm font-medium text-ink">{p.label}</span>
                <span className="block text-xs text-ink-faint">{p.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">Reset password (optional)</span>
          <PasswordInput
            minLength={6}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Leave blank to keep current password"
          />
        </label>
        {newPassword && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Confirm new password</span>
            <PasswordInput
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter the new password"
            />
          </label>
        )}
      </div>

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
