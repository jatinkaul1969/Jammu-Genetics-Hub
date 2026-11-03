import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES, cityByKey } from "@/lib/serviceable-areas";
import { inheritedShareImages } from "@/lib/seo";
import { HUBS, hubPath } from "@/lib/hub-config";
import { groupCounts, hubProductsByGroup } from "@/lib/test-index";
import { HubView } from "@/components/TestHubViews";

// Served from cache and refreshed hourly — landing pages must be fast for
// Google's crawler and for patients on mobile.
export const revalidate = 3600;

export function generateStaticParams() {
  return SERVICEABLE_CITIES.map((c) => ({ city: c.key }));
}

export const dynamicParams = false;

const HUB = "genetic" as const;

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { city: cityKey } = await params;
  const city = cityByKey(cityKey);
  if (!city) return {};

  const cfg = HUBS[HUB];
  const total = (await groupCounts(HUB)).reduce((n, g) => n + g.count, 0);
  const title = cfg.title(city.label);
  const description = cfg.description(city.label, total);
  const url = hubPath(city.key, HUB);
  const shareImages = await inheritedShareImages(parent);

  return {
    title,
    description,
    keywords: cfg.keywords(city.label),
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url, images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

export default async function GeneticTestsHubPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityKey } = await params;
  const city = cityByKey(cityKey);
  if (!city) notFound();

  const [groups, baseUrl] = await Promise.all([hubProductsByGroup(HUB, 6), getBaseUrl()]);
  return <HubView city={city} hub={HUB} baseUrl={baseUrl} groups={groups} />;
}
