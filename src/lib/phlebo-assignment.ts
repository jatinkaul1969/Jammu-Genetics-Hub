import { prisma } from "@/lib/prisma";
import { recordPickupStatus } from "@/lib/pickup-events";
import { todayIso } from "@/lib/collection-slots";

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

// Sweeps every still-unassigned own-lab pickup for today or later and runs
// the normal round-robin assignment on each. Needed because
// assignPhleboToBooking() otherwise only fires at booking-creation time — so
// a booking made while every phlebo was offline (e.g. overnight) would stay
// UNASSIGNED forever, waiting on a person to notice and assign it by hand.
// Called when a phlebo comes online, and by GET /api/cron/assign-pickups as
// a safety net. Returns how many pickups it managed to place.
export async function assignBacklogPickups(): Promise<{ assigned: number; pending: number }> {
  const ownLabs = await prisma.lab.findMany({ where: { isOwn: true }, select: { id: true } });
  const ownLabIds = ownLabs.map((l) => l.id);
  if (ownLabIds.length === 0) return { assigned: 0, pending: 0 };

  const backlog = await prisma.booking.findMany({
    where: {
      labId: { in: ownLabIds },
      phleboStatus: "UNASSIGNED",
      status: { notIn: ["CANCELLED", "REPORT_READY"] },
      scheduledDate: { gte: todayIso() },
    },
    orderBy: [{ scheduledDate: "asc" }, { createdAt: "asc" }],
    select: { id: true },
  });

  let assigned = 0;
  for (const b of backlog) {
    const chosen = await assignPhleboToBooking(b.id);
    if (chosen) assigned++;
    else break; // no online/enabled phlebo at all — leave the rest queued
  }
  return { assigned, pending: backlog.length - assigned };
}
