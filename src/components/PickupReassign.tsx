"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Shuffle } from "lucide-react";

export function PickupReassign({
  bookingId,
  phleboId,
  phlebos,
  canPickManually,
}: {
  bookingId: string;
  phleboId: string | null;
  phlebos: { id: string; name: string; online: boolean }[];
  canPickManually: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reassign(e: React.ChangeEvent<HTMLSelectElement>) {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pickups/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phleboId: e.target.value || null }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not reassign.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function autoAssign() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/pickups/${bookingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ autoAssign: true }),
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

      {canPickManually && (
        <select
          defaultValue={phleboId ?? ""}
          onChange={reassign}
          disabled={saving}
          className="mb-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand disabled:opacity-50"
        >
          <option value="">Unassigned</option>
          {phlebos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} {p.online ? "(online)" : "(offline)"}
            </option>
          ))}
        </select>
      )}

      <button
        onClick={autoAssign}
        disabled={saving}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-brand px-3 py-2 text-xs font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
      >
        {saving ? <Loader2 size={13} className="animate-spin" /> : <Shuffle size={13} />}
        Auto-assign to next available phlebo
      </button>

      {error && <p className="mt-2 text-xs text-accent">{error}</p>}
    </div>
  );
}
