import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES } from "@/lib/serviceable-areas";
import { GENETICS_SLUGS } from "@/lib/genetics-content";
import { TEST_GROUPS } from "@/lib/test-knowledge";
import { getTestIndex } from "@/lib/test-index";
import { hubPath } from "@/lib/hub-config";

// Served from cache and refreshed hourly.
export const revalidate = 3600;

// The sitemap lists only the pages that should appear in search — the same
// set the pages themselves allow to be indexed (see the `robots` rule in
// [city]/tests/[testSlug]/page.tsx). It deliberately has no <lastmod>:
// stamping every URL with "now" is inaccurate and teaches Google to ignore it.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = await getBaseUrl();

  // Only tests that have at least one price get a page (the page 404s otherwise).
  const [products, testIndex] = await Promise.all([
    prisma.product.findMany({ where: { prices: { some: {} } }, select: { slug: true } }),
    getTestIndex(),
  ]);

  const curated = new Set(GENETICS_SLUGS);
  const specialty = new Set(testIndex.entries.map((e) => e.slug));

  const entries: MetadataRoute.Sitemap = [
    { url: baseUrl, priority: 1 },
    { url: `${baseUrl}/about`, priority: 0.5 },
    { url: `${baseUrl}/contact`, priority: 0.6 },
  ];

  for (const c of SERVICEABLE_CITIES) {
    entries.push(
      { url: `${baseUrl}/${c.key}`, priority: 0.9 },
      { url: `${baseUrl}${hubPath(c.key, "genetic")}`, priority: 0.95 },
      { url: `${baseUrl}${hubPath(c.key, "oncology")}`, priority: 0.95 },
      { url: `${baseUrl}/${c.key}/genetic-counselling`, priority: 0.9 }
    );
    for (const g of TEST_GROUPS) {
      if ((testIndex.byGroup.get(g.name)?.length ?? 0) === 0) continue;
      entries.push({ url: `${baseUrl}${hubPath(c.key, g.hubs[0], g.slug)}`, priority: 0.85 });
    }
    for (const p of products) {
      if (!c.indexAllTests && !curated.has(p.slug)) continue;
      entries.push({
        url: `${baseUrl}/${c.key}/tests/${p.slug}`,
        // hand-written genetic tests > other genetic / oncology tests > routine tests
        priority: curated.has(p.slug) ? 0.95 : specialty.has(p.slug) ? 0.7 : 0.8,
      });
    }
  }

  return entries;
}
