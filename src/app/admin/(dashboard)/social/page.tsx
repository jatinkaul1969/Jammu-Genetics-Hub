import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getTestIndex } from "@/lib/test-index";
import { POPULAR_GENETIC_TESTS } from "@/lib/popular-tests";
import { CopyButton } from "@/components/CopyButton";
import { SocialStudio, type StudioState } from "@/components/SocialStudio";
import { TEMPLATES } from "@/lib/social/templates";
import { FORMATS } from "@/lib/social/formats";
import { SOURCES } from "@/lib/social/copy";
import { FACTS, MYTHS } from "@/lib/social/content";
import { SPOTLIGHT_ROTATION, buildPlan, studioPath } from "@/lib/social/calendar";
import { GBP_CHECKLIST, GBP_DESCRIPTION, buildGbpServices } from "@/lib/social/gbp-kit";
import { REEL_SCRIPTS } from "@/lib/social/reels";
import { GOOGLE_REVIEW_URL } from "@/lib/contact";

type SP = Record<string, string | string[] | undefined>;

const TABS = [
  { id: "posters", label: "Poster maker" },
  { id: "plan", label: "30-day plan" },
  { id: "google", label: "Google profile kit" },
  { id: "videos", label: "Video scripts" },
] as const;

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

function presetFrom(sp: SP): Partial<StudioState> {
  const g = (k: string) => first(sp[k]);
  const out: Partial<StudioState> = {};
  if (g("template")) out.template = g("template");
  if (g("slug")) out.slug = g("slug");
  if (g("lang") === "hi") out.lang = "hi";
  if (g("format")) out.format = g("format");
  const theme = g("theme");
  if (theme === "teal" || theme === "light" || theme === "warm") out.theme = theme;
  if (g("source")) out.source = g("source");
  if (g("qr")) out.qr = g("qr") === "1";
  if (g("price")) out.price = g("price") !== "0";
  if (g("headline")) out.headline = g("headline");
  if (g("body")) out.body = g("body");
  if (g("eyebrow")) out.eyebrow = g("eyebrow");
  if (g("date")) out.date = g("date");
  if (g("place")) out.place = g("place");
  if (g("myth")) out.mythId = g("myth");
  if (g("fact")) out.factId = g("fact");
  return out;
}

const dayFmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

export default async function SocialStudioPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const tab = TABS.find((t) => t.id === first(sp.tab))?.id ?? "posters";

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold text-ink">Social Studio</h2>
        <p className="text-sm text-ink-soft">
          Make ready-to-post posters, captions and tracked links for Instagram, Facebook, WhatsApp and Google — all in a
          couple of clicks. Every link is tagged so you can see which channel brings customers.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-1 border-b border-border">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/admin/social?tab=${t.id}`}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium ${tab === t.id ? "border-brand text-brand" : "border-transparent text-ink-soft hover:text-ink"}`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "posters" && <PostersTab sp={sp} />}
      {tab === "plan" && <PlanTab />}
      {tab === "google" && <GoogleTab />}
      {tab === "videos" && <VideosTab />}
    </div>
  );
}

// ── Poster maker ─────────────────────────────────────────────────────────
async function PostersTab({ sp }: { sp: SP }) {
  const [rows, index] = await Promise.all([prisma.product.findMany({ select: { slug: true, name: true }, orderBy: { name: "asc" } }), getTestIndex()]);
  const groupOf = new Map(index.entries.map((e) => [e.slug, e.group]));
  // Genetic / oncology tests first (the ones the business is built around), then routine tests.
  const products = rows
    .map((r) => ({ slug: r.slug, name: r.name, group: groupOf.get(r.slug) ?? "Routine test" }))
    .sort((a, b) => Number(b.group !== "Routine test") - Number(a.group !== "Routine test"));

  return (
    <SocialStudio
      templates={TEMPLATES}
      formats={Object.values(FORMATS).map((f) => ({ id: f.id, label: f.label, hint: f.hint, w: f.w, h: f.h }))}
      sources={SOURCES.map((s) => ({ id: s.id, label: s.label }))}
      products={products}
      featured={[...POPULAR_GENETIC_TESTS.map((t) => t.slug), ...SPOTLIGHT_ROTATION]}
      myths={MYTHS.map((m) => ({ id: m.id, label: `${m.topic.en}: ${m.myth.en}` }))}
      facts={FACTS.map((f) => ({ id: f.id, label: f.text.en.length > 90 ? `${f.text.en.slice(0, 88)}…` : f.text.en }))}
      initial={presetFrom(sp)}
    />
  );
}

// ── 30-day plan ──────────────────────────────────────────────────────────
async function PlanTab() {
  const plan = buildPlan(new Date(), 30);
  const slugs = [...new Set(plan.map((p) => p.slug).filter((s): s is string => !!s))];
  const names = new Map((await prisma.product.findMany({ where: { slug: { in: slugs } }, select: { slug: true, name: true } })).map((p) => [p.slug, p.name]));
  const label = (id: string) => TEMPLATES.find((t) => t.id === id)?.label ?? id;

  return (
    <div>
      <p className="mb-4 max-w-3xl text-sm text-ink-soft">
        One post a day, Monday to Saturday (Sunday is a rest day), in a steady rhythm: myth-busting, test spotlight, who
        may need it, a quick fact, a price or home-collection card, and a longer piece on Saturday. Health awareness days
        replace the regular post. Click <strong>Make poster</strong> and the maker opens with everything filled in.
      </p>
      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        {plan.map((i) => (
          <div key={i.date} className="grid gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[110px_minmax(0,1fr)_auto] sm:items-center">
            <div>
              <p className="font-medium text-ink">{dayFmt(i.date)}</p>
              <p className="text-xs text-ink-faint">{i.weekday}</p>
            </div>
            <div>
              <p className="text-ink">
                {i.awareness ? <span className="mr-2 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-medium text-gold">{i.awareness}</span> : null}
                <span className="font-medium">{label(i.template)}</span>
                {i.slug && names.get(i.slug) ? <span className="text-ink-soft"> · {names.get(i.slug)}</span> : null}
              </p>
              <p className="mt-0.5 text-xs text-ink-soft">{i.why}</p>
              <p className="mt-0.5 text-[11px] text-ink-faint">Post on: {i.channels}</p>
            </div>
            <Link href={studioPath(i)} className="w-fit rounded-lg border border-brand px-3 py-1.5 text-xs font-semibold text-brand hover:bg-brand hover:text-white">
              Make poster
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Google profile kit ───────────────────────────────────────────────────
async function GoogleTab() {
  const services = await buildGbpServices();
  const reviewMessage = `Hello, thank you for choosing Jammu Genetics Hub. If our service was helpful, a short Google review helps other families find us: ${GOOGLE_REVIEW_URL || "[paste your Google review link]"}

If anything could have been better, please reply here and we will put it right.`;
  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-2 font-display text-base font-semibold text-ink">Do these once</h3>
        <ol className="space-y-2">
          {GBP_CHECKLIST.map((c, n) => (
            <li key={c.step} className="flex gap-3 rounded-lg border border-border bg-surface p-3 text-sm">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-dark">{n + 1}</span>
              <div className="min-w-0">
                <p className="font-medium text-ink">{c.step}</p>
                <p className="break-words text-ink-soft">{c.detail}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-ink">Ask for a review</h3>
          <CopyButton text={reviewMessage} />
        </div>
        <p className="rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed text-ink">{reviewMessage}</p>
        <p className="mt-1 text-xs text-ink-faint">
          Send it on WhatsApp after the report is delivered — to every customer, not only the happy ones, and never offer anything in return (Google does not allow
          that).{" "}
          {GOOGLE_REVIEW_URL
            ? "Using your review link from the settings."
            : "Replace the link: in your Google Business Profile choose “Ask for reviews”, copy the link, then add it in Vercel as NEXT_PUBLIC_GOOGLE_REVIEW_URL so the site uses it too."}
        </p>
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-ink">Business description</h3>
          <CopyButton text={GBP_DESCRIPTION} />
        </div>
        <p className="rounded-lg border border-border bg-surface p-3 text-sm leading-relaxed text-ink">{GBP_DESCRIPTION}</p>
        <p className={`mt-1 text-xs ${GBP_DESCRIPTION.length > 750 ? "text-accent" : "text-ink-faint"}`}>{GBP_DESCRIPTION.length} / 750 characters</p>
      </section>

      <section>
        <h3 className="mb-1 font-display text-base font-semibold text-ink">Services to add ({services.length})</h3>
        <p className="mb-3 text-sm text-ink-soft">In your Google profile open Edit profile → Services → Add service. Paste the name, price and description for each. Prices are the lowest current price on the website.</p>
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {services.map((s) => (
            <div key={s.slug} className="border-b border-border p-3 text-sm last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-ink">{s.name}</p>
                <p className="text-ink-soft">from ₹{new Intl.NumberFormat("en-IN").format(s.price)}</p>
              </div>
              <p className="mt-1 text-ink-soft">{s.description}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <CopyButton text={s.name} label="Copy name" />
                <CopyButton text={s.description} label="Copy description" />
                <CopyButton text={String(s.price)} label="Copy price" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Video scripts ────────────────────────────────────────────────────────
function VideosTab() {
  return (
    <div>
      <div className="mb-4 max-w-3xl rounded-xl border border-border bg-surface p-4 text-sm text-ink-soft">
        <p className="font-medium text-ink">How to use these</p>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          <li>Short to-camera videos (30–45 seconds) by the counsellor or doctor who actually does this work are the format people trust most.</li>
          <li>Read the script once and change anything you would not say, or that is not accurate. Never promise results.</li>
          <li>Film on a phone, near a window, with captions on. End with the WhatsApp number on screen.</li>
        </ul>
      </div>
      <div className="space-y-4">
        {REEL_SCRIPTS.map((r) => {
          const english = [r.hook.en, ...r.beats.map((b) => b.en), r.cta.en].join("\n\n");
          return (
            <article key={r.id} className="rounded-xl border border-border bg-surface p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="font-display text-base font-semibold text-ink">{r.title}</h3>
                  <p className="text-xs text-ink-faint">About {r.seconds} seconds</p>
                </div>
                <CopyButton text={english} label="Copy script" />
              </div>
              <p className="mt-3 text-sm font-medium text-brand-dark">Hook: {r.hook.en}</p>
              <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-ink">
                {r.beats.map((b) => (
                  <li key={b.en}>{b.en}</li>
                ))}
              </ol>
              <p className="mt-2 text-sm text-ink-soft">{r.cta.en}</p>
              <dl className="mt-3 grid gap-2 text-xs text-ink-soft sm:grid-cols-2">
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-ink-faint">Text on screen</dt>
                  <dd>{r.onScreen}</dd>
                </div>
                <div>
                  <dt className="font-semibold uppercase tracking-wide text-ink-faint">Shots to include</dt>
                  <dd>{r.broll}</dd>
                </div>
              </dl>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-xs text-ink-faint hover:text-brand">Hindi version (optional)</summary>
                <div className="mt-2 space-y-1.5 rounded-lg bg-bg p-3 text-ink">
                  <p className="font-medium">{r.hook.hi}</p>
                  {r.beats.map((b) => (
                    <p key={b.hi}>{b.hi}</p>
                  ))}
                  <p className="text-ink-soft">{r.cta.hi}</p>
                  <div className="pt-1">
                    <CopyButton text={[r.hook.hi, ...r.beats.map((b) => b.hi), r.cta.hi].join("\n\n")} label="Copy Hindi script" />
                  </div>
                </div>
              </details>
            </article>
          );
        })}
      </div>
    </div>
  );
}
