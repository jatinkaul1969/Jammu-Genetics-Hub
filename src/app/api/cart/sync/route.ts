import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

// Mirrors a logged-in user's client-side cart into the database, so the
// admin panel can spot "added items, never booked" and follow up. This is
// best-effort telemetry, not the cart's source of truth (that's still
// localStorage) — a failure here should never block shopping or checkout.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ok: true }); // guests aren't tracked

  const body = await req.json().catch(() => null);
  const items = Array.isArray(body?.items) ? body.items : [];

  if (items.length === 0) {
    await prisma.cartSnapshot.deleteMany({ where: { userId: user.id } });
    return NextResponse.json({ ok: true });
  }

  const itemsJson = JSON.stringify(
    items.map((i: { productName?: string; productSlug?: string; labName?: string; price?: number }) => ({
      productName: i.productName,
      productSlug: i.productSlug,
      labName: i.labName,
      price: i.price,
    }))
  );

  await prisma.cartSnapshot.upsert({
    where: { userId: user.id },
    update: { itemsJson },
    create: { userId: user.id, itemsJson },
  });

  return NextResponse.json({ ok: true });
}
