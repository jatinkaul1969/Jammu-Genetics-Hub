"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2, Check } from "lucide-react";
import { CategoryIcon, CATEGORY_ICON_NAMES } from "@/components/CategoryIcon";

type Category = { id: string; name: string; icon: string; order: number; productCount: number };

export function CategoryManager({ initialCategories }: { initialCategories: Category[] }) {
  const router = useRouter();
  const [categories, setCategories] = useState(initialCategories);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState(CATEGORY_ICON_NAMES[0]);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), icon: newIcon, order: categories.length + 1 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create category.");
      setCategories((c) => [...c, { ...data.category, productCount: 0 }]);
      setNewName("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-5">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Categories</h2>
        <div className="space-y-2">
          {categories.map((c) => (
            <CategoryRow key={c.id} category={c} onChange={(updated) => setCategories((cs) => cs.map((x) => (x.id === updated.id ? updated : x)))} onDelete={(id) => setCategories((cs) => cs.filter((x) => x.id !== id))} />
          ))}
        </div>
      </div>

      <form onSubmit={addCategory} className="rounded-xl border border-border bg-surface p-5">
        <h3 className="mb-3 text-sm font-semibold text-ink">Add a category</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Name</span>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Genetic Testing"
              className="w-52 rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-soft">Icon</span>
            <select
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              className="rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
            >
              {CATEGORY_ICON_NAMES.map((icon) => (
                <option key={icon} value={icon}>
                  {icon}
                </option>
              ))}
            </select>
          </label>
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-soft text-brand">
            <CategoryIcon name={newIcon} size={18} />
          </span>
          <button
            type="submit"
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {creating ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
            Add
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-accent">{error}</p>}
      </form>
    </div>
  );
}

function CategoryRow({
  category,
  onChange,
  onDelete,
}: {
  category: Category;
  onChange: (c: Category) => void;
  onDelete: (id: string) => void;
}) {
  const [icon, setIcon] = useState(category.icon);
  const [name, setName] = useState(category.name);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = icon !== category.icon || name !== category.name;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, icon }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save.");
      onChange({ ...category, name, icon });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/categories/${category.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not delete.");
      onDelete(category.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
        <CategoryIcon name={icon} size={16} />
      </span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-40 rounded-md border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand"
      />
      <select
        value={icon}
        onChange={(e) => setIcon(e.target.value)}
        className="rounded-md border border-border bg-bg px-2 py-1.5 text-sm outline-none focus:border-brand"
      >
        {CATEGORY_ICON_NAMES.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      <span className="text-xs text-ink-faint">{category.productCount} product{category.productCount !== 1 ? "s" : ""}</span>
      {error && <span className="text-xs text-accent">{error}</span>}
      <div className="ml-auto flex items-center gap-1.5">
        {dirty && (
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-1 rounded-md bg-brand px-2.5 py-1.5 text-xs font-medium text-white disabled:opacity-60"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : null}
            {saved ? "Saved" : "Save"}
          </button>
        )}
        <button
          onClick={remove}
          disabled={deleting || category.productCount > 0}
          title={category.productCount > 0 ? "Move products out of this category first" : "Delete"}
          className="rounded-md border border-border px-2 py-1.5 text-xs text-accent hover:border-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}
