"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Trash2, Plus } from "lucide-react";
import { percentOff } from "@/lib/format";

type Lab = { id: string; name: string; shortName: string; isOwn: boolean };
type PriceRow = { labId: string; price: number; mrp: number; testCode: string | null };
type Row = { price: string; mrp: string; testCode: string };

export function ProductPriceEditor({
  productId,
  labs,
  prices,
}: {
  productId: string;
  labs: Lab[];
  prices: PriceRow[];
}) {
  const router = useRouter();
  // Sparse by design — only labs that actually price this product show up,
  // not every lab in the system (most labs don't offer most tests, and this
  // is especially true for the specialty/genetic partner labs).
  const [activeLabIds, setActiveLabIds] = useState<string[]>(() => prices.map((p) => p.labId));
  const [rows, setRows] = useState<Record<string, Row>>(() => {
    const map: Record<string, Row> = {};
    for (const p of prices) {
      map[p.labId] = { price: String(p.price), mrp: String(p.mrp), testCode: p.testCode ?? "" };
    }
    return map;
  });
  const [addLabId, setAddLabId] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const labMap = new Map(labs.map((l) => [l.id, l]));
  const availableToAdd = labs.filter((l) => !activeLabIds.includes(l.id));

  function update(labId: string, field: keyof Row, value: string) {
    setRows((r) => ({ ...r, [labId]: { ...r[labId], [field]: value } }));
  }

  function addLab() {
    if (!addLabId) return;
    setActiveLabIds((ids) => [...ids, addLabId]);
    setRows((r) => ({ ...r, [addLabId]: { price: "0", mrp: "0", testCode: "" } }));
    setAddLabId("");
  }

  async function removeLab(labId: string) {
    setRemoving(labId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}/prices?labId=${labId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not remove.");
      setActiveLabIds((ids) => ids.filter((id) => id !== labId));
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setRemoving(null);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const payload = activeLabIds.map((labId) => ({
        labId,
        price: Number(rows[labId].price),
        mrp: Number(rows[labId].mrp),
        testCode: rows[labId].testCode.trim() || null,
      }));
      for (const p of payload) {
        if (!Number.isFinite(p.price) || !Number.isFinite(p.mrp) || p.price < 0 || p.mrp < 0) {
          throw new Error("Prices must be valid non-negative numbers.");
        }
      }
      const res = await fetch(`/api/admin/products/${productId}/prices`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prices: payload }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save prices.");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-fit space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Prices per lab</h2>
      <p className="text-xs text-ink-soft">
        Sparse by design — only add the labs that actually offer this test. Test code is for admin
        routing/ordering reference only; customers never see it.
      </p>

      <div className="space-y-3">
        {activeLabIds.map((labId) => {
          const lab = labMap.get(labId);
          const row = rows[labId];
          if (!lab || !row) return null;
          const off = percentOff(Number(row.mrp) || 0, Number(row.price) || 0);
          return (
            <div key={labId} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-sm font-medium text-ink">{lab.name}</span>
                {lab.isOwn && (
                  <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">Our Lab</span>
                )}
                {off > 0 && <span className="ml-auto text-xs text-success">{off}% off</span>}
                <button
                  onClick={() => removeLab(labId)}
                  disabled={removing === labId}
                  className="text-ink-faint hover:text-accent disabled:opacity-50"
                  aria-label={`Remove ${lab.name}`}
                >
                  {removing === labId ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-faint">MRP (₹)</span>
                  <input type="number" min={0} value={row.mrp} onChange={(e) => update(labId, "mrp", e.target.value)} className="input" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-faint">Price (₹)</span>
                  <input type="number" min={0} value={row.price} onChange={(e) => update(labId, "price", e.target.value)} className="input" />
                </label>
              </div>
              {!lab.isOwn && (
                <label className="mt-2 block">
                  <span className="mb-1 block text-xs text-ink-faint">Test code (admin reference only)</span>
                  <input
                    value={row.testCode}
                    onChange={(e) => update(labId, "testCode", e.target.value)}
                    placeholder="e.g. MGM1528"
                    className="input font-mono text-xs"
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>

      {availableToAdd.length > 0 && (
        <div className="flex items-center gap-2">
          <select value={addLabId} onChange={(e) => setAddLabId(e.target.value)} className="input">
            <option value="">Add a lab…</option>
            {availableToAdd.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
          <button
            onClick={addLab}
            disabled={!addLabId}
            className="flex shrink-0 items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-medium text-ink hover:border-brand hover:text-brand disabled:opacity-50"
          >
            <Plus size={13} /> Add
          </button>
        </div>
      )}

      {error && <p className="text-sm text-accent">{error}</p>}
      <button
        onClick={save}
        disabled={saving}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
        {saved ? "Saved" : "Save prices"}
      </button>
    </div>
  );
}
