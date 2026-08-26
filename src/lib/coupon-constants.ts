// Client-safe coupon constants — deliberately its own file, separate from
// src/lib/coupons.ts. coupons.ts imports prisma (which pulls in the `pg`
// driver adapter, a Node-only module); a "use client" component importing
// anything from coupons.ts drags that whole chain into the browser bundle
// and breaks the build ("Module not found: Can't resolve 'fs'"). Anything
// referenced from a client component must live here.

export const COUPON_AUDIENCES = [
  { key: "ALL", label: "All customers" },
  { key: "NEW_USER", label: "New customers (first booking)" },
  { key: "MEMBER", label: "Members (VIP)" },
] as const;

export type CouponAudienceKey = (typeof COUPON_AUDIENCES)[number]["key"];
