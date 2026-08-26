import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentStaff } from "@/lib/staff-session";

// Staff self-toggle for "available for new leads" — only online (and
// enabled) staff receive new round-robin lead assignments.
export async function PATCH(req: Request) {
  const staff = await getCurrentStaff();
  if (!staff) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.online !== "boolean") {
    return NextResponse.json({ ok: false, error: "online must be a boolean." }, { status: 400 });
  }

  await prisma.adminUser.update({ where: { id: staff.id }, data: { online: body.online } });
  return NextResponse.json({ ok: true });
}
