import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/staff-auth";
import { serializePermissions, STAFF_TEAMS } from "@/lib/permissions";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (typeof body.enabled === "boolean") data.enabled = body.enabled;
  if (STAFF_TEAMS.some((t) => t.key === body.team)) data.team = body.team;
  if (Array.isArray(body.permissions)) {
    data.permissionsJson = serializePermissions(body.permissions.filter((p: unknown) => typeof p === "string"));
  }
  if (typeof body.password === "string" && body.password) {
    if (body.password.length < 6) {
      return NextResponse.json({ ok: false, error: "Password must be at least 6 characters." }, { status: 400 });
    }
    data.passwordHash = hashPassword(body.password);
  }

  const staff = await prisma.adminUser.update({ where: { id }, data });
  return NextResponse.json({ ok: true, staff: { id: staff.id, name: staff.name, enabled: staff.enabled } });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;

  // Unassign their leads rather than blocking deletion — history (notes,
  // the leads themselves) stays intact, just ownerless until reassigned.
  await prisma.lead.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });
  await prisma.leadNote.updateMany({ where: { adminId: id }, data: { adminId: null } });
  await prisma.adminUser.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
