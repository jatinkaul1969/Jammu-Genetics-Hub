"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingBag, ArrowRight } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { formatInr } from "@/lib/format";

export default function CartPage() {
  const { items, removeItem, totalPrice, totalMrp } = useCart();
  const router = useRouter();

  const byLab = new Map<string, typeof items>();
  for (const item of items) {
    const list = byLab.get(item.labId) ?? [];
    list.push(item);
    byLab.set(item.labId, list);
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <ShoppingBag className="mx-auto mb-4 text-ink-faint" size={40} />
        <h1 className="mb-2 font-display text-xl font-semibold text-ink">Your cart is empty</h1>
        <p className="mb-6 text-sm text-ink-soft">Search for a test or package to get started.</p>
        <Link href="/search" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
          Browse tests &amp; packages
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">Your cart</h1>

      {[...byLab.entries()].map(([labId, labItems]) => {
        const subtotal = labItems.reduce((s, i) => s + i.price, 0);
        const subtotalMrp = labItems.reduce((s, i) => s + i.mrp, 0);
        return (
          <div key={labId} className="mb-5 overflow-hidden rounded-xl border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-2.5">
              <p className="text-sm font-medium text-ink">
                Booking from <span className="text-brand-dark">{labItems[0].labName}</span>
              </p>
              <p className="font-mono text-xs text-ink-faint">{labItems.length} item{labItems.length > 1 ? "s" : ""}</p>
            </div>
            <div>
              {labItems.map((item) => (
                <div key={item.productId} className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 last:border-b-0">
                  <div className="min-w-0">
                    <Link href={`/product/${item.productSlug}`} className="truncate text-sm font-medium text-ink hover:text-brand">
                      {item.productName}
                    </Link>
                    <p className="text-xs text-ink-faint">{item.productType === "PACKAGE" ? "Package" : "Single test"}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono text-sm font-semibold text-ink">{formatInr(item.price)}</p>
                      <p className="font-mono text-xs text-ink-faint line-through">{formatInr(item.mrp)}</p>
                    </div>
                    <button
                      onClick={() => removeItem(item.productId)}
                      className="text-ink-faint hover:text-accent"
                      aria-label="Remove"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-mono font-semibold text-ink">
                {formatInr(subtotal)} <span className="text-ink-faint line-through">{formatInr(subtotalMrp)}</span>
              </span>
            </div>
          </div>
        );
      })}

      <div className="rounded-xl border border-border bg-surface p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-ink-soft">Total MRP</span>
          <span className="font-mono text-sm text-ink-faint line-through">{formatInr(totalMrp)}</span>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <span className="font-medium text-ink">You pay</span>
          <span className="font-mono text-xl font-semibold text-brand-dark">{formatInr(totalPrice)}</span>
        </div>
        <button
          onClick={() => router.push("/checkout")}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Proceed to checkout <ArrowRight size={16} />
        </button>
        {byLab.size > 1 && (
          <p className="mt-3 text-xs text-ink-faint">
            Your items span {byLab.size} labs — we&apos;ll create a separate booking per lab, one visit each.
          </p>
        )}
      </div>
    </div>
  );
}
