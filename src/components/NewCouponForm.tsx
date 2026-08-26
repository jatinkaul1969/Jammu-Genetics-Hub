"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { COUPON_AUDIENCES, type CouponAudienceKey } from "@/lib/coupon-constants";

export function NewCouponForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [value, setValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("0");
  const [audience, setAudience] = useState<CouponAudienceKey>("ALL");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          description,
          type,
          value: Number(value),
          maxDiscount: type === "PERCENT" && maxDiscount ? Number(maxDiscount) : null,
          minOrderAmount: Number(minOrderAmount) || 0,
          audience,
          expiresAt: expiresAt || null,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not create coupon.");
      router.push("/admin/coupons");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-lg space-y-4 rounded-xl border border-border bg-surface p-5">
      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Code</span>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="e.g. DIWALI20"
          className="input font-mono"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-ink-soft">Description (shown to customers)</span>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Diwali offer — 20% off, up to ₹500"
          className="input"
        />
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
        onClick={create}
        disabled={saving || !code || !description || !value}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving ? <Loader2 size={15} className="animate-spin" /> : null}
        Create coupon
      </button>
    </div>
  );
}
