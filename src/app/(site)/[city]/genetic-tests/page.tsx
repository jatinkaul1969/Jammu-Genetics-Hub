import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { Dna, ArrowRight, BadgeCheck, ScanSearch, FlaskConical, HelpCircle } from "lucide-react";
import { getProductsBySlugs } from "@/lib/catalog";
import { formatInr } from "@/lib/format";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES, cityByKey } from "@/lib/serviceable-areas";
import { inheritedShareImages } from "@/lib/seo";
import { GENETICS_CONTENT, GENETICS_GROUPS, GENETICS_SLUGS, GENETICIST_CREDENTIAL } from "@/lib/genetics-content";
import { GeneticCounsellingBanner } from "@/components/GeneticCounsellingBanner";

export function generateStaticParams() {
  return SERVICEABLE_CITIES.map((c) => ({ city: c.key }));
}

export const dynamicParams = false;

export async function generateMetadata(
  { params }: { params: Promise<{ city: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { city: cityKey } = await params;
  const city = cityByKey(cityKey);
  if (!city) return {};

  const title = `Genetic Testing in ${city.label}: All Genetic Tests in One Place`;
  const description = `Genetic tests in ${city.label} — NIPT, double marker, newborn screening, BRCA, whole exome sequencing, carrier screening and more. Compare prices and book, with guidance from ${GENETICIST_CREDENTIAL}.`;
  const url = `/${city.key}/genetic-tests`;
  const shareImages = await inheritedShareImages(parent);

  return {
    title,
    description,
    keywords: [
      `genetic testing in ${city.label}`,
      `genetic tests ${city.label}`,
      `genetic lab ${city.label}`,
      `genetic counselling ${city.label}`,
      `NIPT in ${city.label}`,
      `whole exome sequencing in ${city.label}`,
      `double marker test in ${city.label}`,
    ],
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url, images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

export default async function GeneticTestsHubPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityKey } = await params;
  const city = cityByKey(cityKey);
  if (!city) notFound();

  const [products, baseUrl] = await Promise.all([getProductsBySlugs(GENETICS_SLUGS), getBaseUrl()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  const groups = GENETICS_GROUPS.map((g) => ({
    ...g,
    tests: GENETICS_SLUGS.filter((slug) => GENETICS_CONTENT[slug].group === g.name)
      .map((slug) => bySlug.get(slug))
      .filter((p): p is NonNullable<typeof p> => !!p && p.lowestPrice > 0),
  })).filter((g) => g.tests.length > 0);

  const allTests = groups.flatMap((g) => g.tests);

  const faqs = [
    {
      q: `What genetic tests are available in ${city.label}?`,
      a: `Through Jammu Genetics Hub you can book ${allTests.length} genetic tests in ${city.label} — pregnancy screening (NIPT, Double, Triple and Quadruple Marker), prenatal diagnosis and IVF embryo testing, newborn screening, hereditary cancer testing (BRCA and multi-gene panels), whole exome, clinical exome and whole genome sequencing, karyotyping, carrier screening, and single-gene tests such as thalassemia, Fragile X, SMA and cystic fibrosis.`,
    },
    {
      q: `Does Jammu Genetics Hub have its own genetics lab?`,
      a: `No. Jammu Genetics Hub is a one-stop platform to compare, book and follow up on genetic tests. Your sample is processed by an accredited partner laboratory that performs the test, so you can choose between several labs and prices in one place.`,
    },
    {
      q: `Can I talk to a geneticist before or after my test?`,
      a: `Yes. We help patients connect with ${GENETICIST_CREDENTIAL} who explain which test is right, what the result means and what to do next. Message us on WhatsApp or call to get started.`,
    },
    {
      q: `How do I know which genetic test I need?`,
      a: `It depends on why you are testing — pregnancy, a child's symptoms, family history of cancer, or planning a pregnancy. Each test page explains who the test is for and its limits, and a geneticist can help you choose.`,
    },
  ];

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `Genetic tests in ${city.label}`,
      itemListElement: allTests.map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: `${baseUrl}/${city.key}/tests/${p.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: city.label, item: `${baseUrl}/${city.key}` },
        { "@type": "ListItem", position: 3, name: "Genetic tests", item: `${baseUrl}/${city.key}/genetic-tests` },
      ],
    },
  ];

  return (
    <>
      {jsonLd.map((ld, i) => (
        <script key={i} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />
      ))}

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-brand">Home</Link>
          {" / "}
          <Link href={`/${city.key}`} className="hover:text-brand">{city.label}</Link>
          {" / "}
          <span className="text-ink-soft">Genetic tests</span>
        </nav>

        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Dna size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              Genetic Testing in {city.label} — every genetic test, one place
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              From NIPT and double marker screening in pregnancy to newborn screening, hereditary cancer
              testing and whole exome sequencing — Jammu Genetics Hub is your one-stop place for genetic
              tests in {city.label}. Compare prices across our partner laboratories, book online, and get
              guidance from {GENETICIST_CREDENTIAL} who help you understand exactly what your results mean.
            </p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Chip icon={<FlaskConical size={13} className="text-brand" />}>{allTests.length} genetic tests</Chip>
          <Chip icon={<ScanSearch size={13} className="text-brand" />}>Prices compared across partner labs</Chip>
          <Chip icon={<BadgeCheck size={13} className="text-brand" />}>Guidance from {GENETICIST_CREDENTIAL}</Chip>
        </div>

        {groups.map((g) => (
          <section key={g.name} className="mt-10">
            <h2 className="font-display text-xl font-semibold text-ink">{g.name}</h2>
            <p className="mb-3 text-sm text-ink-soft">{g.blurb}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {g.tests.map((p) => (
                <Link
                  key={p.slug}
                  href={`/${city.key}/tests/${p.slug}`}
                  className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 hover:border-brand"
                >
                  <div>
                    <p className="text-sm font-semibold text-ink group-hover:text-brand">{p.name}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">{p.description}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <span className="text-ink-faint">
                      From <span className="font-mono font-semibold text-brand-dark">{formatInr(p.lowestPrice)}</span>
                    </span>
                    <span className="flex items-center gap-1 font-medium text-brand">
                      Details <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}

        <section className="mt-12">
          <GeneticCounsellingBanner cityKey={city.key} cityLabel={city.label} />
        </section>

        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <HelpCircle size={18} className="text-brand" /> Genetic testing in {city.label} — common questions
          </h2>
          <div className="space-y-4">
            {faqs.map((f) => (
              <div key={f.q} className="rounded-xl border border-border bg-surface p-4">
                <h3 className="mb-1.5 text-sm font-semibold text-ink">{f.q}</h3>
                <p className="text-sm leading-relaxed text-ink-soft">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            General information only — not medical advice. Please discuss test choices and results with your
            doctor or a geneticist.
          </p>
        </section>

        <section className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6 text-sm">
          <span className="text-ink-faint">Genetic tests also in:</span>
          {SERVICEABLE_CITIES.filter((c) => c.key !== city.key).map((c) => (
            <Link key={c.key} href={`/${c.key}/genetic-tests`} className="font-medium text-brand hover:underline">
              {c.label}
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft">
      {icon} {children}
    </span>
  );
}
