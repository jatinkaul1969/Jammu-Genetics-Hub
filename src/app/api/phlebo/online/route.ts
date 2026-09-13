import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPhlebo } from "@/lib/phlebo-session";
import { assignBacklogPickups } from "@/lib/phlebo-assignment";

export async function PATCH(req: Request) {
  const phlebo = await getCurrentPhlebo();
  if (!phlebo) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.online !== "boolean") {
    return NextResponse.json({ ok: false, error: "online must be a boolean." }, { status: 400 });
  }

  await prisma.phlebo.update({ where: { id: phlebo.id }, data: { online: body.online } });

  // Coming online: immediately sweep any pickups that piled up unassigned
  // while everyone was offline, so they don't sit waiting for a manual
  // assignment. Best-effort — never fail the toggle over it.
  let backlog: Awaited<ReturnType<typeof assignBacklogPickups>> | null = null;
  if (body.online) {
    backlog = await assignBacklogPickups().catch(() => null);
  }

  return NextResponse.json({ ok: true, backlog });
}
