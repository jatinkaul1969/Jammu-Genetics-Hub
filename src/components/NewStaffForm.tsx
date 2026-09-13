"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { PERMISSIONS, STAFF_TEAMS } from "@/lib/permissions";
import { PasswordInput } from "@/components/PasswordInput";

export function NewStaffForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [team, setTeam] = useState<string>(STAFF_TEAMS[0].key);
  const [permissions, setPermissions] = useState<string[]>([...STAFF_TEAMS[0].defaultPermissions]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function togglePermission(key: string) {
    setPermissions((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  }

  function selectTeam(key: string) {
    setTeam(key);
    const defaults = STAFF_TEAMS.find((t) => t.key === key)?.defaultPermissions ?? [];
    setPermissions([...defaults]);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, username, password, permissions, team }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create staff account.");
      router.push("/admin/team");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={create} className="max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-ink">New staff account</h2>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Name</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Priya Sharma" />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Username (for login)</span>
        <input
          required
          value={username}
          onChange={(e) => setUsername(e.target.value.toLowerCase())}
          className="input"
          placeholder="e.g. priya"
          pattern="[a-z0-9._-]{3,32}"
          title="3-32 characters: lowercase letters, numbers, dots, underscores, hyphens"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Password</span>
        <PasswordInput
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 6 characters"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Confirm password</span>
        <PasswordInput
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Re-enter the password"
        />
      </label>

      <div>
        <span className="mb-2 block text-xs font-medium text-ink-soft">Team</span>
        <div className="flex flex-wrap gap-2">
          {STAFF_TEAMS.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => selectTeam(t.key)}
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
        <span className="mb-2 block text-xs font-medium text-ink-soft">
          Access — pick what this person can see and work (picking a team above pre-selects the usual ones)
        </span>
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
