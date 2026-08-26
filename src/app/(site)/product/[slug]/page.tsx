import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Clock, FlaskConical, Droplets, Utensils, Star, Home as HomeIcon, ShieldCheck, Info } from "lucide-react";
import { getProductBySlug } from "@/lib/catalog";
import { formatInr, formatTat, percentOff } from "@/lib/format";
import { AddToCartButton } from "@/components/AddToCartButton";
import { getBaseUrl } from "@/lib/site-url";
import { categoryColorForName } from "@/lib/category-colors";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return {};

  const lowest = [...product.prices].sort((a, b) => a.price - b.price)[0];
  const kind = product.type === "PACKAGE" ? "package" : "test";
  const title = `${product.name} Price in Jammu — Book Online | Compare Thyrocare, Redcliffe, Dr Lal, Metropolis`;
  const description = `Book ${product.name} in Jammu starting at ${lowest ? formatInr(lowest.price) : "the lowest price"}. Compare this ${kind}'s price across Jammu Genetics Hub, Thyrocare, Redcliffe Labs, Dr Lal PathLabs and Metropolis, then book free home sample collection. ${product.parameters} parameters, report in ${formatTat(product.reportHours)}.`;

  return {
    title,
    description,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: { title, description, type: "website" },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const includes: string[] = JSON.parse(product.includesJson);
  const sortedPrices = [...product.prices].sort((a, b) => a.price - b.price);
  const lowestPrice = sortedPrices[0]?.price ?? 0;
  const baseUrl = await getBaseUrl();
  const catColor = categoryColorForName(product.category.name);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalTest",
    name: product.name,
    description: product.about || product.description,
    url: `${baseUrl}/product/${product.slug}`,
    offers: sortedPrices.map((p) => ({
      "@type": "Offer",
      price: p.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      seller: { "@type": "MedicalOrganization", name: p.lab.name },
      url: `${baseUrl}/product/${product.slug}`,
    })),
  };

  return (
    <>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <nav className="mb-4 text-xs text-ink-faint">
        <Link href="/" className="hover:text-brand">Home</Link>
        {" / "}
        <Link href={`/search?category=${product.category.slug}`} className={`font-medium hover:underline ${catColor.text}`}>
          {product.category.name}
        </Link>
        {" / "}
        <span className="text-ink-soft">{product.name}</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          {product.badge && (
            <span className="mb-2 inline-block rounded-full bg-accent-soft px-2.5 py-1 text-xs font-medium text-accent">
              {product.badge}
            </span>
          )}
          <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{product.name}</h1>
          <p className="mt-2 text-sm text-ink-soft">{product.description}</p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Spec icon={<FlaskConical size={16} />} label="Parameters" value={String(product.parameters)} color={catColor} />
        <Spec icon={<Clock size={16} />} label="Report in" value={formatTat(product.reportHours)} color={catColor} />
        <Spec icon={<Droplets size={16} />} label="Sample" value={product.sampleType} color={catColor} />
        <Spec
          icon={<Utensils size={16} />}
          label="Fasting"
          value={product.fasting ? `${product.fastingHours ?? 8}+ hrs` : "Not required"}
          color={catColor}
        />
        <Spec icon={<ShieldCheck size={16} />} label="For" value={product.gender === "both" ? "All genders" : product.gender} color={catColor} />
        <Spec icon={<HomeIcon size={16} />} label="Collection" value="Free at home" color={catColor} />
      </div>

      {product.about && (
        <div className={`mb-8 rounded-xl border border-border border-l-4 bg-surface p-5 ${catColor.border}`}>
          <div className="mb-2 flex items-center gap-2">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${catColor.bg} ${catColor.text}`}>
              <Info size={16} />
            </span>
            <h2 className="font-display text-lg font-semibold text-ink">About this {product.type === "PACKAGE" ? "package" : "test"}</h2>
          </div>
          <p className="text-sm leading-relaxed text-ink-soft">{product.about}</p>
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">What&apos;s included</h2>
          <div className="flex flex-wrap gap-2">
            {includes.map((inc) => (
              <span
                key={inc}
                className={`rounded-full border px-3 py-1 text-xs font-medium ${catColor.bg} ${catColor.text} border-transparent`}
              >
                {inc}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="mb-1 font-display text-lg font-semibold text-ink">Compare prices across labs</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Same test, {product.prices.length} labs — pick the one you want to book with. All include free home
          sample collection.
        </p>

        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1fr_1.2fr] gap-3 border-b border-border bg-surface-muted px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint sm:grid">
            <span>Lab</span>
            <span>Price</span>
            <span>Report</span>
            <span>Rating</span>
            <span className="text-right">Action</span>
          </div>

          {sortedPrices.map((p) => {
            const off = percentOff(p.mrp, p.price);
            const isLowest = p.price === lowestPrice;
            return (
              <div
                key={p.id}
                className={`grid grid-cols-2 gap-3 border-b border-border px-4 py-4 last:border-b-0 sm:grid-cols-[2fr_1fr_1fr_1fr_1.2fr] sm:items-center ${
                  p.lab.isOwn ? "bg-brand-soft/40" : ""
                }`}
              >
                <div className="col-span-2 flex items-center gap-3 sm:col-span-1">
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg font-mono text-[11px] font-semibold text-white"
                    style={{ backgroundColor: p.lab.colorHex }}
                  >
                    {p.lab.logoInitials}
                  </span>
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium text-ink">
                      {p.lab.name}
                      {p.lab.isOwn && (
                        <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-semibold text-white">
                          JGH Direct
                        </span>
                      )}
                    </p>
                    <p className="truncate text-xs text-ink-faint">{p.lab.accreditation}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-mono text-base font-semibold text-ink">{formatInr(p.price)}</span>
                    {isLowest && (
                      <span className="rounded-full bg-success-soft px-1.5 py-0.5 text-[10px] font-medium text-success">
                        Lowest
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs text-ink-faint line-through">{formatInr(p.mrp)}</p>
                  {off > 0 && <p className="text-[11px] text-success">{off}% off</p>}
                </div>

                <p className="text-xs text-ink-soft">{p.lab.turnaroundNote}</p>

                <p className="flex items-center gap-1 text-xs text-ink-soft">
                  <Star size={13} className="fill-gold text-gold" /> {p.lab.rating}
                  <span className="text-ink-faint">({Intl.NumberFormat("en-IN", { notation: "compact" }).format(p.lab.ratingCount)})</span>
                </p>

                <div className="flex justify-start sm:justify-end">
                  <AddToCartButton
                    item={{
                      productId: product.id,
                      productSlug: product.slug,
                      productName: product.name,
                      productType: product.type,
                      labId: p.labId,
                      labSlug: p.lab.slug,
                      labName: p.lab.name,
                      labShortName: p.lab.shortName,
                      price: p.price,
                      mrp: p.mrp,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
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
