import { NextResponse } from "next/server";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";
import { BOOKING_STATUSES } from "@/lib/booking-status";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "bookings")) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const status = typeof body?.status === "string" ? body.status : undefined;
  const adminNote = typeof body?.adminNote === "string" ? body.adminNote : undefined;

  if (status && !BOOKING_STATUSES.includes(status as (typeof BOOKING_STATUSES)[number])) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }

  const booking = await prisma.booking.update({
    where: { id },
    data: {
      ...(status ? { status } : {}),
      ...(adminNote !== undefined ? { adminNote } : {}),
    },
  });

  return NextResponse.json({ ok: true, booking });
}
