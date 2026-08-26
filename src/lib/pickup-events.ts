import { prisma } from "@/lib/prisma";

// Maps a phlebo status to the Booking column that records exactly when it
// was reached — the single source for "which timestamp goes with which
// status" so the phlebo route, the admin reassign route, and auto-assignment
// all stay consistent instead of re-deriving this mapping separately.
const TIMESTAMP_FIELD: Record<string, string | null> = {
  ASSIGNED: "phleboAssignedAt",
  ACCEPTED: "phleboRespondedAt",
  EN_ROUTE: "phleboEnRouteAt",
  ARRIVED: "phleboArrivedAt",
  COLLECTED: "phleboCollectedAt",
  UNASSIGNED: null,
  CANCELLED_BY_PHLEBO: null,
};

// Records a status change on a booking: sets the matching timestamp column
// (if that status has one) and appends a permanent PickupEvent row, so the
// full history survives even once Booking's own fields move on to the next
// stage.
export async function recordPickupStatus(bookingId: string, status: string, actor: "system" | "phlebo" | "owner" | "staff") {
  const field = TIMESTAMP_FIELD[status];
  await prisma.$transaction([
    prisma.booking.update({
      where: { id: bookingId },
      data: field ? { [field]: new Date() } : {},
    }),
    prisma.pickupEvent.create({ data: { bookingId, status, actor } }),
  ]);
}
