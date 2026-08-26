"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function LeadReassign({
  leadId,
  assignedToId,
  staff,
}: {
  leadId: string;
  assignedToId: string | null;
  staff: { id: string; name: string; online: boolean }[];
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reassign(e: React.ChangeEvent<HTMLSelectElement>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignedToId: e.target.value || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not reassign.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-semibold text-ink">Reassign</h3>
      <select
        defaultValue={assignedToId ?? ""}
        onChange={reassign}
        disabled={saving}
        className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-50"
      >
        <option value="">Unassigned</option>
        {staff.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name} {s.online ? "(online)" : "(offline)"}
          </option>
        ))}
      </select>
      {saving && <Loader2 size={14} className="mt-2 animate-spin text-ink-faint" />}
      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
    </div>
  );
}
