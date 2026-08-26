import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";

export async function GET(req: Request) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "sales")) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json({ results: [] });

  const products = await prisma.product.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    include: { prices: { include: { lab: true }, orderBy: { price: "asc" } } },
    take: 10,
  });

  return NextResponse.json({
    results: products.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      prices: p.prices.map((pr) => ({
        labId: pr.labId,
        labName: pr.lab.name,
        labShortName: pr.lab.shortName,
        price: pr.price,
        mrp: pr.mrp,
      })),
    })),
  });
}
