import { prisma } from "@/lib/prisma";
import { validateCoupon } from "@/lib/coupons";
import { assignPhleboToBooking } from "@/lib/phlebo-assignment";
import {
  DIAGNOSTIC_FEE,
  EXPRESS_FEE,
  HARD_COPY_FEE,
  MEMBERSHIP_FEE,
  MEMBERSHIP_DISCOUNT_PERCENT,
  MEMBERSHIP_VALID_DAYS,
  isExpressSlot,
  isMembershipActive,
  todayIso,
} from "@/lib/collection-slots";

function generateBookingCode() {
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `JGH${rand}`;
}

export type IncomingItem = { productId: string; productName: string; labId: string; price: number; mrp: number };

type CreateBookingsParams = {
  userId: string;
  items: IncomingItem[];
  phone: string;
  scheduledDate: string;
  scheduledSlot: string;
  couponCode?: string;
  wantsHardCopy?: boolean;
  wantsMembership?: boolean;
  patient: {
    id?: string;
    name?: string;
    age?: number;
    gender?: string;
    relationship?: string;
  };
  address: {
    id?: string;
    label?: string;
    addressLine?: string;
    city?: string;
    pincode?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
  // Set when a staff member is booking on behalf of the customer (over a
  // call), rather than the customer booking it themselves.
  bookedByStaffId?: string | null;
  // Set when a phlebotomist books an additional test on the spot at the
  // patient's home, rather than the customer booking it themselves.
  bookedByPhleboId?: string | null;
};

// Shared by the customer-facing checkout (POST /api/bookings) and the
// sales/admin "book for a customer" flow — same validation, same per-lab
// splitting, same coupon handling and phlebo auto-assignment either way, so
// a staff-created booking is indistinguishable from a self-service one
// except for the bookedByStaffId attribution.
export async function createBookingsForUser(
  params: CreateBookingsParams
): Promise<{ ok: true; bookingCodes: string[] } | { ok: false; error: string }> {
  const {
    userId,
    items,
    phone,
    scheduledDate,
    scheduledSlot,
    couponCode,
    wantsHardCopy,
    wantsMembership,
    patient,
    address,
    bookedByStaffId,
    bookedByPhleboId,
  } = params;

  if (
    items.length === 0 ||
    !/^[6-9]\d{9}$/.test(phone) ||
    !scheduledDate ||
    !scheduledSlot ||
    scheduledDate < todayIso() ||
    (!patient.id && (!patient.name || !Number.isFinite(patient.age))) ||
    (!address.id && (!address.addressLine || !address.city || !address.pincode))
  ) {
    return { ok: false, error: "Please fill in all required fields." };
  }

  let patientId: string;
  let patientName: string;
  let patientAge: number;

  if (patient.id) {
    const found = await prisma.patient.findFirst({ where: { id: patient.id, userId } });
    if (!found) return { ok: false, error: "That patient wasn't found on this account." };
    patientId = found.id;
    patientName = found.name;
    patientAge = found.age;
  } else {
    const created = await prisma.patient.create({
      data: {
        userId,
        name: patient.name!.trim(),
        age: Math.round(patient.age!),
        gender: patient.gender,
        relationship: patient.relationship || "other",
      },
    });
    patientId = created.id;
    patientName = created.name;
    patientAge = created.age;
  }

  let addressId: string;
  let addressLine: string;
  let city: string;
  let pincode: string;
  let latitude: number | null;
  let longitude: number | null;

  if (address.id) {
    const found = await prisma.address.findFirst({ where: { id: address.id, userId } });
    if (!found) return { ok: false, error: "That address wasn't found on this account." };
    addressId = found.id;
    addressLine = found.addressLine;
    city = found.city;
    pincode = found.pincode;
    latitude = found.latitude;
    longitude = found.longitude;
  } else {
    if (!/^\d{6}$/.test(address.pincode ?? "")) {
      return { ok: false, error: "Enter a valid 6-digit pincode." };
    }
    const created = await prisma.address.create({
      data: {
        userId,
        label: address.label?.trim() || "Home",
        addressLine: address.addressLine!.trim(),
        city: address.city!.trim(),
        pincode: address.pincode!,
        latitude: Number.isFinite(address.latitude) ? (address.latitude as number) : null,
        longitude: Number.isFinite(address.longitude) ? (address.longitude as number) : null,
        isDefault: (await prisma.address.count({ where: { userId } })) === 0,
      },
    });
    addressId = created.id;
    addressLine = created.addressLine;
    city = created.city;
    pincode = created.pincode;
    latitude = created.latitude;
    longitude = created.longitude;
  }

  const cartSubtotal = items.reduce((s, i) => s + i.price, 0);

  let couponDiscount = 0;
  let appliedCouponCode: string | null = null;
  if (couponCode) {
    const result = await validateCoupon(couponCode, cartSubtotal, userId);
    if (!result.valid) return { ok: false, error: result.error };
    couponDiscount = result.discount;
    appliedCouponCode = result.code;
  }

  // Membership: a standing 10% off every booking, bought once for a flat fee
  // (vs. a one-off coupon code). Buying it at checkout also discounts the
  // order that bought it. Never stacks with a coupon — whichever discount is
  // larger wins, matching the "pick the best deal" tone used elsewhere.
  const userRow = await prisma.user.findUnique({
    where: { id: userId },
    select: { membershipActive: true, membershipExpiresAt: true },
  });
  const isActiveMember = Boolean(userRow && isMembershipActive(userRow));
  const buyingMembership = Boolean(wantsMembership) && !isActiveMember;
  const effectiveMember = isActiveMember || buyingMembership;
  const membershipDiscount = effectiveMember ? Math.round((cartSubtotal * MEMBERSHIP_DISCOUNT_PERCENT) / 100) : 0;

  const useMembershipDiscount = membershipDiscount > couponDiscount;
  const finalDiscount = useMembershipDiscount ? membershipDiscount : couponDiscount;
  const finalDiscountKind: "COUPON" | "MEMBERSHIP" | null =
    finalDiscount === 0 ? null : useMembershipDiscount ? "MEMBERSHIP" : "COUPON";
  const finalCouponCode = finalDiscountKind === "COUPON" ? appliedCouponCode : null;

  const isExpress = isExpressSlot(scheduledDate, scheduledSlot);

  const byLab = new Map<string, IncomingItem[]>();
  for (const item of items) {
    const list = byLab.get(item.labId) ?? [];
    list.push(item);
    byLab.set(item.labId, list);
  }

  const created: string[] = [];
  let discountRemaining = finalDiscount;
  const labEntries = [...byLab.entries()];
  for (let i = 0; i < labEntries.length; i++) {
    const [labId, labItems] = labEntries[i];
    const totalMrp = labItems.reduce((s, i) => s + i.mrp, 0);
    const subtotal = labItems.reduce((s, i) => s + i.price, 0);
    const isFirst = i === 0;
    const isLast = i === labEntries.length - 1;
    const discountShare = isLast ? discountRemaining : Math.round((finalDiscount * subtotal) / cartSubtotal);
    discountRemaining -= discountShare;

    const diagnosticFee = DIAGNOSTIC_FEE;
    const expressFee = isExpress ? EXPRESS_FEE : 0;
    const hardCopyFee = wantsHardCopy ? HARD_COPY_FEE : 0;
    const membershipFee = isFirst && buyingMembership ? MEMBERSHIP_FEE : 0;

    const booking = await prisma.booking.create({
      data: {
        bookingCode: generateBookingCode(),
        userId,
        labId,
        scheduledDate,
        scheduledSlot,
        patientId,
        patientName,
        patientAge: Math.round(patientAge),
        addressId,
        addressLine,
        city,
        pincode,
        latitude,
        longitude,
        phone,
        totalMrp,
        totalAmount: subtotal - discountShare + diagnosticFee + expressFee + hardCopyFee + membershipFee,
        couponCode: finalCouponCode,
        discountAmount: discountShare,
        discountKind: discountShare > 0 ? finalDiscountKind : null,
        diagnosticFee,
        expressFee,
        hardCopyFee,
        membershipFee,
        bookedByStaffId: bookedByStaffId ?? null,
        bookedByPhleboId: bookedByPhleboId ?? null,
        items: {
          create: labItems.map((i) => ({ productName: i.productName, price: i.price, mrp: i.mrp })),
        },
      },
    });
    created.push(booking.bookingCode);
    await assignPhleboToBooking(booking.id);
  }

  if (buyingMembership) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        membershipActive: true,
        membershipExpiresAt: new Date(Date.now() + MEMBERSHIP_VALID_DAYS * 24 * 60 * 60 * 1000),
      },
    });
  }

  await prisma.cartSnapshot.deleteMany({ where: { userId } });

  return { ok: true, bookingCodes: created };
}
