import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });

  const data: Record<string, unknown> = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();
  if (body.type === "TEST" || body.type === "PACKAGE") data.type = body.type;
  if (typeof body.categoryId === "string" && body.categoryId) data.categoryId = body.categoryId;
  if (Number.isFinite(Number(body.parameters))) data.parameters = Number(body.parameters);
  if (typeof body.sampleType === "string" && body.sampleType.trim()) data.sampleType = body.sampleType.trim();
  if (typeof body.fasting === "boolean") data.fasting = body.fasting;
  if (body.fastingHours === null || Number.isFinite(Number(body.fastingHours))) {
    data.fastingHours = body.fastingHours === null ? null : Number(body.fastingHours);
  }
  if (Number.isFinite(Number(body.reportHours))) data.reportHours = Number(body.reportHours);
  if (["male", "female", "both"].includes(body.gender)) data.gender = body.gender;
  if (Number.isFinite(Number(body.minAge))) data.minAge = Number(body.minAge);
  if (typeof body.description === "string" && body.description.trim()) data.description = body.description.trim();
  if (typeof body.about === "string") data.about = body.about.trim();
  if (Array.isArray(body.includes)) {
    data.includesJson = JSON.stringify(body.includes.filter((s: unknown) => typeof s === "string" && s.trim()));
  }
  if (typeof body.popular === "boolean") data.popular = body.popular;
  if (body.badge === null || typeof body.badge === "string") data.badge = body.badge?.trim() || null;

  const product = await prisma.product.update({ where: { id }, data });
  return NextResponse.json({ ok: true, product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return NextResponse.json({ ok: false, error: "Not found." }, { status: 404 });

  const bookingItemCount = await prisma.bookingItem.count({ where: { productName: product.name } });
  if (bookingItemCount > 0) {
    return NextResponse.json(
      { ok: false, error: "This product has existing bookings and can't be deleted." },
      { status: 409 }
    );
  }

  await prisma.price.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
