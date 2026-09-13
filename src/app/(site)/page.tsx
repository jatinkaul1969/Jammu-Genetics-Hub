import Link from "next/link";
import { ArrowRight, Home as HomeIcon, ScanSearch, Truck, FileCheck2 } from "lucide-react";
import { getCategories, getPopularProducts, getLabs } from "@/lib/catalog";
import { CategoryRail } from "@/components/CategoryRail";
import { ProductCard } from "@/components/ProductCard";
import { HeroSearch } from "@/components/HeroSearch";
import { DiagnosticsBackdrop } from "@/components/DiagnosticsBackdrop";
import { getBaseUrl } from "@/lib/site-url";
import { SERVICEABLE_CITIES } from "@/lib/serviceable-areas";
import { buildBusinessJsonLd } from "@/lib/seo";

export default async function HomePage() {
  const [categories, popularProducts, labs, baseUrl] = await Promise.all([
    getCategories(),
    getPopularProducts(8),
    getLabs(),
    getBaseUrl(),
  ]);

  const otherLabs = labs.filter((l) => !l.isOwn);
  const jgh = labs.find((l) => l.isOwn);

  const jsonLd = buildBusinessJsonLd({
    name: "Jammu Genetics Hub",
    url: baseUrl,
    description:
      "Jammu's one-stop diagnostics platform, directly affiliated with every major NABL-accredited lab — compare test prices across all of them and book free home sample collection from whichever you choose.",
    addressLocality: "Jammu",
    addressRegion: "Jammu and Kashmir",
    areaServed: SERVICEABLE_CITIES.map((c) => c.label).join(", "),
  });

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative overflow-hidden border-b border-border bg-gradient-to-br from-brand-soft via-cat-blue-soft/50 to-accent-soft/40">
        <DiagnosticsBackdrop />
        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="mb-3 font-mono text-xs uppercase tracking-wider text-brand">
            Jammu Genetics Hub · Diagnostics Aggregator
          </p>
          <h1 className="max-w-2xl font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl md:text-5xl">
            Jammu&apos;s one-stop diagnostics platform — every lab, every test, one search.
          </h1>
          <p className="mt-4 max-w-xl text-base text-ink-soft">
            We&apos;re directly accredited with every major lab in Jammu — Thyrocare, Redcliffe Labs, Dr
            Lal PathLabs, Metropolis and specialist genetics partners. Compare the same test&apos;s price
            across all of them in one search, then book with whoever you trust — a phlebotomist comes home
            to collect your sample no matter which lab you choose.
          </p>
          <div className="mt-6 max-w-xl">
            <HeroSearch />
          </div>

          <div className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
            <Stat value={`${labs.length}`} label="labs compared side by side" />
            <Stat value="3,600+" label="tests &amp; packages (growing)" />
            <Stat value="12–24 hrs" label="typical report turnaround" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">Browse by category</h2>
        <CategoryRail categories={categories} />
        <p className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-ink-faint">
          Serving: {SERVICEABLE_CITIES.map((c, i) => (
            <span key={c.key} className="flex items-center gap-1.5">
              <Link href={`/${c.key}`} className="font-medium text-brand hover:underline">
                {c.label}
              </Link>
              {i < SERVICEABLE_CITIES.length - 1 && "·"}
            </span>
          ))}
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-4">
          <ValueProp
            icon={<ScanSearch size={20} />}
            title="Compare, honestly"
            desc={`Real prices across all ${labs.length} affiliated labs, side by side, before you pick one.`}
            color="blue"
          />
          <ValueProp
            icon={<HomeIcon size={20} />}
            title="Free home collection"
            desc="A trained phlebotomist visits you — from any lab you choose."
            color="teal"
          />
          <ValueProp
            icon={<Truck size={20} />}
            title="Track your booking"
            desc="Know exactly when your sample is collected and processed."
            color="coral"
          />
          <ValueProp
            icon={<FileCheck2 size={20} />}
            title="Digital reports"
            desc="Reports delivered online, ready to download and share."
            color="purple"
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-xl font-semibold text-ink">Most booked tests &amp; packages</h2>
          <Link href="/search" className="flex items-center gap-1 text-sm font-medium text-brand hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularProducts.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
          <h2 className="mb-1 font-display text-xl font-semibold text-ink">
            One platform, every lab you trust
          </h2>
          <p className="mb-6 text-sm text-ink-soft">
            {jgh?.name} doesn&apos;t run its own testing lab — we&apos;re directly accredited with every
            lab below, and every test is processed by them. What we do run is the comparison, the booking,
            and our own phlebotomist for home collection — so whether you&apos;re comparing prices or just
            want one place to book with any of them, it&apos;s all here.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {otherLabs.map((lab) => (
              <div
                key={lab.id}
                className="flex items-center gap-3 rounded-xl border border-border border-l-4 p-3"
                style={{ borderLeftColor: lab.colorHex }}
              >
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg font-mono text-xs font-semibold text-white"
                  style={{ backgroundColor: lab.colorHex }}
                >
                  {lab.logoInitials}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{lab.name}</p>
                  <p className="text-xs text-ink-faint">{lab.rating}★ · {lab.turnaroundNote}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 className="mb-6 font-display text-xl font-semibold text-ink">How it works</h2>
        <div className="grid gap-4 sm:grid-cols-4">
          <Step n={1} title="Search &amp; compare" desc="Find your test and see prices across every lab we work with." color="teal" />
          <Step n={2} title="Pick a lab &amp; book" desc="Choose the best price or the lab you trust most, then pick a slot." color="blue" />
          <Step n={3} title="Sample collected at home" desc="A phlebotomist from that lab visits you — no clinic visit needed." color="coral" />
          <Step n={4} title="Get your report" desc="Download your report online as soon as it's ready." color="purple" />
        </div>
      </section>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="font-mono text-2xl font-semibold text-brand-dark">{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}

const ACCENT_CLASSES = {
  teal: { text: "text-cat-teal", bg: "bg-cat-teal-soft", solid: "bg-cat-teal" },
  blue: { text: "text-cat-blue", bg: "bg-cat-blue-soft", solid: "bg-cat-blue" },
  coral: { text: "text-cat-coral", bg: "bg-cat-coral-soft", solid: "bg-cat-coral" },
  purple: { text: "text-cat-purple", bg: "bg-cat-purple-soft", solid: "bg-cat-purple" },
} as const;

function ValueProp({
  icon,
  title,
  desc,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: keyof typeof ACCENT_CLASSES;
}) {
  const c = ACCENT_CLASSES[color];
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <span className={`mb-2 inline-flex h-9 w-9 items-center justify-center rounded-lg ${c.bg} ${c.text}`}>{icon}</span>
      <p className="mb-1 text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-soft">{desc}</p>
    </div>
  );
}

function Step({
  n,
  title,
  desc,
  color,
}: {
  n: number;
  title: string;
  desc: string;
  color: keyof typeof ACCENT_CLASSES;
}) {
  const c = ACCENT_CLASSES[color];
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <span className={`mb-2 flex h-7 w-7 items-center justify-center rounded-full ${c.solid} font-mono text-xs font-semibold text-white`}>
        {n}
      </span>
      <p className="mb-1 text-sm font-semibold text-ink">{title}</p>
      <p className="text-xs text-ink-soft">{desc}</p>
    </div>
  );
}
