import { prisma } from "@/lib/prisma";
import { recordPickupStatus } from "@/lib/pickup-events";

const OPEN_PHLEBO_STATUSES = ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED"];

// Round-robin by same-day workload: among phlebos who are online, enabled,
// assign to whoever has the fewest OPEN pickups on the SAME scheduled date
// (not all-time — a phlebo isn't "busy" forever just because they had a
// pickup yesterday). Only ever runs for our own lab's bookings — a
// competitor lab dispatches its own phlebotomist. `excludePhleboId` is used
// when a phlebo has just cancelled, so the same person isn't immediately
// handed the booking straight back.
export async function assignPhleboToBooking(bookingId: string, excludePhleboId?: string) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) return null;
  const lab = await prisma.lab.findUnique({ where: { id: booking.labId } });
  if (!lab || !lab.isOwn) return null;

  const candidates = await prisma.phlebo.findMany({
    where: { enabled: true, online: true, ...(excludePhleboId ? { id: { not: excludePhleboId } } : {}) },
    include: {
      bookings: {
        where: { scheduledDate: booking.scheduledDate, phleboStatus: { in: OPEN_PHLEBO_STATUSES } },
        select: { id: true },
      },
    },
  });
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    const diff = a.bookings.length - b.bookings.length;
    if (diff !== 0) return diff;
    const aTime = a.lastAssignedAt?.getTime() ?? 0;
    const bTime = b.lastAssignedAt?.getTime() ?? 0;
    return aTime - bTime;
  });

  const chosen = candidates[0];
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        phleboId: chosen.id,
        phleboStatus: "ASSIGNED",
        phleboRespondedAt: null,
        phleboEnRouteAt: null,
        phleboArrivedAt: null,
        phleboCollectedAt: null,
        reminderSentAt: null,
      },
    }),
    prisma.phlebo.update({ where: { id: chosen.id }, data: { lastAssignedAt: new Date() } }),
  ]);
  await recordPickupStatus(bookingId, "ASSIGNED", "system");

  return chosen.id;
}
