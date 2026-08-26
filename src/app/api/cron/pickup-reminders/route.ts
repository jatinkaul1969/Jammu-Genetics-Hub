import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppText } from "@/lib/whatsapp-cloud";
import { parseSlotStart } from "@/lib/pickup-time";
import { buildPickupReminderMessage } from "@/lib/phlebo-notify";

// Not triggered by anything inside this app — Next.js has no built-in
// scheduler. This route only DOES the sending; something external needs to
// call it periodically (Vercel Cron, an OS cron job, a task scheduler...).
// See README "Phlebo pickups" section for setup.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = new URL(req.url).searchParams.get("secret");
  if (secret && provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.booking.findMany({
    where: { phleboStatus: { in: ["ACCEPTED", "EN_ROUTE"] }, reminderSentAt: null },
    include: { phlebo: true },
  });

  const now = Date.now();
  let sent = 0;
  for (const b of candidates) {
    if (!b.phlebo) continue;
    const slotStart = parseSlotStart(b.scheduledDate, b.scheduledSlot);
    if (!slotStart) continue;
    const minutesUntil = (slotStart.getTime() - now) / 60_000;
    // A small negative grace window so a cron run that's slightly late (or
    // runs every 15 min) still catches slots just past the ideal T-30 mark.
    if (minutesUntil <= 30 && minutesUntil > -15) {
      const message = buildPickupReminderMessage({
        patientName: b.patientName,
        slot: b.scheduledSlot,
        phleboName: b.phlebo.name,
        phleboPhone: b.phlebo.phone,
      });
      await sendWhatsAppText(b.phone, message);
      await prisma.booking.update({ where: { id: b.id }, data: { reminderSentAt: new Date() } });
      sent++;
    }
  }

  return NextResponse.json({ ok: true, sent, checked: candidates.length });
}
