import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { BadgeCheck, FlaskConical, Home as HomeIcon, ScanSearch, MapPin, ArrowRight } from "lucide-react";
import { getLabs } from "@/lib/catalog";
import { GENETICIST_CREDENTIAL } from "@/lib/genetics-content";
import { SERVICEABLE_CITIES, formattedAddress, mapsUrl } from "@/lib/serviceable-areas";
import { getBaseUrl } from "@/lib/site-url";
import { buildBusinessJsonLd, inheritedShareImages } from "@/lib/seo";

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  const title = "About Jammu Genetics Hub — Genetic & Diagnostic Tests in Jammu";
  const description = `Jammu Genetics Hub is a one-stop platform in Jammu for genetic and oncology tests: compare partner-lab prices, book home sample collection, and connect with ${GENETICIST_CREDENTIAL}.`;
  const shareImages = await inheritedShareImages(parent);
  return {
    title,
    description,
    alternates: { canonical: "/about" },
    openGraph: { title, description, type: "website", url: "/about", images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

export default async function AboutPage() {
  const [labs, baseUrl] = await Promise.all([getLabs(), getBaseUrl()]);
  const partners = labs.filter((l) => !l.isOwn);
  const jammu = SERVICEABLE_CITIES[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About Jammu Genetics Hub",
    url: `${baseUrl}/about`,
    mainEntity: buildBusinessJsonLd({
      name: "Jammu Genetics Hub",
      url: baseUrl,
      description: `One-stop genetic testing and diagnostics platform in Jammu, with guidance from ${GENETICIST_CREDENTIAL}.`,
      addressLocality: jammu.label,
      addressRegion: jammu.state,
      streetAddress: jammu.address?.streetAddress,
      postalCode: jammu.address?.postalCode,
      hasMap: mapsUrl(jammu) ?? undefined,
      areaServed: SERVICEABLE_CITIES.map((c) => c.label).join(", "),
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-brand">Home</Link> / <span className="text-ink-soft">About</span>
        </nav>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">About Jammu Genetics Hub</h1>
        <p className="mt-3 text-base leading-relaxed text-ink">
          Jammu Genetics Hub is a one-stop place in Jammu for genetic and cancer (oncology) tests. We make it simple to
          find the test you need, understand what it is for, compare what it costs across our partner laboratories, and
          book it — with a trained phlebotomist coming to your home where the test allows it, and a geneticist to
          explain the result.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {[
            { icon: <ScanSearch size={20} />, title: "Every test, one place", body: "Pregnancy screening (NIPT, double marker), newborn screening, hereditary cancer, exome sequencing, carrier testing, and 600+ oncology tests — each explained in plain language." },
            { icon: <BadgeCheck size={20} />, title: "Guidance from geneticists", body: `We help patients connect with ${GENETICIST_CREDENTIAL} who explain which test is right and what the result means.` },
            { icon: <HomeIcon size={20} />, title: "Home sample collection", body: "For blood tests, our own phlebotomist visits your address in Jammu or Mumbai at a slot you choose. Other samples are arranged with our team." },
            { icon: <FlaskConical size={20} />, title: "Honest about who does the testing", body: "Jammu Genetics Hub does not run its own laboratory. Your sample is processed by one of our accredited partner labs; we handle the comparison, booking, collection and follow-up." },
          ].map((c) => (
            <div key={c.title} className="rounded-xl border border-border bg-surface p-5">
              <span className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">{c.icon}</span>
              <p className="mb-1 text-sm font-semibold text-ink">{c.title}</p>
              <p className="text-sm leading-relaxed text-ink-soft">{c.body}</p>
            </div>
          ))}
        </div>

        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">Our partner laboratories</h2>
          <p className="mb-3 text-sm text-ink-soft">Tests are processed by the accredited laboratory that performs them:</p>
          <div className="flex flex-wrap gap-2">
            {partners.map((l) => (
              <span key={l.id} className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft">
                {l.name}
              </span>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <MapPin size={18} className="text-brand" /> Where we are
          </h2>
          <p className="text-sm text-ink-soft">{formattedAddress(jammu)}</p>
          <p className="mt-1 text-sm text-ink-soft">Serving Jammu and Mumbai.</p>
          <Link href="/contact" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            Contact &amp; directions <ArrowRight size={14} />
          </Link>
        </section>

        <section className="mt-10 flex flex-wrap gap-3 text-sm">
          <Link href="/jammu/genetic-tests" className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark">Genetic tests in Jammu</Link>
          <Link href="/jammu/oncology-tests" className="rounded-lg border border-border bg-surface px-4 py-2 font-medium text-ink hover:border-brand">Oncology tests</Link>
          <Link href="/jammu/genetic-counselling" className="rounded-lg border border-border bg-surface px-4 py-2 font-medium text-ink hover:border-brand">Talk to a geneticist</Link>
        </section>
      </div>
    </>
  );
}
