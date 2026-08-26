import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

type PriceInput = { labId: string; price: number; mrp: number; testCode?: string | null };

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const prices: PriceInput[] = Array.isArray(body?.prices) ? body.prices : [];

  for (const p of prices) {
    if (typeof p.labId !== "string" || !Number.isFinite(p.price) || !Number.isFinite(p.mrp)) {
      return NextResponse.json({ ok: false, error: "Invalid price data." }, { status: 400 });
    }
    if (p.price < 0 || p.mrp < 0) {
      return NextResponse.json({ ok: false, error: "Prices can't be negative." }, { status: 400 });
    }
  }

  await Promise.all(
    prices.map((p) => {
      const testCode = typeof p.testCode === "string" && p.testCode.trim() ? p.testCode.trim() : null;
      return prisma.price.upsert({
        where: { productId_labId: { productId: id, labId: p.labId } },
        update: { price: Math.round(p.price), mrp: Math.round(p.mrp), testCode },
        create: { productId: id, labId: p.labId, price: Math.round(p.price), mrp: Math.round(p.mrp), testCode },
      });
    })
  );

  return NextResponse.json({ ok: true });
}

// Removes a single lab's pricing for this product — used when a product is
// sparse (not every lab offers it) and an admin needs to drop one that no
// longer applies, rather than leaving a stale ₹0 row.
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  const { id } = await params;
  const labId = new URL(req.url).searchParams.get("labId");
  if (!labId) return NextResponse.json({ ok: false, error: "labId is required." }, { status: 400 });

  await prisma.price.deleteMany({ where: { productId: id, labId } });
  return NextResponse.json({ ok: true });
}
