import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPhlebo } from "@/lib/phlebo-session";
import { assignPhleboToBooking } from "@/lib/phlebo-assignment";
import { parseSlotStart } from "@/lib/pickup-time";
import { recordPickupStatus } from "@/lib/pickup-events";

const CANCEL_CUTOFF_MS = 60 * 60 * 1000; // 1 hour before the scheduled slot

// The phlebo's own status control (a dropdown on the pickup detail page) —
// ACCEPTED -> EN_ROUTE -> ARRIVED -> COLLECTED, normally in order, but not
// rigidly enforced beyond "you haven't collected yet" since a phlebo might
// need to correct a status they tapped by mistake. COLLECTED also flips the
// booking's own `status` to COLLECTED, feeding the existing admin pipeline.
// Every change — including this one — is timestamped and logged permanently
// via recordPickupStatus, regardless of which status is chosen.
const SETTABLE_STATUSES = ["ACCEPTED", "EN_ROUTE", "ARRIVED", "COLLECTED"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const phlebo = await getCurrentPhlebo();
  if (!phlebo) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });
  if (booking.phleboId !== phlebo.id) {
    return NextResponse.json({ ok: false, error: "This pickup isn't assigned to you." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const action = typeof body?.action === "string" ? body.action : "";

  if (action === "cancel") {
    if (!["ASSIGNED", "ACCEPTED", "EN_ROUTE"].includes(booking.phleboStatus)) {
      return NextResponse.json({ ok: false, error: "This pickup can no longer be cancelled." }, { status: 400 });
    }
    const slotStart = parseSlotStart(booking.scheduledDate, booking.scheduledSlot);
    if (slotStart && slotStart.getTime() - Date.now() < CANCEL_CUTOFF_MS) {
      return NextResponse.json(
        { ok: false, error: "Too close to the scheduled slot — cancellations must be at least 1 hour before." },
        { status: 400 }
      );
    }

    await prisma.booking.update({
      where: { id },
      data: { phleboId: null, phleboStatus: "UNASSIGNED" },
    });
    await recordPickupStatus(id, "CANCELLED_BY_PHLEBO", "phlebo");
    await assignPhleboToBooking(id, phlebo.id);
    return NextResponse.json({ ok: true });
  }

  const status = typeof body?.status === "string" ? body.status : "";
  if (booking.phleboStatus === "COLLECTED") {
    return NextResponse.json({ ok: false, error: "This pickup is already complete." }, { status: 400 });
  }
  if (!SETTABLE_STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
  }

  await prisma.booking.update({
    where: { id },
    data: {
      phleboStatus: status,
      ...(status === "COLLECTED" && booking.status !== "CANCELLED" ? { status: "COLLECTED" } : {}),
    },
  });
  await recordPickupStatus(id, status, "phlebo");

  return NextResponse.json({ ok: true });
}
