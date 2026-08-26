import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const products = await prisma.product.findMany({
    where: { name: { contains: q, mode: "insensitive" } },
    include: { category: true, prices: { where: { lab: { isOwn: true } }, take: 1 } },
    take: 8,
  });

  // Prefix matches first, then alphabetical — gives more relevant suggestions
  // than raw DB order without needing full-text search.
  const lower = q.toLowerCase();
  products.sort((a, b) => {
    const aStarts = a.name.toLowerCase().startsWith(lower) ? 0 : 1;
    const bStarts = b.name.toLowerCase().startsWith(lower) ? 0 : 1;
    if (aStarts !== bStarts) return aStarts - bStarts;
    return a.name.localeCompare(b.name);
  });

  return NextResponse.json({
    results: products.slice(0, 6).map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.category.name,
      type: p.type,
      price: p.prices[0]?.price ?? null,
    })),
  });
}
