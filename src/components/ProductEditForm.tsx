"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Check } from "lucide-react";

type Initial = {
  name: string;
  categoryId: string;
  type: string;
  parameters: number;
  sampleType: string;
  fasting: boolean;
  fastingHours: number | null;
  reportHours: number;
  gender: string;
  minAge: number;
  description: string;
  about: string;
  includes: string[];
  popular: boolean;
  badge: string | null;
};

export function ProductEditForm({
  productId,
  categories,
  initial,
}: {
  productId: string;
  categories: { id: string; name: string }[];
  initial: Initial;
}) {
  const router = useRouter();
  const [form, setForm] = useState(initial);
  const [includesText, setIncludesText] = useState(initial.includes.join(", "));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof Initial>(key: K, value: Initial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          includes: includesText.split(",").map((s) => s.trim()).filter(Boolean),
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

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-ink">Product details</h2>

      <Field label="Name">
        <input value={form.name} onChange={(e) => set("name", e.target.value)} className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} className="input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select value={form.type} onChange={(e) => set("type", e.target.value)} className="input">
            <option value="TEST">Single Test</option>
            <option value="PACKAGE">Package</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Parameters">
          <input
            type="number"
            min={1}
            value={form.parameters}
            onChange={(e) => set("parameters", Number(e.target.value))}
            className="input"
          />
        </Field>
        <Field label="Sample type">
          <input value={form.sampleType} onChange={(e) => set("sampleType", e.target.value)} className="input" />
        </Field>
        <Field label="Report hours">
          <input
            type="number"
            min={1}
            value={form.reportHours}
            onChange={(e) => set("reportHours", Number(e.target.value))}
            className="input"
          />
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="For">
          <select value={form.gender} onChange={(e) => set("gender", e.target.value)} className="input">
            <option value="both">All genders</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </Field>
        <Field label="Minimum age">
          <input
            type="number"
            min={0}
            value={form.minAge}
            onChange={(e) => set("minAge", Number(e.target.value))}
            className="input"
          />
        </Field>
        <Field label="Badge (optional)">
          <input
            value={form.badge ?? ""}
            onChange={(e) => set("badge", e.target.value || null)}
            placeholder="e.g. Most Booked"
            className="input"
          />
        </Field>
      </div>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.fasting} onChange={(e) => set("fasting", e.target.checked)} />
          Fasting required
        </label>
        {form.fasting && (
          <Field label="Fasting hours" inline>
            <input
              type="number"
              min={1}
              value={form.fastingHours ?? 8}
              onChange={(e) => set("fastingHours", Number(e.target.value))}
              className="input w-24"
            />
          </Field>
        )}
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={form.popular} onChange={(e) => set("popular", e.target.checked)} />
          Show as popular on homepage
        </label>
      </div>

      <Field label="Short description (card subtitle & SEO)">
        <textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={2}
          className="input"
        />
      </Field>

      <Field label="About this test (shown on the product page, before price comparison)">
        <textarea
          value={form.about}
          onChange={(e) => set("about", e.target.value)}
          rows={4}
          placeholder="What is this test, what does it check, and who is it typically for?"
          className="input"
        />
      </Field>

      <Field label="Included sub-tests (comma-separated)">
        <textarea value={includesText} onChange={(e) => setIncludesText(e.target.value)} rows={2} className="input" />
      </Field>

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

function Field({ label, children, inline }: { label: string; children: React.ReactNode; inline?: boolean }) {
  return (
    <label className={inline ? "flex items-center gap-2" : "block"}>
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
