import Link from "next/link";
import { Dna, Microscope, ArrowRight, BadgeCheck, ScanSearch, FlaskConical, HelpCircle } from "lucide-react";
import { formatInr } from "@/lib/format";
import type { ServiceableCity } from "@/lib/serviceable-areas";
import { SERVICEABLE_CITIES } from "@/lib/serviceable-areas";
import { GENETICIST_CREDENTIAL } from "@/lib/genetics-content";
import { HUBS, hubPath } from "@/lib/hub-config";
import type { HubKey, TestGroup } from "@/lib/test-knowledge";
import { GeneticCounsellingBanner } from "@/components/GeneticCounsellingBanner";

type CardProduct = {
  slug: string;
  name: string;
  description: string;
  lowestPrice: number;
  labCount: number;
};

function ldScript(ld: unknown, key: string | number) {
  return <script key={key} type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />;
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft">
      {icon} {children}
    </span>
  );
}

export function TestCard({ cityKey, p }: { cityKey: string; p: CardProduct }) {
  return (
    <Link
      href={`/${cityKey}/tests/${p.slug}`}
      className="group flex flex-col justify-between rounded-xl border border-border bg-surface p-4 hover:border-brand"
    >
      <div>
        <p className="text-sm font-semibold text-ink group-hover:text-brand">{p.name}</p>
        <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-ink-soft">{p.description}</p>
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
  );
}

function OtherHubLink({ city, hub }: { city: ServiceableCity; hub: HubKey }) {
  const other: HubKey = hub === "genetic" ? "oncology" : "genetic";
  return (
    <Link href={hubPath(city.key, other)} className="font-medium text-brand hover:underline">
      {HUBS[other].label} in {city.label}
    </Link>
  );
}

export function HubView({
  city,
  hub,
  baseUrl,
  groups,
}: {
  city: ServiceableCity;
  hub: HubKey;
  baseUrl: string;
  groups: { group: TestGroup; total: number; products: CardProduct[] }[];
}) {
  const cfg = HUBS[hub];
  const visible = groups.filter((g) => g.total > 0);
  const total = visible.reduce((n, g) => n + g.total, 0);
  const Icon = hub === "genetic" ? Dna : Microscope;
  const faqs = cfg.faqs(city.label, total);

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${cfg.label} in ${city.label}`,
      itemListElement: visible.flatMap((g) => g.products).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: `${baseUrl}/${city.key}/tests/${p.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: city.label, item: `${baseUrl}/${city.key}` },
        { "@type": "ListItem", position: 3, name: cfg.label, item: `${baseUrl}${hubPath(city.key, hub)}` },
      ],
    },
  ];

  return (
    <>
      {jsonLd.map((ld, i) => ldScript(ld, i))}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-brand">Home</Link>
          {" / "}
          <Link href={`/${city.key}`} className="hover:text-brand">{city.label}</Link>
          {" / "}
          <span className="text-ink-soft">{cfg.label}</span>
        </nav>

        <div className="flex items-start gap-3">
          <span className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-soft text-brand">
            <Icon size={20} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">{cfg.h1(city.label)}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{cfg.pitch(city.label, total)}</p>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Chip icon={<FlaskConical size={13} className="text-brand" />}>{total}+ tests</Chip>
          <Chip icon={<ScanSearch size={13} className="text-brand" />}>Prices from partner labs</Chip>
          <Chip icon={<BadgeCheck size={13} className="text-brand" />}>Guidance from {GENETICIST_CREDENTIAL}</Chip>
        </div>

        <nav aria-label="Test categories" className="mt-6 flex flex-wrap gap-2">
          {visible.map((g) => (
            <a
              key={g.group.slug}
              href={`#${g.group.slug}`}
              className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft hover:border-brand hover:text-brand"
            >
              {g.group.name} <span className="text-ink-faint">({g.total})</span>
            </a>
          ))}
        </nav>

        {visible.map((g) => (
          <section key={g.group.slug} id={g.group.slug} className="mt-10 scroll-mt-20">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div>
                <h2 className="font-display text-xl font-semibold text-ink">{g.group.name}</h2>
                <p className="text-sm text-ink-soft">{g.group.blurb}</p>
              </div>
              <Link
                href={hubPath(city.key, g.group.hubs[0], g.group.slug)}
                className="flex items-center gap-1 text-sm font-medium text-brand hover:underline"
              >
                View all {g.total} <ArrowRight size={14} />
              </Link>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {g.products.map((p) => (
                <TestCard key={p.slug} cityKey={city.key} p={p} />
              ))}
            </div>
            {g.total > g.products.length && (
              <p className="mt-3 text-xs text-ink-faint">
                Showing {g.products.length} of {g.total}.{" "}
                <Link href={hubPath(city.key, g.group.hubs[0], g.group.slug)} className="font-medium text-brand hover:underline">
                  See the full {g.group.name.toLowerCase()} list
                </Link>
              </p>
            )}
          </section>
        ))}

        <section className="mt-12">
          <GeneticCounsellingBanner cityKey={city.key} cityLabel={city.label} variant={hub} />
        </section>

        <section className="mt-12">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <HelpCircle size={18} className="text-brand" /> {cfg.label} in {city.label} — common questions
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
            General information only — not medical advice. Please discuss test choices and results with your doctor.
          </p>
        </section>

        <section className="mt-10 flex flex-wrap gap-x-3 gap-y-2 border-t border-border pt-6 text-sm">
          <OtherHubLink city={city} hub={hub} />
          <span className="text-ink-faint">·</span>
          <span className="text-ink-faint">{cfg.label} also in:</span>
          {SERVICEABLE_CITIES.filter((c) => c.key !== city.key).map((c) => (
            <Link key={c.key} href={hubPath(c.key, hub)} className="font-medium text-brand hover:underline">
              {c.label}
            </Link>
          ))}
        </section>
      </div>
    </>
  );
}

export function GroupView({
  city,
  hub,
  baseUrl,
  group,
  products,
  siblingGroups,
}: {
  city: ServiceableCity;
  hub: HubKey;
  baseUrl: string;
  group: TestGroup;
  products: CardProduct[];
  siblingGroups: { group: TestGroup; total: number }[];
}) {
  const cfg = HUBS[hub];
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${group.name} in ${city.label}`,
      itemListElement: products.slice(0, 100).map((p, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name: p.name,
        url: `${baseUrl}/${city.key}/tests/${p.slug}`,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
        { "@type": "ListItem", position: 2, name: city.label, item: `${baseUrl}/${city.key}` },
        { "@type": "ListItem", position: 3, name: cfg.label, item: `${baseUrl}${hubPath(city.key, hub)}` },
        { "@type": "ListItem", position: 4, name: group.name, item: `${baseUrl}${hubPath(city.key, hub, group.slug)}` },
      ],
    },
  ];

  return (
    <>
      {jsonLd.map((ld, i) => ldScript(ld, i))}
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-brand">Home</Link>
          {" / "}
          <Link href={`/${city.key}`} className="hover:text-brand">{city.label}</Link>
          {" / "}
          <Link href={hubPath(city.key, hub)} className="hover:text-brand">{cfg.label}</Link>
          {" / "}
          <span className="text-ink-soft">{group.name}</span>
        </nav>

        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
          {group.name} in {city.label}
        </h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          {group.blurb} {products.length} test{products.length === 1 ? "" : "s"} available through Jammu Genetics Hub in{" "}
          {city.label} — open any test to see what it is for, who it is advised for, its sample type and partner-lab
          price.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {products.map((p) => (
            <TestCard key={p.slug} cityKey={city.key} p={p} />
          ))}
        </div>

        <section className="mt-12">
          <GeneticCounsellingBanner cityKey={city.key} cityLabel={city.label} variant={hub} />
        </section>

        <section className="mt-10 border-t border-border pt-6">
          <h2 className="mb-3 text-sm font-semibold text-ink">More {cfg.label.toLowerCase()} in {city.label}</h2>
          <div className="flex flex-wrap gap-2">
            {siblingGroups
              .filter((s) => s.group.slug !== group.slug && s.total > 0)
              .map((s) => (
                <Link
                  key={s.group.slug}
                  href={hubPath(city.key, s.group.hubs[0], s.group.slug)}
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-soft hover:border-brand hover:text-brand"
                >
                  {s.group.name} <span className="text-ink-faint">({s.total})</span>
                </Link>
              ))}
          </div>
          <p className="mt-4 text-sm">
            <Link href={hubPath(city.key, hub)} className="font-medium text-brand hover:underline">
              ← All {cfg.label.toLowerCase()} in {city.label}
            </Link>
          </p>
        </section>
      </div>
    </>
  );
}
