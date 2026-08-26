import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/staff-auth";
import { serializePermissions, STAFF_TEAMS } from "@/lib/permissions";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const username = typeof body?.username === "string" ? body.username.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const permissions: string[] = Array.isArray(body?.permissions)
    ? body.permissions.filter((p: unknown) => typeof p === "string")
    : [];
  const team = STAFF_TEAMS.some((t) => t.key === body?.team) ? body.team : "support";

  if (!name || !/^[a-z0-9._-]{3,32}$/.test(username) || password.length < 6) {
    return NextResponse.json(
      { ok: false, error: "Name required; username 3-32 chars (letters/numbers/._-); password min 6 chars." },
      { status: 400 }
    );
  }

  const existing = await prisma.adminUser.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json({ ok: false, error: "That username is already taken." }, { status: 409 });
  }

  const staff = await prisma.adminUser.create({
    data: {
      name,
      username,
      passwordHash: hashPassword(password),
      permissionsJson: serializePermissions(permissions),
      team,
    },
  });

  return NextResponse.json({ ok: true, staff: { id: staff.id, name: staff.name, username: staff.username } });
}
