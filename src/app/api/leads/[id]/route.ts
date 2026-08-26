import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";
import { LEAD_STATUSES as STATUSES } from "@/lib/lead-status";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "leads")) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const lead = await prisma.lead.findUnique({ where: { id } });
  if (!lead) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  // Staff can only act on leads assigned to them; the owner can act on any.
  if (actor.type === "staff" && lead.assignedToId !== actor.staff.id) {
    return NextResponse.json({ ok: false, error: "This lead isn't assigned to you." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const data: Record<string, unknown> = {};

  if (typeof body?.status === "string") {
    if (!STATUSES.includes(body.status)) {
      return NextResponse.json({ ok: false, error: "Invalid status." }, { status: 400 });
    }
    data.status = body.status;
  }

  // Reassigning to a different staff member is an owner-only action.
  if (body?.assignedToId !== undefined) {
    if (actor.type !== "owner") {
      return NextResponse.json({ ok: false, error: "Only the owner can reassign leads." }, { status: 403 });
    }
    data.assignedToId = body.assignedToId || null;
  }

  const updated = await prisma.lead.update({ where: { id }, data });
  return NextResponse.json({ ok: true, lead: updated });
}
