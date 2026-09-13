import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { ArrowRight, MapPin, Home as HomeIcon, ScanSearch } from "lucide-react";
import { getCategories, getPopularProducts, getLabs } from "@/lib/catalog";
import { CategoryRail } from "@/components/CategoryRail";
import { ProductCard } from "@/components/ProductCard";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES, cityByKey } from "@/lib/serviceable-areas";
import { inheritedShareImages, buildBusinessJsonLd } from "@/lib/seo";

export function generateStaticParams() {
  return SERVICEABLE_CITIES.map((c) => ({ city: c.key }));
}

// Only the cities we actually serve get a page — everything else 404s,
// rather than rendering a page for a place we can't send a phlebotomist to.
export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { city: cityKey } = await params;
  const city = cityByKey(cityKey);
  if (!city) return {};

  const title = `Lab Tests & Home Sample Collection in ${city.label}`;
  const description = `Compare diagnostic test and health package prices in ${city.label} across Jammu Genetics Hub and every major NABL-accredited lab, then book free home sample collection.`;
  const url = `/${city.key}`;
  const shareImages = await inheritedShareImages(parent);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url, images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

export default async function CityHubPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityKey } = await params;
  const city = cityByKey(cityKey);
  if (!city) notFound();

  const [categories, popularProducts, labs, baseUrl] = await Promise.all([
    getCategories(),
    getPopularProducts(8),
    getLabs(),
    getBaseUrl(),
  ]);

  const jsonLd = buildBusinessJsonLd({
    name: `Jammu Genetics Hub — ${city.label}`,
    url: `${baseUrl}/${city.key}`,
    description: `Compare diagnostic test and health package prices in ${city.label} across Jammu Genetics Hub and every major NABL-accredited lab, then book free home sample collection.`,
    addressLocality: city.label,
    addressRegion: city.state,
    areaServed: { "@type": "City", name: city.label },
  });

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: city.label, item: `${baseUrl}/${city.key}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-brand">Home</Link> / <span className="text-ink-soft">{city.label}</span>
        </nav>

        <div className="mb-8 flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <MapPin size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Lab Tests &amp; Health Checkups in {city.label}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-ink-soft">
              Compare the same test&apos;s price across {labs.length} affiliated labs in {city.label} — Thyrocare,
              Redcliffe Labs, Dr Lal PathLabs, Metropolis and specialist genetics partners — then book free home
              sample collection with a phlebotomist from whichever lab you choose.
            </p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3">
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft">
            <HomeIcon size={13} className="text-brand" /> Free home sample collection in {city.label}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft">
            <ScanSearch size={13} className="text-brand" /> {labs.length} labs compared side by side
          </span>
        </div>

        <section className="mt-8">
          <h2 className="mb-4 font-display text-xl font-semibold text-ink">Browse by category</h2>
          <CategoryRail categories={categories} />
        </section>

        <section className="mt-10">
          <div className="mb-4 flex items-end justify-between">
            <h2 className="font-display text-xl font-semibold text-ink">
              Most booked tests &amp; packages in {city.label}
            </h2>
            <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularProducts.map((p) => (
              <ProductCard key={p.slug} product={p} hrefBase={`/${city.key}/tests`} />
            ))}
          </div>
        </section>

        <section className="mt-10 flex flex-wrap gap-2 text-sm">
          <span className="text-ink-faint">Also serving:</span>
          {SERVICEABLE_CITIES.filter((c) => c.key !== city.key).map((c) => (
            <Link key={c.key} href={`/${c.key}`} className="font-medium text-brand hover:underline">
              {c.label}
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}
