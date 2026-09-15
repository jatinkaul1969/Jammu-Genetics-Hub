import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { Clock, FlaskConical, Droplets, Utensils, Home as HomeIcon, HelpCircle, ArrowRight } from "lucide-react";
import { getProductBySlug, getAllProductSlugs, getProductsByCategory } from "@/lib/catalog";
import { formatInr, formatTat, percentOff } from "@/lib/format";
import { getBaseUrl } from "@/lib/site-url";
import { categoryColorForName } from "@/lib/category-colors";
import { SERVICEABLE_CITIES, cityByKey } from "@/lib/serviceable-areas";
import { DIAGNOSTIC_FEE } from "@/lib/collection-slots";
import { inheritedShareImages } from "@/lib/seo";

export async function generateStaticParams() {
  const products = await getAllProductSlugs();
  return SERVICEABLE_CITIES.flatMap((city) =>
    products.map((p) => ({ city: city.key, testSlug: p.slug }))
  );
}

// Only real (city × test) combinations get a page. No find-and-replace city
// pages for places we don't actually serve — that's both a Google spam-
// policy risk and a real liability for a booking business (see AGENTS
// guidance / project notes on serviceable-areas.ts).
export const dynamicParams = false;

function buildFaq(product: NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>, cityLabel: string, lowestPrice: number, lowestLabName: string) {
  const kind = product.type === "PACKAGE" ? "package" : "test";
  const faqs = [
    {
      q: `How much does ${product.name} cost in ${cityLabel}?`,
      a: `${product.name} costs ${formatInr(lowestPrice)} onwards in ${cityLabel}, compared across ${product.prices.length} labs — the lowest price is at ${lowestLabName}. Home sample collection is included; a flat ${formatInr(DIAGNOSTIC_FEE)} diagnostic fee applies per visit.`,
    },
    {
      q: `Is home sample collection available for ${product.name} in ${cityLabel}?`,
      a: `Yes — a trained phlebotomist visits your address anywhere in ${cityLabel} at a date and time slot you choose, any day of the week.`,
    },
    {
      q: `How long do ${product.name} reports take in ${cityLabel}?`,
      a: `Reports are typically ready in ${formatTat(product.reportHours)} after your sample is collected, and are delivered online — no clinic visit needed to collect them.`,
    },
    {
      q: `Do I need to fast before ${product.name}?`,
      a: product.fasting
        ? `Yes — fast for ${product.fastingHours ?? 8}+ hours before sample collection.`
        : `No fasting is required for this ${kind}.`,
    },
  ];
  const includes: string[] = JSON.parse(product.includesJson);
  if (includes.length > 0) {
    faqs.push({
      q: `What does ${product.name} include?`,
      a: `${product.name} covers ${product.parameters} parameter${product.parameters === 1 ? "" : "s"}: ${includes.join(", ")}.`,
    });
  }
  return faqs;
}

export async function generateMetadata(
  { params }: { params: Promise<{ city: string; testSlug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { city: cityKey, testSlug } = await params;
  const city = cityByKey(cityKey);
  const product = city ? await getProductBySlug(testSlug) : null;
  if (!city || !product) return {};

  const lowest = [...product.prices].sort((a, b) => a.price - b.price)[0];
  const title = `${product.name} Price in ${city.label}`;
  const description = `${product.name} in ${city.label} costs ${lowest ? formatInr(lowest.price) : "—"} onwards with free home sample collection, reports in ${formatTat(product.reportHours)}. Compare ${product.prices.length} labs and book online.`;
  const url = `/${city.key}/tests/${product.slug}`;
  const shareImages = await inheritedShareImages(parent);

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url, images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

export default async function CityTestPage({
  params,
}: {
  params: Promise<{ city: string; testSlug: string }>;
}) {
  const { city: cityKey, testSlug } = await params;
  const city = cityByKey(cityKey);
  if (!city) notFound();

  const product = await getProductBySlug(testSlug);
  if (!product) notFound();

  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const lowest = sortedPrices[0];
  if (!lowest) notFound(); // no lab prices this test yet — nothing honest to show

  const highestMrp = Math.max(...sortedPrices.map((p) => p.mrp));
  const off = percentOff(highestMrp, lowest.price);
  const catColor = categoryColorForName(product.category.name);
  const baseUrl = await getBaseUrl();
  const faqs = buildFaq(product, city.label, lowest.price, lowest.lab.name);

  // A few sibling tests in the same category, so this page links deeper
  // into the site instead of only back out to /product and the city hub —
  // more internal paths for Google to find and crawl, and a next step for
  // a reader who came here for one specific test.
  const related = (await getProductsByCategory(product.category.slug))
    .filter((p) => p.slug !== product.slug)
    .slice(0, 4);

  const testJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalTest",
    name: product.name,
    description: product.about || product.description,
    url: `${baseUrl}/${city.key}/tests/${product.slug}`,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: sortedPrices[0].price,
      highPrice: sortedPrices[sortedPrices.length - 1].price,
      offerCount: sortedPrices.length,
      availability: "https://schema.org/InStock",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: city.label, item: `${baseUrl}/${city.key}` },
      { "@type": "ListItem", position: 3, name: product.name, item: `${baseUrl}/${city.key}/tests/${product.slug}` },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(testJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-brand">Home</Link>
          {" / "}
          <Link href={`/${city.key}`} className="hover:text-brand">{city.label}</Link>
          {" / "}
          <span className="text-ink-soft">{product.name}</span>
        </nav>

        <span className={`mb-2 inline-block rounded-full px-2.5 py-1 text-xs font-medium ${catColor.bg} ${catColor.text}`}>
          {product.category.name}
        </span>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {product.name} Price in {city.label}
        </h1>

        {/* First sentence states the price plainly — this is the line search
            engines (and AI answer boxes) tend to quote directly. */}
        <p className="mt-3 text-base leading-relaxed text-ink">
          <strong>{product.name}</strong> in <strong>{city.label}</strong> costs{" "}
          <span className="font-mono font-semibold text-brand-dark">{formatInr(lowest.price)}</span> onwards
          {off > 0 && <> ({off}% off MRP)</>} — compared across {sortedPrices.length} labs, with free home sample
          collection and reports in {formatTat(product.reportHours)}.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Spec icon={<FlaskConical size={16} />} label="Parameters" value={String(product.parameters)} color={catColor} />
          <Spec icon={<Clock size={16} />} label="Report in" value={formatTat(product.reportHours)} color={catColor} />
          <Spec icon={<Droplets size={16} />} label="Sample" value={product.sampleType} color={catColor} />
          <Spec
            icon={<Utensils size={16} />}
            label="Fasting"
            value={product.fasting ? `${product.fastingHours ?? 8}+ hrs` : "Not required"}
            color={catColor}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-surface p-4">
          <span className="flex items-center gap-1.5 text-sm text-ink">
            <HomeIcon size={15} className="text-brand" /> Free home sample collection across {city.label}
          </span>
          <Link
            href={`/product/${product.slug}`}
            className="ml-auto flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Compare all {sortedPrices.length} labs &amp; book <ArrowRight size={14} />
          </Link>
        </div>

        {product.about && (
          <div className="mt-8">
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">About this {product.type === "PACKAGE" ? "package" : "test"}</h2>
            <p className="text-sm leading-relaxed text-ink-soft">{product.about}</p>
          </div>
        )}

        <div className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <HelpCircle size={18} className="text-brand" /> Frequently asked questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-surface p-4">
                <h3 className="mb-1.5 text-sm font-semibold text-ink">{f.q}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </div>
            ))}
          </div>
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              Other {product.category.name} tests in {city.label}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${city.key}/tests/${r.slug}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm hover:border-brand"
                >
                  <span className="text-ink">{r.name}</span>
                  <span className="font-mono text-xs font-medium text-brand-dark">{formatInr(r.lowestPrice)}+</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="mt-10 flex flex-wrap items-center gap-3 border-t border-border pt-6 text-sm">
          <span className="text-ink-faint">{product.name} is also available in:</span>
          {SERVICEABLE_CITIES.filter((c) => c.key !== city.key).map((c) => (
            <Link key={c.key} href={`/${c.key}/tests/${product.slug}`} className="font-medium text-brand hover:underline">
              {c.label}
            </Link>
          ))}
          <span className="mx-1 text-ink-faint">·</span>
          <Link href={`/${city.key}`} className="font-medium text-brand hover:underline">
            More tests in {city.label}
          </Link>
        </div>
      </div>
    </>
  );
}

function Spec({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: { text: string; bg: string };
}) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <span className={`mb-1.5 flex h-7 w-7 items-center justify-center rounded-md ${color.bg} ${color.text}`}>{icon}</span>
      <p className="text-xs text-ink-faint">{label}</p>
      <p className="text-sm font-medium capitalize text-ink">{value}</p>
    </div>
  );
}
