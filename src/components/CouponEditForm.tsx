"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check, Trash2 } from "lucide-react";
import { COUPON_AUDIENCES, type CouponAudienceKey } from "@/lib/coupon-constants";

type Initial = {
  code: string;
  description: string;
  type: "PERCENT" | "FLAT";
  value: number;
  maxDiscount: number | null;
  minOrderAmount: number;
  audience: CouponAudienceKey;
  active: boolean;
  expiresAt: string | null; // yyyy-mm-dd or null
};

export function CouponEditForm({ couponId, initial }: { couponId: string; initial: Initial }) {
  const router = useRouter();
  const [description, setDescription] = useState(initial.description);
  const [type, setType] = useState(initial.type);
  const [value, setValue] = useState(String(initial.value));
  const [maxDiscount, setMaxDiscount] = useState(initial.maxDiscount != null ? String(initial.maxDiscount) : "");
  const [minOrderAmount, setMinOrderAmount] = useState(String(initial.minOrderAmount));
  const [audience, setAudience] = useState<CouponAudienceKey>(initial.audience);
  const [active, setActive] = useState(initial.active);
  const [expiresAt, setExpiresAt] = useState(initial.expiresAt ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          type,
          value: Number(value),
          maxDiscount: type === "PERCENT" && maxDiscount ? Number(maxDiscount) : null,
          minOrderAmount: Number(minOrderAmount) || 0,
          audience,
          active,
          expiresAt: expiresAt || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not save.");
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!confirm(`Delete coupon ${initial.code}? Past bookings that used it keep their record either way.`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/coupons/${couponId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not delete coupon.");
      router.push("/admin/coupons");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{initial.code}</h2>
        <button onClick={remove} disabled={deleting} className="flex items-center gap-1 text-xs text-accent hover:underline disabled:opacity-50">
          {deleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />} Delete
        </button>
      </div>

      <label className="flex items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Active (unchecking turns it off immediately, without deleting it)
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Description (shown to customers)</span>
        <input value={description} onChange={(e) => setDescription(e.target.value)} className="input" />
      </label>

      <div>
        <span className="mb-2 block text-xs font-medium text-ink-soft">Discount type</span>
        <div className="flex gap-2">
          {(["PERCENT", "FLAT"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                type === t ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:border-brand"
              }`}
            >
              {t === "PERCENT" ? "Percent off" : "Flat amount off"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">
            {type === "PERCENT" ? "Percent (e.g. 20)" : "Amount (₹)"}
          </span>
          <input type="number" min={1} value={value} onChange={(e) => setValue(e.target.value)} className="input" />
        </label>
        {type === "PERCENT" && (
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Max discount (₹, optional)</span>
            <input
              type="number"
              min={0}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(e.target.value)}
              placeholder="No cap"
              className="input"
            />
          </label>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">Minimum order (₹)</span>
          <input
            type="number"
            min={0}
            value={minOrderAmount}
            onChange={(e) => setMinOrderAmount(e.target.value)}
            className="input"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-ink-soft">Expires on (optional)</span>
          <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="input" />
        </label>
      </div>

      <div>
        <span className="mb-2 block text-xs font-medium text-ink-soft">Who can use this coupon</span>
        <div className="flex flex-wrap gap-2">
          {COUPON_AUDIENCES.map((a) => (
            <button
              key={a.key}
              type="button"
              onClick={() => setAudience(a.key)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                audience === a.key ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:border-brand"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
        <p className="mt-1.5 text-xs text-ink-faint">
          Also controls who sees this coupon listed in their checkout &ldquo;Your coupons&rdquo; section.
        </p>
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
