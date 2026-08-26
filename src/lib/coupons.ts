import { prisma } from "@/lib/prisma";
import { isMembershipActive } from "@/lib/collection-slots";

export type CouponValidation =
  | { valid: true; code: string; discount: number; description: string }
  | { valid: false; error: string };

async function isFirstOrder(userId: string) {
  const count = await prisma.booking.count({ where: { userId } });
  return count === 0;
}

// "ALL" | "NEW_USER" | "MEMBER" — set by the admin per coupon (see
// /admin/coupons); this is the single source of truth for both who can
// apply a coupon and who sees it listed at checkout.
async function isAudienceEligible(audience: string, userId: string): Promise<boolean> {
  if (audience === "NEW_USER") return isFirstOrder(userId);
  if (audience === "MEMBER") {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { membershipActive: true, membershipExpiresAt: true },
    });
    return Boolean(user && isMembershipActive(user));
  }
  return true; // "ALL"
}

function audienceError(audience: string): string {
  if (audience === "NEW_USER") return "This coupon is only valid on your first booking.";
  if (audience === "MEMBER") return "This coupon is only valid for members.";
  return "You're not eligible for this coupon.";
}

export function computeDiscount(
  coupon: { type: string; value: number; maxDiscount: number | null },
  subtotal: number
) {
  if (coupon.type === "FLAT") {
    return Math.min(coupon.value, subtotal);
  }
  // PERCENT
  const raw = Math.round((subtotal * coupon.value) / 100);
  const capped = coupon.maxDiscount !== null ? Math.min(raw, coupon.maxDiscount) : raw;
  return Math.min(capped, subtotal);
}

export async function validateCoupon(code: string, subtotal: number, userId: string): Promise<CouponValidation> {
  const coupon = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });

  if (!coupon || !coupon.active) {
    return { valid: false, error: "That coupon code isn't valid." };
  }
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    return { valid: false, error: "That coupon has expired." };
  }
  if (subtotal < coupon.minOrderAmount) {
    return { valid: false, error: `This coupon needs a minimum order of ₹${coupon.minOrderAmount}.` };
  }
  if (!(await isAudienceEligible(coupon.audience, userId))) {
    return { valid: false, error: audienceError(coupon.audience) };
  }

  const discount = computeDiscount(coupon, subtotal);
  return { valid: true, code: coupon.code, discount, description: coupon.description };
}

// The best coupon to auto-suggest (and silently pre-apply) at checkout —
// deliberately narrow: only ever a NEW_USER coupon, so a first-time visitor
// gets a welcome discount without hunting for a code, but nothing silently
// discounts a returning customer's order without them choosing it. See
// getVisibleCouponsForUser below for the full browsable list instead.
export async function getEligibleAutoCoupon(userId: string, subtotal: number): Promise<CouponValidation | null> {
  const firstOrder = await isFirstOrder(userId);
  if (!firstOrder) return null;

  const coupons = await prisma.coupon.findMany({
    where: {
      active: true,
      audience: "NEW_USER",
      minOrderAmount: { lte: subtotal },
    },
  });
  if (coupons.length === 0) return null;

  const best = coupons
    .map((c) => ({ coupon: c, discount: computeDiscount(c, subtotal) }))
    .sort((a, b) => b.discount - a.discount)[0];

  return { valid: true, code: best.coupon.code, discount: best.discount, description: best.coupon.description };
}

export type VisibleCoupon = { code: string; description: string; discount: number; audience: string };

// Every coupon this customer could currently apply, for display — e.g. the
// "Your coupons" list at checkout — so they can see and pick among several
// rather than needing to already know a code (or have just one silently
// chosen for them, which is all getEligibleAutoCoupon above does).
export async function getVisibleCouponsForUser(userId: string, subtotal: number): Promise<VisibleCoupon[]> {
  const coupons = await prisma.coupon.findMany({
    where: {
      active: true,
      minOrderAmount: { lte: subtotal },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: { createdAt: "desc" },
  });

  const visible: VisibleCoupon[] = [];
  for (const c of coupons) {
    if (await isAudienceEligible(c.audience, userId)) {
      visible.push({ code: c.code, description: c.description, discount: computeDiscount(c, subtotal), audience: c.audience });
    }
  }
  return visible;
}
