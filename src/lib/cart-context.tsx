"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth-context";

export type CartItem = {
  productId: string;
  productSlug: string;
  productName: string;
  productType: string;
  labId: string;
  labSlug: string;
  labName: string;
  labShortName: string;
  price: number;
  mrp: number;
};

type CartContextValue = {
  items: CartItem[];
  hydrated: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  clear: () => void;
  hasProduct: (productId: string) => CartItem | undefined;
  totalMrp: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_PREFIX = "jgh_cart_v1_";
const GUEST_KEY = `${STORAGE_PREFIX}guest`;

// Each account (identified by phone) gets its own cart bucket, and a
// logged-out visitor gets a separate "guest" bucket — carts never bleed
// between two different accounts, or between a guest and someone else's
// account, on a shared browser.
function keyFor(phone: string | undefined) {
  return phone ? `${STORAGE_PREFIX}${phone}` : GUEST_KEY;
}

function readCart(key: string): CartItem[] {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(key: string, items: CartItem[]) {
  window.localStorage.setItem(key, JSON.stringify(items));
}

// If there's a leftover guest cart when this identity becomes "logged in,"
// fold it into that account's own cart (items already in the account cart
// win on conflict) and clear the guest bucket — so items added before
// logging in aren't lost, but they only ever land in the account that just
// logged in, never in some other account's cart.
function mergeGuestIntoAccount(phone: string) {
  const guestItems = readCart(GUEST_KEY);
  if (guestItems.length === 0) return readCart(keyFor(phone));
  const accountItems = readCart(keyFor(phone));
  const merged = [...accountItems];
  for (const gi of guestItems) {
    if (!merged.some((i) => i.productId === gi.productId)) merged.push(gi);
  }
  writeCart(keyFor(phone), merged);
  window.localStorage.removeItem(GUEST_KEY);
  return merged;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const identityRef = useRef<string | null>(null); // null = not yet initialized this session

  useEffect(() => {
    const nextIdentity = user?.phone ?? "guest";
    const prevIdentity = identityRef.current;

    let nextItems: CartItem[];
    if (prevIdentity === null) {
      // First mount — load whichever bucket matches the identity we're
      // rendering as (opportunistically merging a stray guest cart if we're
      // already logged in, e.g. arriving via a fresh page load).
      nextItems = nextIdentity !== "guest" ? mergeGuestIntoAccount(nextIdentity) : readCart(GUEST_KEY);
    } else if (prevIdentity === nextIdentity) {
      identityRef.current = nextIdentity;
      return;
    } else if (prevIdentity === "guest" && nextIdentity !== "guest") {
      // Just logged in — carry over anything added before logging in.
      nextItems = mergeGuestIntoAccount(nextIdentity);
    } else {
      // Logged out, or switched to a different account — load that
      // identity's own cart fresh; never keep the previous identity's items.
      nextItems = readCart(keyFor(user?.phone));
    }

    setItems(nextItems);
    identityRef.current = nextIdentity;
    setHydrated(true);
  }, [user?.phone]);

  useEffect(() => {
    if (!hydrated) return;
    writeCart(keyFor(user?.phone), items);
  }, [items, hydrated, user?.phone]);

  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!hydrated || !user) return;
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    // Best-effort mirror to the server (for abandoned-cart follow-up) —
    // debounced so rapid add/remove clicks don't spam the endpoint, and
    // silently ignored on failure since it must never block shopping.
    syncTimerRef.current = setTimeout(() => {
      fetch("/api/cart/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }, 1500);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [items, hydrated, user]);

  const addItem = (item: CartItem) => {
    setItems((prev) => [...prev.filter((i) => i.productId !== item.productId), item]);
  };

  const removeItem = (productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const clear = () => setItems([]);

  const hasProduct = (productId: string) => items.find((i) => i.productId === productId);

  const totalMrp = useMemo(() => items.reduce((sum, i) => sum + i.mrp, 0), [items]);
  const totalPrice = useMemo(() => items.reduce((sum, i) => sum + i.price, 0), [items]);

  return (
    <CartContext.Provider value={{ items, hydrated, addItem, removeItem, clear, hasProduct, totalMrp, totalPrice }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
