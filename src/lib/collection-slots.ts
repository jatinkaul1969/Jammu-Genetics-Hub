// Shared by the checkout form (client) and create-booking.ts (server) so the
// slot list a customer sees and the fee amounts actually charged can never
// drift apart. Fee amounts are always trusted from here, never from the
// client — the client only ever sends its choice of date/slot/add-ons.

export const COLLECTION_START_HOUR = 6; // 6 AM
export const COLLECTION_END_HOUR = 20; // 8 PM — last slot starts at 7 PM
export const EXPRESS_WINDOW_MINUTES = 90; // same-day is only offered for slots starting within this window of the request — not the rest of the day

export const DIAGNOSTIC_FEE = 49;
export const EXPRESS_FEE = 150;
export const HARD_COPY_FEE = 149;
export const MEMBERSHIP_FEE = 199;
export const MEMBERSHIP_DISCOUNT_PERCENT = 10;
export const MEMBERSHIP_VALID_DAYS = 365;

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function formatHour12(hour: number) {
  const period = hour < 12 || hour === 24 ? "AM" : "PM";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${pad2(h12)}:00 ${period}`;
}

export function isoDate(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function todayIso() {
  return isoDate(new Date());
}

export function isMembershipActive(user: { membershipActive: boolean; membershipExpiresAt: Date | null }) {
  return Boolean(user.membershipActive && user.membershipExpiresAt && user.membershipExpiresAt.getTime() > Date.now());
}

export function isExpressDate(dateIso: string) {
  return dateIso === todayIso();
}

export function getCollectionDates(days = 7) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return {
      iso: isoDate(d),
      label: d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" }),
      isToday: i === 0,
    };
  });
}

export type CollectionSlot = { label: string; isExpress: boolean };

// Formatted "06:00 AM - 07:00 AM" slots, hourly, within operating hours.
// For today, slots that have already started are dropped, and slots
// starting within EXPRESS_WINDOW_MINUTES of the request are tagged
// isExpress (the ₹150 fee applies only to those) — later slots today are
// still offered, just at the normal price, same as a future date.
export function getSlotsForDate(dateIso: string): CollectionSlot[] {
  const isToday = isExpressDate(dateIso);
  const now = new Date();
  const expressWindowEnd = isToday ? new Date(now.getTime() + EXPRESS_WINDOW_MINUTES * 60_000) : null;

  const slots: CollectionSlot[] = [];
  for (let hour = COLLECTION_START_HOUR; hour < COLLECTION_END_HOUR; hour++) {
    const label = `${formatHour12(hour)} - ${formatHour12(hour + 1)}`;
    if (isToday) {
      const [y, m, d] = dateIso.split("-").map(Number);
      const slotStart = new Date(y, m - 1, d, hour, 0, 0, 0);
      if (slotStart <= now) continue; // already started
      slots.push({ label, isExpress: slotStart <= expressWindowEnd! });
    } else {
      slots.push({ label, isExpress: false });
    }
  }
  return slots;
}

export function isExpressSlot(dateIso: string, slotLabel: string): boolean {
  return getSlotsForDate(dateIso).some((s) => s.label === slotLabel && s.isExpress);
}
