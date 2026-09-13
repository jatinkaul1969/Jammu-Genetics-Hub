import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES } from "@/lib/serviceable-areas";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();
  const now = new Date();

  const [products, categories] = await Promise.all([
    prisma.product.findMany({ select: { slug: true } }),
    prisma.category.findMany({ select: { slug: true } }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/search`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
  ];

  const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
    url: `${baseUrl}/search?category=${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  // City hub pages (/jammu, /mumbai) and the per-city, per-test landing
  // pages (/jammu/tests/nipt, etc.) — the pages actually built to answer
  // "{test} price in {city}" queries; see SERVICEABLE_CITIES for which
  // cities are real, fulfillable service areas.
  const cityEntries: MetadataRoute.Sitemap = SERVICEABLE_CITIES.map((c) => ({
    url: `${baseUrl}/${c.key}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.9,
  }));

  const cityTestEntries: MetadataRoute.Sitemap = SERVICEABLE_CITIES.flatMap((c) =>
    products.map((p) => ({
      url: `${baseUrl}/${c.key}/tests/${p.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    }))
  );

  return [...staticEntries, ...cityEntries, ...categoryEntries, ...productEntries, ...cityTestEntries];
}
