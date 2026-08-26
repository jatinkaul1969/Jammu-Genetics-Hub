import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/staff-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.phone === "string" && /^[6-9]\d{9}$/.test(body.phone)) data.phone = body.phone;
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (typeof body.password === "string" && body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }
    data.passwordHash = hashPassword(body.password);
  }

  const phlebo = await prisma.phlebo.update({ where: { id }, data });
  return NextResponse.json({ ok: true, phlebo: { id: phlebo.id, name: phlebo.name, enabled: phlebo.enabled } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;

  // Any pickups still open (not yet arrived) go back to unassigned so
  // they can be picked up by someone else; the DB's onDelete: SetNull
  // handles clearing phleboId on historical/completed ones automatically.
  await prisma.booking.updateMany({
    where: { phleboId: id, phleboStatus: { in: ["ASSIGNED", "ACCEPTED", "EN_ROUTE"] } },
    data: { phleboId: null, phleboStatus: "UNASSIGNED", phleboAssignedAt: null, phleboRespondedAt: null },
  });
  await prisma.phlebo.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
