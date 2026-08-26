import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";

// A call/update log entry on a lead — the whole point is continuity: if a
// different staff member (or the same one, later) opens this lead again,
// they see exactly what was said last, instead of starting cold.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "leads")) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  if (actor.type === "staff" && lead.assignedToId !== actor.staff.id) {
    return NextResponse.json({ ok: false, error: "This lead isn't assigned to you." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > 2000) {
    return NextResponse.json({ ok: false, error: "Note must be 1-2000 characters." }, { status: 400 });
  }

  const note = await prisma.leadNote.create({
    data: {
      leadId: id,
      adminId: actor.type === "staff" ? actor.staff.id : null,
      body: text,
    },
  });

  return NextResponse.json({ ok: true, note });
}
