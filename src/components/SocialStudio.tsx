"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, Loader2, Search } from "lucide-react";
import { CopyButton } from "@/components/CopyButton";
import type { TemplateInfo } from "@/lib/social/templates";

type FormatInfo = { id: string; label: string; hint: string; w: number; h: number };
type ProductOpt = { slug: string; name: string; group: string };
type Opt = { id: string; label: string };

export type StudioState = {
  template: string;
  slug: string;
  lang: "en" | "hi";
  format: string;
  theme: "teal" | "light" | "warm";
  source: string;
  qr: boolean;
  price: boolean;
  headline: string;
  body: string;
  eyebrow: string;
  date: string;
  place: string;
  mythId: string;
  factId: string;
};

type Props = {
  templates: TemplateInfo[];
  formats: FormatInfo[];
  sources: Opt[];
  products: ProductOpt[];
  featured: string[];
  myths: Opt[];
  facts: Opt[];
  initial: Partial<StudioState>;
};

const THEME_SWATCH: Record<string, string> = {
  teal: "linear-gradient(160deg,#063f34,#0b6e5c)",
  light: "linear-gradient(180deg,#f6f8f7,#cfe5de)",
  warm: "linear-gradient(160deg,#7d2c14,#c1502e)",
};

function Seg<T extends string>({ value, options, onChange }: { value: T; options: { id: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border border-border bg-bg p-1">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${value === o.id ? "bg-brand text-white" : "text-ink-soft hover:text-brand"}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</p>
      {children}
      {hint && <p className="mt-1 text-[11px] text-ink-faint">{hint}</p>}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand";

export function SocialStudio({ templates, formats, sources, products, featured, myths, facts, initial }: Props) {
  const firstTemplate = templates.find((t) => t.id === initial.template) ?? templates[0];
  const [s, setS] = useState<StudioState>({
    template: firstTemplate.id,
    slug: initial.slug ?? (firstTemplate.needsTest ? "double-marker-test" : ""),
    lang: initial.lang === "hi" ? "hi" : "en",
    format: initial.format ?? firstTemplate.defaultFormat,
    theme: initial.theme ?? "teal",
    source: initial.source ?? "instagram",
    qr: initial.qr ?? false,
    price: initial.price ?? true,
    headline: initial.headline ?? "",
    body: initial.body ?? "",
    eyebrow: initial.eyebrow ?? "",
    date: initial.date ?? "",
    place: initial.place ?? "",
    mythId: initial.mythId ?? myths[0]?.id ?? "",
    factId: initial.factId ?? facts[0]?.id ?? "",
  });
  const set = <K extends keyof StudioState>(k: K, v: StudioState[K]) => setS((p) => ({ ...p, [k]: v }));

  const info = templates.find((t) => t.id === s.template)!;
  const fmt = formats.find((f) => f.id === s.format) ?? formats[0];
  const product = products.find((p) => p.slug === s.slug);

  const query = useMemo(() => {
    const p = new URLSearchParams();
    p.set("template", s.template);
    p.set("format", s.format);
    p.set("lang", s.lang);
    p.set("theme", s.theme);
    p.set("source", s.source);
    p.set("qr", s.qr ? "1" : "0");
    p.set("price", s.price ? "1" : "0");
    if (info.needsTest && s.slug) p.set("slug", s.slug);
    if (info.custom) {
      if (s.headline) p.set("headline", s.headline);
      if (s.body) p.set("body", s.body);
      if (s.eyebrow) p.set("eyebrow", s.eyebrow);
      if (s.date) p.set("date", s.date);
      if (s.place) p.set("place", s.place);
    }
    if (s.template === "myth" && s.mythId) p.set("myth", s.mythId);
    if (s.template === "fact" && s.factId) p.set("fact", s.factId);
    return p.toString();
  }, [s, info]);

  const posterUrl = `/api/admin/social/poster?${query}`;
  const [loadedUrl, setLoadedUrl] = useState("");
  const [imgError, setImgError] = useState(false);
  const loading = loadedUrl !== posterUrl && !imgError;

  // Caption + tracked link (debounced so typing in the text boxes doesn't spam the server)
  const [copy, setCopy] = useState<{ caption: string; hashtags: string[]; whatsapp: string; alt: string; link: string; notes?: string[] } | null>(null);
  const [copyError, setCopyError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    const t = setTimeout(() => {
      fetch(`/api/admin/social/copy?${query}`)
        .then(async (r) => {
          const d = await r.json();
          if (cancelled) return;
          if (!r.ok) {
            setCopyError(d.error ?? "Could not build the caption.");
            setCopy(null);
          } else {
            setCopy(d);
            setCopyError(null);
          }
        })
        .catch(() => {
          if (!cancelled) setCopyError("Could not build the caption.");
        });
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query]);
  const [caption, setCaption] = useState("");
  const [capFor, setCapFor] = useState("");
  if (copy && capFor !== copy.caption + copy.link) {
    setCapFor(copy.caption + copy.link);
    setCaption(copy.caption);
  }

  // test picker
  const [search, setSearch] = useState("");
  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return products.filter((p) => featured.includes(p.slug)).slice(0, 8);
    return products.filter((p) => p.name.toLowerCase().includes(q) || p.slug.includes(q)).slice(0, 8);
  }, [search, products, featured]);

  const ratio = `${fmt.w} / ${fmt.h}`;
  const sizeLinks = formats.map((f) => ({ f, href: `/api/admin/social/poster?${query.replace(/format=[^&]*/, `format=${f.id}`)}&download=1` }));
  const hashtags = copy?.hashtags.join(" ") ?? "";
  const fullPost = `${caption}\n\n${hashtags}`.trim();

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
      <div className="space-y-5">
        <Field label="1 · Choose a poster type">
          <div className="grid gap-2 sm:grid-cols-2">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setS((p) => ({ ...p, template: t.id, format: t.defaultFormat, slug: t.needsTest && !p.slug ? "double-marker-test" : p.slug, qr: t.id === "doctor" ? true : p.qr }));
                }}
                className={`rounded-lg border p-3 text-left ${s.template === t.id ? "border-brand bg-brand-soft" : "border-border bg-surface hover:border-brand"}`}
              >
                <p className="text-sm font-semibold text-ink">{t.label}</p>
                <p className="mt-0.5 text-xs leading-snug text-ink-soft">{t.blurb}</p>
              </button>
            ))}
          </div>
        </Field>

        {info.needsTest && (
          <Field label="2 · Choose the test" hint="Genetic and oncology tests, plus every routine test in the catalog.">
            <div className="rounded-lg border border-border bg-surface p-3">
              {product ? (
                <div className="mb-2 rounded-md bg-brand-soft px-3 py-2 text-sm">
                  <span className="font-medium text-brand-dark">{product.name}</span>
                </div>
              ) : null}
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search 1,300+ tests — e.g. NIPT, exome, BRCA, leukemia" className={`${inputCls} pl-8`} />
              </div>
              <ul className="mt-2 max-h-52 divide-y divide-border overflow-auto rounded-md border border-border">
                {results.map((r) => (
                  <li key={r.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        set("slug", r.slug);
                        setSearch("");
                      }}
                      className={`flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-bg ${r.slug === s.slug ? "bg-brand-soft/60" : ""}`}
                    >
                      <span className="text-ink">{r.name}</span>
                      <span className="shrink-0 text-[11px] text-ink-faint">{r.group}</span>
                    </button>
                  </li>
                ))}
                {results.length === 0 && <li className="px-3 py-2 text-sm text-ink-faint">No match.</li>}
              </ul>
            </div>
          </Field>
        )}

        {s.template === "myth" && (
          <Field label="Which myth?">
            <select className={inputCls} value={s.mythId} onChange={(e) => set("mythId", e.target.value)}>
              {myths.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
        )}
        {s.template === "fact" && (
          <Field label="Which fact?">
            <select className={inputCls} value={s.factId} onChange={(e) => set("factId", e.target.value)}>
              {facts.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>
        )}

        {info.custom && (
          <div className="space-y-3 rounded-lg border border-border bg-surface p-3">
            <Field label="Small label above the headline (optional)">
              <input className={inputCls} value={s.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} placeholder="e.g. Free awareness talk" maxLength={60} />
            </Field>
            <Field label="Headline">
              <input className={inputCls} value={s.headline} onChange={(e) => set("headline", e.target.value)} placeholder="e.g. Thalassemia carrier screening camp" maxLength={140} />
            </Field>
            <Field label="Message">
              <textarea className={inputCls} rows={3} value={s.body} onChange={(e) => set("body", e.target.value)} maxLength={600} />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Date & time (optional)">
                <input className={inputCls} value={s.date} onChange={(e) => set("date", e.target.value)} placeholder="Sun 15 Mar, 10 am" maxLength={80} />
              </Field>
              <Field label="Place (optional)">
                <input className={inputCls} value={s.place} onChange={(e) => set("place", e.target.value)} placeholder="Sarwal, Jammu" maxLength={120} />
              </Field>
            </div>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Size">
            <select className={inputCls} value={s.format} onChange={(e) => set("format", e.target.value)}>
              {formats.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-ink-faint">{fmt.hint}</p>
          </Field>
          <Field label="Colour">
            <div className="flex gap-2">
              {(["teal", "light", "warm"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set("theme", t)}
                  aria-label={`${t} theme`}
                  className={`h-10 w-14 rounded-lg border-2 ${s.theme === t ? "border-brand" : "border-border"}`}
                  style={{ background: THEME_SWATCH[t] }}
                />
              ))}
            </div>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Where will you post it?" hint="Adds a tracking tag to the link so you can see which channel brings customers.">
            <select className={inputCls} value={s.source} onChange={(e) => set("source", e.target.value)}>
              {sources.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Language">
            <Seg
              value={s.lang}
              onChange={(v) => set("lang", v)}
              options={[
                { id: "en", label: "English" },
                { id: "hi", label: "हिन्दी (optional)" },
              ]}
            />
            {s.lang === "hi" && <p className="mt-1 text-[11px] text-ink-faint">Hindi text is written for the main tests; others keep their English names. Have it proofread before posting.</p>}
          </Field>
        </div>

        <div className="flex flex-wrap gap-5 text-sm text-ink">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={s.qr} onChange={(e) => set("qr", e.target.checked)} className="h-4 w-4 accent-[#0b6e5c]" /> Add a QR code (for print)
          </label>
          {info.needsTest && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={s.price} onChange={(e) => set("price", e.target.checked)} className="h-4 w-4 accent-[#0b6e5c]" /> Show the price
            </label>
          )}
        </div>
      </div>

      <div className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-xl border border-border bg-surface p-3">
          <div className="relative mx-auto w-full overflow-hidden rounded-lg bg-bg" style={{ aspectRatio: ratio, maxHeight: 640 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={posterUrl}
              src={posterUrl}
              alt="Poster preview"
              className={`h-full w-full object-contain ${loading ? "opacity-30" : "opacity-100"}`}
              onLoad={() => {
                setLoadedUrl(posterUrl);
                setImgError(false);
              }}
              onError={() => setImgError(true)}
            />
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-brand" size={28} />
              </div>
            )}
            {imgError && <div className="absolute inset-0 flex items-center justify-center p-6 text-center text-sm text-accent">Could not render this poster. Check that a test is selected and try again.</div>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href={`${posterUrl}&download=1`} className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              <Download size={15} /> Download PNG
            </a>
            <details className="relative">
              <summary className="cursor-pointer list-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-ink-soft hover:border-brand">Other sizes</summary>
              <div className="absolute left-0 z-10 mt-1 w-64 rounded-lg border border-border bg-surface p-1 shadow-lg">
                {sizeLinks.map(({ f, href }) => (
                  <a key={f.id} href={href} className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-bg">
                    {f.label}
                    <span className="block text-[11px] text-ink-faint">{f.hint}</span>
                  </a>
                ))}
              </div>
            </details>
          </div>
        </div>

        <div className="space-y-3 rounded-xl border border-border bg-surface p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">Caption</p>
            <div className="flex gap-2">
              <CopyButton text={fullPost} label="Copy caption + hashtags" />
            </div>
          </div>
          {copyError ? (
            <p className="text-sm text-accent">{copyError}</p>
          ) : (
            <>
              <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={12} className={`${inputCls} font-sans text-[13px] leading-relaxed`} />
              {copy && (
                <>
                  <div>
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Hashtags</p>
                    <p className="rounded-md bg-bg px-3 py-2 text-xs text-ink-soft">{hashtags}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <CopyButton text={copy.link} label="Copy tracked link" />
                    <CopyButton text={copy.whatsapp} label="Copy WhatsApp message" />
                    <CopyButton text={copy.alt} label="Copy alt text" />
                  </div>
                  <p className="break-all text-[11px] text-ink-faint">{copy.link}</p>
                  {copy.notes?.map((n) => (
                    <p key={n} className="text-[11px] text-accent">
                      {n}
                    </p>
                  ))}
                </>
              )}
              <p className="text-[11px] leading-snug text-ink-faint">Instagram works best with 3–8 relevant hashtags — trim the list if you like. Read the caption once before posting; it is general information, never a promise.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
