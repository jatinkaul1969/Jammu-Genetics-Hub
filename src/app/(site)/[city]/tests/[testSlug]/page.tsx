import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import {
  Clock,
  FlaskConical,
  Droplets,
  Utensils,
  Home as HomeIcon,
  HelpCircle,
  ArrowRight,
  MessageCircle,
  CircleCheck,
  Info,
  Users,
  Dna,
  Microscope,
} from "lucide-react";
import { getProductBySlug, getProductsByCategory, getProductsBySlugs } from "@/lib/catalog";
import { formatInr, formatTat, percentOff } from "@/lib/format";
import { getBaseUrl } from "@/lib/site-url";
import { categoryColorForName } from "@/lib/category-colors";
import { SERVICEABLE_CITIES, cityByKey } from "@/lib/serviceable-areas";
import { DIAGNOSTIC_FEE } from "@/lib/collection-slots";
import { inheritedShareImages } from "@/lib/seo";
import { buildWhatsAppLink } from "@/lib/contact";
import { GENETICIST_CREDENTIAL, GENETICS_SLUGS, contentForProduct, type TestContent } from "@/lib/genetics-content";
import { HUBS, hubPath } from "@/lib/hub-config";
import { getTestIndex } from "@/lib/test-index";
import { groupByName } from "@/lib/test-knowledge";
import { GeneticCounsellingBanner } from "@/components/GeneticCounsellingBanner";

// Only the hand-written genetic tests are pre-rendered at build time. Every
// other test (the ~1,300 imported partner-lab tests, plus anything added in the
// admin later) renders on first request — so a new test gets its page without
// a redeploy. The page itself 404s unknown cities / tests / unpriced tests,
// so this can't be used to mint pages for places we don't serve.
export function generateStaticParams() {
  return SERVICEABLE_CITIES.flatMap((city) => GENETICS_SLUGS.map((slug) => ({ city: city.key, testSlug: slug })));
}

export const dynamicParams = true;

type Product = NonNullable<Awaited<ReturnType<typeof getProductBySlug>>>;

// Legal: disclosing the sex of a fetus is prohibited in India (PCPNDT Act).
// Some partner labs list it as an optional NIPT add-on in their own catalogs,
// but we never publish it on a public page.
function publicIncludes(product: Product): string[] {
  const includes: string[] = JSON.parse(product.includesJson);
  return includes.filter((i) => !/fetal sex|baby'?s sex|gender of/i.test(i));
}

function buildFaq(
  product: Product,
  cityLabel: string,
  lowestPrice: number,
  lowestLabName: string,
  content: TestContent | null
) {
  const kind = product.type === "PACKAGE" ? "package" : "test";
  const homeCollection = !content || content.collection === "home";
  const nLabs = product.prices.length;

  const faqs: { q: string; a: string }[] = [];

  if (content) {
    faqs.push({ q: `What is ${product.name} used for?`, a: content.whyDone.join(" ") });
    faqs.push({ q: `Who should consider ${product.name}?`, a: content.whoFor.join(" ") });
  }

  faqs.push({
    q: `How much does ${product.name} cost in ${cityLabel}?`,
    a: `${product.name} costs ${formatInr(lowestPrice)} onwards in ${cityLabel}${nLabs > 1 ? `, compared across ${nLabs} labs — the lowest price is at ${lowestLabName}` : ` through ${lowestLabName}`}.${homeCollection ? ` Home sample collection is available; a flat ${formatInr(DIAGNOSTIC_FEE)} diagnostic fee applies per visit.` : ""}`,
  });

  faqs.push(
    homeCollection
      ? {
          q: `Is home sample collection available for ${product.name} in ${cityLabel}?`,
          a: `Yes — a trained phlebotomist visits your address anywhere in ${cityLabel} at a date and time slot you choose, any day of the week.`,
        }
      : {
          q: `How is the sample collected for ${product.name} in ${cityLabel}?`,
          a: `${product.name} needs a ${product.sampleType.toLowerCase()} sample, which is not a routine home blood draw. Message or call Jammu Genetics Hub and we'll guide you on where and when it can be collected in ${cityLabel} and coordinate with the processing lab.`,
        }
  );

  faqs.push({
    q: `How long do ${product.name} reports take?`,
    a: `Reports are typically ready in ${formatTat(product.reportHours)} after the sample reaches the lab, and are delivered online. Turnaround can vary by lab and by case.`,
  });

  faqs.push({
    q: `Do I need to fast before ${product.name}?`,
    a: product.fasting
      ? `Yes — fast for ${product.fastingHours ?? 8}+ hours before sample collection.`
      : `No fasting is required for this ${kind}.`,
  });

  const includes = publicIncludes(product);
  if (includes.length > 0) {
    faqs.push({
      q: `What does ${product.name} include?`,
      a: `${product.name} covers ${product.parameters} parameter${product.parameters === 1 ? "" : "s"}: ${includes.join(", ")}.`,
    });
  }

  if (content) {
    faqs.push({ q: `Are there limitations to ${product.name}?`, a: content.goodToKnow.join(" ") });

    if (content.hub === "genetic") {
      faqs.push({
        q: `Can I speak to a geneticist about ${product.name} in ${cityLabel}?`,
        a: `Yes. Jammu Genetics Hub helps patients connect with ${GENETICIST_CREDENTIAL}, who can explain whether this test is right for you and help you understand the result. Message us on WhatsApp or call to get started. This page is general information and not a substitute for medical advice.`,
      });
    } else {
      faqs.push({
        q: `Do I need a doctor's referral for ${product.name}?`,
        a: `${product.name} is normally ordered by an oncologist, hematologist or pathologist for a patient with a suspected or confirmed cancer. This page explains what the test is for, but whether it is right for you is a decision to make with your doctor. Message us on WhatsApp if you need help with sample logistics or booking.`,
      });
    }
    faqs.push({
      q: `Does Jammu Genetics Hub run its own laboratory?`,
      a: `No. Jammu Genetics Hub is a one-stop booking and comparison platform for genetic, oncology and diagnostic tests — your sample is processed by one of our accredited partner laboratories, and we help with booking, sample collection and getting your report to you.`,
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

  const content = contentForProduct(product);
  const lowest = [...product.prices].sort((a, b) => a.price - b.price)[0];
  const price = lowest ? formatInr(lowest.price) : "—";
  const title = content ? `${product.name} in ${city.label}: Price & Uses` : `${product.name} Price in ${city.label}`;
  const description = content
    ? content.hub === "genetic"
      ? `${product.name} in ${city.label}: what it is, who needs it & price from ${price}. Book with Jammu Genetics Hub, with guidance from ${GENETICIST_CREDENTIAL}.`
      : `${product.name} in ${city.label}: what it is used for, sample needed & price from ${price}. Book through Jammu Genetics Hub — genetic and oncology tests in one place.`
    : `${product.name} in ${city.label} costs ${price} onwards with free home sample collection, reports in ${formatTat(product.reportHours)}. Compare ${product.prices.length} labs and book online.`;
  const url = `/${city.key}/tests/${product.slug}`;
  const shareImages = await inheritedShareImages(parent);

  return {
    title,
    description,
    keywords: content
      ? [
          ...content.aliases.slice(0, 6).map((a) => `${a} in ${city.label}`),
          `${product.name} price in ${city.label}`,
          content.hub === "genetic" ? `genetic testing ${city.label}` : `oncology test ${city.label}`,
        ]
      : undefined,
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

  const content = contentForProduct(product);
  const hub = content?.hub ?? null;
  const hubCfg = hub ? HUBS[hub] : null;
  const group = content ? groupByName(content.group) : undefined;
  const homeCollection = !content || content.collection === "home";
  const nLabs = sortedPrices.length;

  const highestMrp = Math.max(...sortedPrices.map((p) => p.mrp));
  const off = percentOff(highestMrp, lowest.price);
  const catColor = categoryColorForName(product.category.name);
  const baseUrl = await getBaseUrl();
  const faqs = buildFaq(product, city.label, lowest.price, lowest.lab.name, content);

  // Sibling tests, so this page links deeper into the site instead of only
  // back out to /product and the city hub. For a genetic / oncology test,
  // "related" means the same group (e.g. other prenatal screens, other
  // leukemia tests), not just the same DB category.
  let related: { slug: string; name: string; lowestPrice: number }[];
  if (content) {
    const idx = await getTestIndex();
    const siblings = (idx.byGroup.get(content.group) ?? []).filter((e) => e.slug !== product.slug).slice(0, 6);
    related = (await getProductsBySlugs(siblings.map((e) => e.slug)))
      .filter((p) => p.lowestPrice > 0)
      .sort((a, b) => siblings.findIndex((s) => s.slug === a.slug) - siblings.findIndex((s) => s.slug === b.slug));
  } else {
    related = (await getProductsByCategory(product.category.slug))
      .filter((p) => p.slug !== product.slug)
      .slice(0, 4);
  }

  const whatsappHref = buildWhatsAppLink(
    `Hi Jammu Genetics Hub! I'd like to book / know more about ${product.name} in ${city.label}.`
  );

  const testJsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalTest",
    name: product.name,
    ...(content ? { alternateName: content.aliases } : {}),
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

  const crumbs: { name: string; item: string }[] = [
    { name: "Home", item: baseUrl },
    { name: city.label, item: `${baseUrl}/${city.key}` },
  ];
  if (hubCfg && hub) {
    crumbs.push({ name: hubCfg.label, item: `${baseUrl}${hubPath(city.key, hub)}` });
    if (group) crumbs.push({ name: group.name, item: `${baseUrl}${hubPath(city.key, group.hubs[0], group.slug)}` });
  }
  crumbs.push({ name: product.name, item: `${baseUrl}/${city.key}/tests/${product.slug}` });
  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.item })),
  };

  const stepSample = homeCollection
    ? `A trained phlebotomist visits your address in ${city.label} at the slot you choose — no clinic visit needed.`
    : `Your ${product.sampleType.toLowerCase()} sample is arranged with our team — message us and we'll guide you on where and when it can be collected in ${city.label}.`;
  const HubIcon = hub === "oncology" ? Microscope : Dna;

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
          {hubCfg && hub && (
            <>
              <Link href={hubPath(city.key, hub)} className="hover:text-brand">{hubCfg.label}</Link>
              {" / "}
              {group && (
                <>
                  <Link href={hubPath(city.key, group.hubs[0], group.slug)} className="hover:text-brand">
                    {group.name}
                  </Link>
                  {" / "}
                </>
              )}
            </>
          )}
          <span className="text-ink-soft">{product.name}</span>
        </nav>

        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${catColor.bg} ${catColor.text}`}>
            {product.category.name}
          </span>
          {content && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark">
              <HubIcon size={12} /> {content.group}
            </span>
          )}
        </div>

        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {content ? `${product.name} in ${city.label}` : `${product.name} Price in ${city.label}`}
        </h1>

        {/* First sentence states the price plainly — this is the line search
            engines (and AI answer boxes) tend to quote directly. */}
        <p className="mt-3 text-base leading-relaxed text-ink">
          <strong>{product.name}</strong> in <strong>{city.label}</strong> costs{" "}
          <span className="font-mono font-semibold text-brand-dark">{formatInr(lowest.price)}</span> onwards
          {off > 0 && <> ({off}% off MRP)</>}
          {nLabs > 1 ? <> — compared across {nLabs} labs</> : <> — through {lowest.lab.name}</>}
          {homeCollection ? ", with free home sample collection" : ""} and reports in {formatTat(product.reportHours)}.
        </p>
        {content && (
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {hub === "genetic" ? (
              <>
                Book through <strong>Jammu Genetics Hub</strong> — one place for every genetic test — and get guidance
                from {GENETICIST_CREDENTIAL} before and after your test. Your sample is processed by an accredited
                partner laboratory.
              </>
            ) : (
              <>
                Book through <strong>Jammu Genetics Hub</strong> — one place for genetic and oncology (cancer) tests.
                Your sample is processed by an accredited partner laboratory, and we help with booking and sample
                logistics.
              </>
            )}
          </p>
        )}

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
            <HomeIcon size={15} className="text-brand" />{" "}
            {homeCollection
              ? `Free home sample collection across ${city.label}`
              : `Sample collection arranged with our team in ${city.label}`}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            {content && (
              <a
                href={whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-brand"
              >
                <MessageCircle size={14} className="text-success" /> Ask on WhatsApp
              </a>
            )}
            <Link
              href={`/product/${product.slug}`}
              className="flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              {nLabs > 1 ? `Compare all ${nLabs} labs & book` : "View price & book"} <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {product.about && (
          <div className="mt-8">
            <h2 className="mb-2 font-display text-lg font-semibold text-ink">
              {content ? `What is ${product.name}?` : `About this ${product.type === "PACKAGE" ? "package" : "test"}`}
            </h2>
            <p className="text-sm leading-relaxed text-ink-soft">{product.about}</p>
          </div>
        )}

        {content && (
          <>
            <ListSection
              icon={<CircleCheck size={18} className="text-brand" />}
              title={`Why is ${product.name} done?`}
              items={content.whyDone}
            />
            <ListSection
              icon={<Users size={18} className="text-brand" />}
              title={`Who may be advised to take ${product.name}?`}
              items={content.whoFor}
            />

            <section className="mt-10">
              <h2 className="mb-1 font-display text-lg font-semibold text-ink">
                {product.name} price in {city.label}
              </h2>
              <p className="mb-3 text-sm text-ink-soft">
                {nLabs > 1
                  ? "The same test, priced by each laboratory that offers it. Book through Jammu Genetics Hub for one place to compare, book and follow up."
                  : "Price from the partner laboratory that performs this test. Book through Jammu Genetics Hub for one place to book and follow up."}
              </p>
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full min-w-[420px] text-left text-sm">
                  <thead className="bg-surface text-xs text-ink-faint">
                    <tr>
                      <th className="px-4 py-2 font-medium">Provider</th>
                      <th className="px-4 py-2 text-right font-medium">Price</th>
                      <th className="px-4 py-2 text-right font-medium">MRP</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPrices.map((p) => (
                      <tr key={p.id} className="border-t border-border">
                        <td className="px-4 py-2.5 text-ink">
                          {p.lab.isOwn ? "Jammu Genetics Hub" : p.lab.name}
                          {nLabs > 1 && p.id === lowest.id && (
                            <span className="ml-2 rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-dark">
                              Lowest
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-semibold text-brand-dark">
                          {formatInr(p.price)}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-xs text-ink-faint">
                          {p.mrp > p.price ? <s>{formatInr(p.mrp)}</s> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Jammu Genetics Hub does not run its own laboratory — samples are processed by our accredited partner
                labs. Prices exclude the per-visit diagnostic fee where home collection applies.
              </p>
            </section>

            <section className="mt-10">
              <h2 className="mb-3 font-display text-lg font-semibold text-ink">
                How it works with Jammu Genetics Hub
              </h2>
              <ol className="grid gap-3 sm:grid-cols-2">
                <Step
                  n={1}
                  title="Choose your test"
                  desc={
                    hub === "genetic"
                      ? "See the price and what sample is needed — or ask a geneticist which test you need."
                      : "See the price and what sample is needed — and check the choice of test with your oncologist."
                  }
                />
                <Step n={2} title="Sample collection" desc={stepSample} />
                <Step n={3} title="Processed by a partner lab" desc="Your sample goes to an accredited partner laboratory that performs this test." />
                <Step
                  n={4}
                  title="Report & guidance"
                  desc={
                    hub === "genetic"
                      ? `Get your report online, then go through it with ${GENETICIST_CREDENTIAL} we connect you with.`
                      : "Get your report online and review it with your doctor. For inherited-risk results we can connect you with a geneticist."
                  }
                />
              </ol>
            </section>

            <ListSection
              icon={<Info size={18} className="text-brand" />}
              title="Good to know"
              items={content.goodToKnow}
            />

            <section className="mt-10">
              <GeneticCounsellingBanner
                cityKey={city.key}
                cityLabel={city.label}
                testName={product.name}
                variant={hub ?? "genetic"}
              />
            </section>
          </>
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
          {content && (
            <p className="mt-3 text-xs text-ink-faint">
              This page is general information to help you understand the test. It is not medical advice — please
              discuss your results and next steps with your doctor{hub === "genetic" ? " or a geneticist" : ""}.
            </p>
          )}
        </div>

        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              {content
                ? `Other ${content.group.toLowerCase()} tests in ${city.label}`
                : `Other ${product.category.name} tests in ${city.label}`}
            </h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${city.key}/tests/${r.slug}`}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2.5 text-sm hover:border-brand"
                >
                  <span className="text-ink">{r.name}</span>
                  <span className="shrink-0 font-mono text-xs font-medium text-brand-dark">{formatInr(r.lowestPrice)}+</span>
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
          {hubCfg && hub && (
            <>
              <span className="mx-1 text-ink-faint">·</span>
              <Link href={hubPath(city.key, hub)} className="font-medium text-brand hover:underline">
                All {hubCfg.label.toLowerCase()} in {city.label}
              </Link>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ListSection({ icon, title, items }: { icon: React.ReactNode; title: string; items: string[] }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
        {icon} {title}
      </h2>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand font-mono text-xs font-semibold text-white">
        {n}
      </span>
      <p className="mb-1 text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs leading-relaxed text-ink-soft">{desc}</p>
    </li>
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
