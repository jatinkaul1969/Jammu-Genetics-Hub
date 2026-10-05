import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES } from "@/lib/serviceable-areas";
import { GENETICS_SLUGS } from "@/lib/genetics-content";
import { TEST_GROUPS } from "@/lib/test-knowledge";
import { getTestIndex } from "@/lib/test-index";
import { hubPath } from "@/lib/hub-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();
  const now = new Date();

  const [products, categories, testIndex] = await Promise.all([
    prisma.product.findMany({ select: { slug: true } }),
    prisma.category.findMany({ select: { slug: true } }),
    getTestIndex(),
  ]);

  const curated = new Set(GENETICS_SLUGS);
  const specialty = new Set(testIndex.entries.map((e) => e.slug));

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

  // /product/<slug> is the booking page; the city pages below are the pages
  // built to answer "{test} in {city}" searches, so the product pages rank
  // lower for the specialty tests (they would otherwise compete).
  const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${baseUrl}/product/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: specialty.has(p.slug) ? 0.4 : 0.8,
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
      // hand-written genetic tests > other genetic / oncology tests > routine tests
      priority: curated.has(p.slug) ? 0.95 : specialty.has(p.slug) ? 0.7 : 0.85,
    }))
  );

  // Genetic + oncology hubs, their per-group pages, and the genetic-counselling
  // page — entry points for "genetic testing in {city}", "oncology test in
  // {city}" and "{group} in {city}" searches.
  const hubEntries: MetadataRoute.Sitemap = SERVICEABLE_CITIES.flatMap((c) => [
    { url: `${baseUrl}${hubPath(c.key, "genetic")}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.95 },
    { url: `${baseUrl}${hubPath(c.key, "oncology")}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.95 },
    { url: `${baseUrl}/${c.key}/genetic-counselling`, lastModified: now, changeFrequency: "monthly" as const, priority: 0.9 },
    ...TEST_GROUPS.filter((g) => (testIndex.byGroup.get(g.name)?.length ?? 0) > 0).map((g) => ({
      url: `${baseUrl}${hubPath(c.key, g.hubs[0], g.slug)}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.85,
    })),
  ]);

  return [
    ...staticEntries,
    ...cityEntries,
    ...hubEntries,
    ...categoryEntries,
    ...productEntries,
    ...cityTestEntries,
  ];
}
