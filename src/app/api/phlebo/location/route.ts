import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPhlebo } from "@/lib/phlebo-session";

// Called periodically from the phlebo portal while "share live location" is
// active — stores only the latest position, not a track history.
export async function PATCH(req: Request) {
  const phlebo = await getCurrentPhlebo();
  if (!phlebo) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const lat = Number(body?.lat);
  const lng = Number(body?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return NextResponse.json({ ok: false, error: "lat/lng must be numbers." }, { status: 400 });
  }

  await prisma.phlebo.update({
    where: { id: phlebo.id },
    data: { currentLat: lat, currentLng: lng, locationUpdatedAt: new Date() },
  });
  return NextResponse.json({ ok: true });
}
