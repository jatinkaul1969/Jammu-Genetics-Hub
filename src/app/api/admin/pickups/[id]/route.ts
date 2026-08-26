import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";
import { assignPhleboToBooking } from "@/lib/phlebo-assignment";
import { recordPickupStatus } from "@/lib/pickup-events";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "pickups")) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const body = await req.json().catch(() => null);

  if (body?.autoAssign === true) {
    const assignedId = await assignPhleboToBooking(id);
    if (!assignedId) {
      return NextResponse.json({ ok: false, error: "No online phlebotomist is available right now." }, { status: 409 });
    }
    return NextResponse.json({ ok: true });
  }

  if ("phleboId" in (body ?? {})) {
    if (actor.type !== "owner") {
      return NextResponse.json({ ok: false, error: "Only the owner can hand-pick a phlebotomist." }, { status: 403 });
    }
    const phleboId: string | null = body.phleboId || null;
    await prisma.booking.update({
      where: { id },
      data: phleboId
        ? {
            phleboId,
            phleboStatus: "ASSIGNED",
            phleboRespondedAt: null,
            phleboEnRouteAt: null,
            phleboArrivedAt: null,
            phleboCollectedAt: null,
            reminderSentAt: null,
          }
        : { phleboId: null, phleboStatus: "UNASSIGNED" },
    });
    await recordPickupStatus(id, phleboId ? "ASSIGNED" : "UNASSIGNED", "owner");
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ ok: false, error: "No action specified." }, { status: 400 });
}
