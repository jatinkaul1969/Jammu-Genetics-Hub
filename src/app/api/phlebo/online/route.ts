import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentPhlebo } from "@/lib/phlebo-session";

export async function PATCH(req: Request) {
  const phlebo = await getCurrentPhlebo();
  if (!phlebo) return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (typeof body?.online !== "boolean") {
    return NextResponse.json({ ok: false, error: "online must be a boolean." }, { status: 400 });
  }

  await prisma.phlebo.update({ where: { id: phlebo.id }, data: { online: body.online } });
  return NextResponse.json({ ok: true });
}
