"use client";

import { useRouter } from "next/navigation";
import { Check, ShoppingCart } from "lucide-react";
import { useCart, type CartItem } from "@/lib/cart-context";

export function AddToCartButton({ item }: { item: CartItem }) {
  const { addItem, hasProduct } = useCart();
  const router = useRouter();
  const current = hasProduct(item.productId);
  const isThisLab = current?.labId === item.labId;

  if (isThisLab) {
    return (
      <button
        onClick={() => router.push("/cart")}
        className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-3.5 py-2 text-sm font-semibold text-brand-dark"
      >
        <Check size={15} /> In cart · View
      </button>
    );
  }

  return (
    <button
      onClick={() => addItem(item)}
      className="flex items-center gap-1.5 rounded-lg bg-brand px-3.5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
    >
      <ShoppingCart size={15} />
      {current ? "Switch to this lab" : "Add to cart"}
    </button>
  );
}
