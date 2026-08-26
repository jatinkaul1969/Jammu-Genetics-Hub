import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";

// Polled by the customer's "track your pickup" card and by the admin/staff
// pickups views. Phlebo identity is only revealed once they've ACCEPTED —
// before that it could still change hands, and after a cancel it goes back
// to "assigning" rather than showing a stale name.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { phlebo: true, user: true },
  });
  if (!booking) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const [user, actor] = await Promise.all([getCurrentUser(), getAdminActor()]);
  const isOwner = user && user.id === booking.userId;
  const isTeam = actorHasPermission(actor, "pickups") || actorHasPermission(actor, "bookings");
  if (!isOwner && !isTeam) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const revealed = ["ACCEPTED", "EN_ROUTE", "ARRIVED", "COLLECTED"].includes(booking.phleboStatus) || isTeam;
  const phlebo =
    revealed && booking.phlebo
      ? {
          name: booking.phlebo.name,
          phone: booking.phlebo.phone,
          lat: booking.phleboStatus === "EN_ROUTE" || isTeam ? booking.phlebo.currentLat : null,
          lng: booking.phleboStatus === "EN_ROUTE" || isTeam ? booking.phlebo.currentLng : null,
          locationUpdatedAt: booking.phlebo.locationUpdatedAt,
        }
      : null;

  // Full timestamped history — only for the internal team, who are the ones
  // that actually need "when did each thing happen" on record.
  const events = isTeam
    ? await prisma.pickupEvent.findMany({ where: { bookingId: id }, orderBy: { createdAt: "asc" } })
    : [];

  return NextResponse.json({
    phleboStatus: booking.phleboStatus,
    scheduledDate: booking.scheduledDate,
    scheduledSlot: booking.scheduledSlot,
    destination: { lat: booking.latitude, lng: booking.longitude },
    phlebo,
    timestamps: isTeam
      ? {
          assignedAt: booking.phleboAssignedAt,
          acceptedAt: booking.phleboRespondedAt,
          enRouteAt: booking.phleboEnRouteAt,
          arrivedAt: booking.phleboArrivedAt,
          collectedAt: booking.phleboCollectedAt,
        }
      : null,
    events: events.map((e) => ({ status: e.status, actor: e.actor, createdAt: e.createdAt })),
  });
}
