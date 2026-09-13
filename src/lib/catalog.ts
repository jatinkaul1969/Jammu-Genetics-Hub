import { prisma } from "@/lib/prisma";

export async function getCategories() {
  return prisma.category.findMany({ orderBy: { order: "asc" } });
}

export async function getLabs() {
  return prisma.lab.findMany({ orderBy: [{ isOwn: "desc" }, { name: "asc" }] });
}

async function withLowestPrice<T extends { id: string }>(products: T[]) {
  if (products.length === 0) return [];
  const prices = await prisma.price.findMany({
    where: { productId: { in: products.map((p) => p.id) } },
    include: { lab: true },
  });
  return products.map((product) => {
    const productPrices = prices.filter((pr) => pr.productId === product.id);
    const own = productPrices.find((pr) => pr.lab.isOwn);
    const lowest = productPrices.reduce(
      (min, pr) => (min === null || pr.price < min.price ? pr : min),
      null as (typeof productPrices)[number] | null
    );
    const highestMrp = productPrices.reduce((max, pr) => Math.max(max, pr.mrp), 0);
    return {
      ...product,
      ownPrice: own?.price ?? lowest?.price ?? 0,
      ownMrp: own?.mrp ?? highestMrp,
      lowestPrice: lowest?.price ?? 0,
      lowestLabName: lowest?.lab.shortName ?? "",
      labCount: productPrices.length,
      highestMrp,
    };
  });
}

export async function getPopularProducts(limit = 8) {
  const products = await prisma.product.findMany({
    where: { popular: true },
    include: { category: true },
    take: limit,
  });
  return withLowestPrice(products);
}

export async function getProductsByCategory(categorySlug: string) {
  const products = await prisma.product.findMany({
    where: { category: { slug: categorySlug } },
    include: { category: true },
  });
  return withLowestPrice(products);
}

export async function searchProducts(query: string, categorySlug?: string, type?: string) {
  const products = await prisma.product.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
              ],
            }
          : {},
        categorySlug ? { category: { slug: categorySlug } } : {},
        type ? { type } : {},
      ],
    },
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return withLowestPrice(products);
}

// Every product's slug + category slug — used to statically generate the
// per-city test-price landing pages (src/app/(site)/[city]/tests/[slug])
// and the sitemap, without needing a separate DB round trip for each.
export async function getAllProductSlugs() {
  return prisma.product.findMany({
    select: { slug: true, category: { select: { slug: true } } },
    orderBy: { slug: "asc" },
  });
}

export async function getProductBySlug(slug: string) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      prices: { include: { lab: true }, orderBy: { price: "asc" } },
    },
  });
  return product;
}
