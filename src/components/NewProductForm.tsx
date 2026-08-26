"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export function NewProductForm({ categories }: { categories: { id: string; name: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? "");
  const [type, setType] = useState("TEST");
  const [parameters, setParameters] = useState("1");
  const [sampleType, setSampleType] = useState("Blood");
  const [reportHours, setReportHours] = useState("24");
  const [gender, setGender] = useState("both");
  const [description, setDescription] = useState("");
  const [includesText, setIncludesText] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          categoryId,
          type,
          parameters: Number(parameters),
          sampleType,
          reportHours: Number(reportHours),
          gender,
          description,
          includes: includesText.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create product.");
      router.push(`/admin/catalog/${data.product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={create} className="space-y-4 rounded-xl border border-border bg-surface p-5">
      <h2 className="font-display text-lg font-semibold text-ink">New product</h2>

      <Field label="Name">
        <input required value={name} onChange={(e) => setName(e.target.value)} className="input" placeholder="e.g. Vitamin B6" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Category">
          <select required value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="input">
            {categories.length === 0 && <option value="">Add a category first</option>}
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Type">
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            <option value="TEST">Single Test</option>
            <option value="PACKAGE">Package</option>
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Parameters">
          <input type="number" min={1} value={parameters} onChange={(e) => setParameters(e.target.value)} className="input" />
        </Field>
        <Field label="Sample type">
          <input value={sampleType} onChange={(e) => setSampleType(e.target.value)} className="input" />
        </Field>
        <Field label="Report hours">
          <input type="number" min={1} value={reportHours} onChange={(e) => setReportHours(e.target.value)} className="input" />
        </Field>
      </div>

      <Field label="For">
        <select value={gender} onChange={(e) => setGender(e.target.value)} className="input">
          <option value="both">All genders</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </Field>

      <Field label="Description">
        <textarea required value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" />
      </Field>

      <Field label="Included sub-tests (comma-separated)">
        <textarea value={includesText} onChange={(e) => setIncludesText(e.target.value)} rows={2} className="input" />
      </Field>

      <p className="text-xs text-ink-faint">
        Prices for all labs start at ₹0 — you&apos;ll set them on the next screen after creating the product.
      </p>

      {error && <p className="text-sm text-accent">{error}</p>}
      <button
        type="submit"
        disabled={saving || categories.length === 0}
        className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {saving && <Loader2 size={15} className="animate-spin" />}
        Create product
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
