import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES, cityByKey } from "@/lib/serviceable-areas";
import { inheritedShareImages } from "@/lib/seo";
import { HUBS, hubPath } from "@/lib/hub-config";
import { TEST_GROUPS } from "@/lib/test-knowledge";
import { groupCounts, groupForHubSlug, slugsInGroup } from "@/lib/test-index";
import { getProductsBySlugs } from "@/lib/catalog";
import { GroupView } from "@/components/TestHubViews";

const HUB = "oncology" as const;

export function generateStaticParams() {
  return SERVICEABLE_CITIES.flatMap((c) =>
    TEST_GROUPS.filter((g) => g.hubs[0] === HUB).map((g) => ({ city: c.key, group: g.slug }))
  );
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; group: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { city: cityKey, group: groupSlug } = await params;
  const city = cityByKey(cityKey);
  const group = groupForHubSlug(HUB, groupSlug);
  if (!city || !group) return {};

  const count = (await slugsInGroup(group.name)).length;
  const cfg = HUBS[HUB];
  const title = cfg.groupTitle(group.name, city.label);
  const description = cfg.groupDescription(group.name, city.label, count);
  const url = hubPath(city.key, HUB, group.slug);
  const shareImages = await inheritedShareImages(parent);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url, images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

export default async function OncologyGroupPage({ params }: { params: Promise<{ city: string; group: string }> }) {
  const { city: cityKey, group: groupSlug } = await params;
  const city = cityByKey(cityKey);
  const group = groupForHubSlug(HUB, groupSlug);
  if (!city || !group) notFound();

  const slugs = await slugsInGroup(group.name);
  if (slugs.length === 0) notFound();

  const [products, baseUrl, counts] = await Promise.all([getProductsBySlugs(slugs), getBaseUrl(), groupCounts(HUB)]);
  const order = new Map(slugs.map((s, i) => [s, i]));
  const sorted = products.filter((p) => p.lowestPrice > 0).sort((a, b) => order.get(a.slug)! - order.get(b.slug)!);

  return (
    <GroupView
      city={city}
      hub={HUB}
      baseUrl={baseUrl}
      group={group}
      products={sorted}
      siblingGroups={counts.map((c) => ({ group: c.group, total: c.count }))}
    />
  );
}
