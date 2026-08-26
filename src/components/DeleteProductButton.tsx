"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export function DeleteProductButton({ productId, productName }: { productId: string; productName: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json()).error ?? "Could not delete.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
      setConfirming(false);
    } finally {
      setLoading(false);
    }
  }

  if (confirming) {
    return (
      <span className="flex items-center gap-1.5">
        <button
          onClick={remove}
          disabled={loading}
          className="rounded-md bg-accent px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : `Delete ${productName.slice(0, 12)}?`}
        </button>
        <button onClick={() => setConfirming(false)} className="text-xs text-ink-faint hover:text-ink">
          Cancel
        </button>
        {error && <span className="text-xs text-accent">{error}</span>}
      </span>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-accent hover:border-accent"
      aria-label={`Delete ${productName}`}
    >
      <Trash2 size={13} />
    </button>
  );
}
