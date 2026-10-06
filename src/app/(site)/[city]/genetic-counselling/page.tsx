import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { BadgeCheck, MessageCircle, Phone, ArrowRight, HelpCircle, Users } from "lucide-react";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES, cityByKey } from "@/lib/serviceable-areas";
import { inheritedShareImages } from "@/lib/seo";
import { CONTACT_PHONES, buildWhatsAppLink } from "@/lib/contact";
import { GENETICIST_CREDENTIAL } from "@/lib/genetics-content";
import { GeneticistRequestForm } from "@/components/GeneticistRequestForm";

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

  const title = `Genetic Counselling in ${city.label}: Talk to a Geneticist`;
  const description = `Genetic counselling in ${city.label} — Jammu Genetics Hub connects you with ${GENETICIST_CREDENTIAL} to choose the right test and understand your results, for pregnancy, children, cancer risk and family planning.`;
  const url = `/${city.key}/genetic-counselling`;
  const shareImages = await inheritedShareImages(parent);

  return {
    title,
    description,
    keywords: [
      `genetic counselling in ${city.label}`,
      `geneticist in ${city.label}`,
      `genetic counsellor ${city.label}`,
      `genetic consultation ${city.label}`,
    ],
    alternates: { canonical: url },
    openGraph: { title, description, type: "website", url, images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

const WHEN_TO_SEE = [
  {
    title: "Planning a pregnancy or pregnant",
    body: "Understand carrier screening, NIPT, Double/Triple/Quadruple Marker results, and what a high-risk screen does and doesn't mean.",
  },
  {
    title: "A child with delay, seizures or birth defects",
    body: "Find out whether a genetic cause is likely, and whether exome or genome sequencing is worth doing.",
  },
  {
    title: "A family history of cancer",
    body: "Learn whether BRCA or a multi-gene cancer panel makes sense, and how to use a result for you and your relatives.",
  },
  {
    title: "Recurrent miscarriage or infertility",
    body: "Discuss karyotyping and other tests that can find a chromosomal reason, and your options going forward.",
  },
  {
    title: "A known inherited condition in the family",
    body: "Thalassemia, SMA, cystic fibrosis, Fragile X and others — understand the chance of passing it on and the ways to plan around it.",
  },
  {
    title: "A confusing report",
    body: "Variants of uncertain significance, carrier results and 'no cause found' reports are easier to act on once explained.",
  },
];

export default async function GeneticCounsellingPage({ params }: { params: Promise<{ city: string }> }) {
  const { city: cityKey } = await params;
  const city = cityByKey(cityKey);
  if (!city) notFound();

  const baseUrl = await getBaseUrl();

  const faqs = [
    {
      q: "What is genetic counselling?",
      a: "Genetic counselling is a conversation with a genetics professional that helps you understand how genes and inherited conditions may affect you or your family. It covers whether a genetic test is useful, what the possible results could mean, and what choices you have afterwards.",
    },
    {
      q: "Who should consider genetic counselling?",
      a: "People planning or expecting a pregnancy, parents of a child with developmental delay or suspected genetic condition, people with a family history of cancer or an inherited disease, couples with recurrent miscarriages, and anyone who has received a genetic test result they want explained.",
    },
    {
      q: "Should I get counselling before or after a genetic test?",
      a: "Both are useful. Before a test, a geneticist helps you choose the right test and understand its limits. After a test, they explain what the result means for you and your relatives, and what to do next.",
    },
    {
      q: `How does Jammu Genetics Hub connect me with a geneticist in ${city.label}?`,
      a: `Message us on WhatsApp or call, tell us briefly what you are concerned about or which test you are considering, and we will connect you with ${GENETICIST_CREDENTIAL}.`,
    },
    {
      q: "Can I book a genetic test and counselling together?",
      a: `Yes. You can book your test through Jammu Genetics Hub and ask us to connect you with a geneticist to discuss it — before the test, after the result, or both. Browse the genetic tests available in ${city.label} on our genetic tests page.`,
    },
    {
      q: "Does a genetic test result mean I will definitely get a condition?",
      a: "Not necessarily. Many results describe a risk rather than a certainty, and some tests only show you are a carrier. A geneticist can explain what a result does and does not predict.",
    },
  ];

  const jsonLd = [
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
        { "@type": "ListItem", position: 3, name: "Genetic counselling", item: `${baseUrl}/${city.key}/genetic-counselling` },
      ],
    },
  ];

  const whatsappHref = buildWhatsAppLink(
    `Hi Jammu Genetics Hub! I'd like to speak with a geneticist in ${city.label}.`
  );

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
          <span className="text-ink-soft">Genetic counselling</span>
        </nav>

        <div className="grid items-start gap-8 lg:grid-cols-[1.15fr_1fr]">
          <div className="flex items-start gap-3">
            <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <BadgeCheck size={20} />
            </span>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
                Genetic Counselling in {city.label} — talk to a certified geneticist
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                A genetic test is only as useful as your understanding of it. Jammu Genetics Hub helps patients in{" "}
                {city.label} connect with {GENETICIST_CREDENTIAL} who explain your options in plain language —
                which test to choose, what the result means for you and your family, and what to do next.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-ink-soft">
                {[
                  "Understand which genetic test, if any, you actually need",
                  "Get your results explained clearly — before and after testing",
                  "Know the next steps for you, your baby or your family",
                  "Book the test with us, all in one place",
                ].map((t) => (
                  <li key={t} className="flex gap-2">
                    <BadgeCheck size={16} className="mt-0.5 shrink-0 text-brand" /> <span>{t}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                >
                  <MessageCircle size={15} /> WhatsApp a geneticist
                </a>
                <a
                  href={`tel:+91${CONTACT_PHONES[0]}`}
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-brand"
                >
                  <Phone size={14} /> Call +91 {CONTACT_PHONES[0]}
                </a>
              </div>
            </div>
          </div>

          <div id="talk-to-a-geneticist" className="scroll-mt-24 rounded-2xl border border-brand/30 bg-surface p-5 shadow-sm sm:p-6">
            <h2 className="font-display text-lg font-semibold text-ink">Request a call from a geneticist</h2>
            <p className="mb-4 mt-1 text-sm text-ink-soft">
              Tell us a little about what you need and our team will call you back and connect you with {GENETICIST_CREDENTIAL}.
            </p>
            <GeneticistRequestForm defaultCity={city.label} />
          </div>
        </div>

        <section className="mt-10">
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <Users size={18} className="text-brand" /> When genetic counselling helps
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {WHEN_TO_SEE.map((w) => (
              <div key={w.title} className="rounded-xl border border-border bg-surface p-4">
                <p className="mb-1 text-sm font-semibold text-ink">{w.title}</p>
                <p className="text-xs leading-relaxed text-ink-soft">{w.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">How it works</h2>
          <ol className="grid gap-3 sm:grid-cols-3">
            <Step n={1} title="Tell us your concern" desc="Message or call us with the test you're considering, or just describe your situation." />
            <Step n={2} title="We connect you" desc={`We put you in touch with ${GENETICIST_CREDENTIAL} who can guide you.`} />
            <Step n={3} title="Test & understand" desc="Book the right test with us, then go through the result together so you know what to do next." />
          </ol>
        </section>

        <section className="mt-10 rounded-2xl border border-border bg-surface p-5 sm:p-6">
          <h2 className="mb-1 font-display text-lg font-semibold text-ink">
            One stop for every genetic test in {city.label}
          </h2>
          <p className="mb-4 text-sm text-ink-soft">
            Prenatal screening, newborn screening, hereditary cancer testing, whole exome and genome
            sequencing, carrier screening and single-gene tests — compare partner-lab prices and book in one place.
          </p>
          <Link
            href={`/${city.key}/genetic-tests`}
            className="inline-flex items-center gap-1 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
          >
            Browse all genetic tests <ArrowRight size={14} />
          </Link>
        </section>

        <section className="mt-10">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <HelpCircle size={18} className="text-brand" /> Genetic counselling — common questions
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
            General information only — not a substitute for medical advice from your doctor.
          </p>
        </section>

        <section className="mt-10 flex flex-wrap gap-2 border-t border-border pt-6 text-sm">
          <span className="text-ink-faint">Genetic counselling also in:</span>
          {SERVICEABLE_CITIES.filter((c) => c.key !== city.key).map((c) => (
            <Link key={c.key} href={`/${c.key}/genetic-counselling`} className="font-medium text-brand hover:underline">
              {c.label}
            </Link>
          ))}
        </section>
      </div>
    </>
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
