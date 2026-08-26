import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/slug";

export async function POST(req: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const icon = typeof body?.icon === "string" ? body.icon : "Activity";
  const order = Number.isFinite(Number(body?.order)) ? Number(body.order) : 0;

  if (!name) return NextResponse.json({ ok: false, error: "Name is required." }, { status: 400 });

  let slug = slugify(name);
  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;

  const category = await prisma.category.create({ data: { slug, name, icon, order } });
  return NextResponse.json({ ok: true, category });
}
