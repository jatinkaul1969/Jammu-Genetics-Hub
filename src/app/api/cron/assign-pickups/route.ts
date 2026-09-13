import { NextResponse } from "next/server";
import { assignBacklogPickups } from "@/lib/phlebo-assignment";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";

// Safety-net sweep for own-lab pickups still sitting UNASSIGNED (today or
// later) — assigns each via the normal round-robin. The phlebo "go online"
// handler already does this on demand; this covers the case where bookings
// come in while a phlebo is already online but the create-time assignment
// somehow didn't land, or where nobody toggles their status for a while.
//
// Nothing calls this on its own — point an external scheduler (Vercel Cron,
// an OS cron job, etc.) at /api/cron/assign-pickups?secret=<CRON_SECRET>
// every few minutes. Protected by CRON_SECRET when that env var is set.
export async function GET(req: Request) {
  if (!isAuthorizedCronRequest(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const result = await assignBacklogPickups();
  return NextResponse.json({ ok: true, ...result });
}
