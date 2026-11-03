// Poster templates. Every template is a function (input) → one satori-compatible
// element tree. All text goes through ./text (shaped, wrapped and auto-fitted),
// so English and Hindi are laid out the same way and nothing overflows.
//
// Sizing: each template is written as `build(k)` — the whole stack of content at
// text scale k — and `fit()` picks the largest k that still fits the space between
// the header and footer. Short content therefore gets big, confident type (and
// fills tall formats like stories), while long content shrinks instead of
// overflowing.

import type { ReactElement } from "react";
import { Txt, type Lang, type TextStyle } from "./text";
import { BRAND, phoneDisplay, type Theme } from "./brand";
import type { Format } from "./formats";
import { FACTS, MYTHS, TIMELINE, UI, type Bi } from "./content";
import type { PosterCoupon, PosterProduct } from "./data";
import { GENETICIST_CREDENTIAL, GENETICIST_CREDENTIAL_HI } from "@/lib/genetics-content";
import { DIAGNOSTIC_FEE } from "@/lib/collection-slots";

export type TemplateId =
  | "spotlight"
  | "who"
  | "why"
  | "faq"
  | "price"
  | "myth"
  | "fact"
  | "timeline"
  | "home"
  | "announce"
  | "custom"
  | "doctor";

export type TemplateInfo = {
  id: TemplateId;
  label: string;
  blurb: string;
  needsTest: boolean;
  custom: boolean; // uses headline/body/date/place fields
  defaultFormat: "square" | "portrait" | "story" | "gbp" | "a4";
};

export const TEMPLATES: TemplateInfo[] = [
  { id: "spotlight", label: "Test spotlight", blurb: "Name, what it is, key facts and the starting price. Your everyday post.", needsTest: true, custom: false, defaultFormat: "portrait" },
  { id: "who", label: "Who may need it", blurb: "A checklist of who is usually advised this test — builds trust and gets saved.", needsTest: true, custom: false, defaultFormat: "portrait" },
  { id: "why", label: "Why it is done", blurb: "What the test looks for and why it matters, in three clear points.", needsTest: true, custom: false, defaultFormat: "portrait" },
  { id: "faq", label: "Quick answers", blurb: "Cost, report time, sample and fasting on one card.", needsTest: true, custom: false, defaultFormat: "square" },
  { id: "price", label: "Price card", blurb: "A big, clear starting price with what's included (and the new-customer offer if one is live).", needsTest: true, custom: false, defaultFormat: "square" },
  { id: "myth", label: "Myth vs Fact", blurb: "Clears up a common misunderstanding. Usually among the most-shared kinds of post.", needsTest: false, custom: false, defaultFormat: "portrait" },
  { id: "fact", label: "Did you know?", blurb: "One simple, accurate fact. Good for stories and WhatsApp status.", needsTest: false, custom: false, defaultFormat: "story" },
  { id: "timeline", label: "Pregnancy screening timeline", blurb: "Which prenatal test is done when. Save-worthy for expecting parents.", needsTest: false, custom: false, defaultFormat: "story" },
  { id: "home", label: "Home collection", blurb: "How sample collection at home works, in three steps.", needsTest: false, custom: false, defaultFormat: "portrait" },
  { id: "announce", label: "Announcement / camp", blurb: "A camp, talk or special day — you type the title, date and place.", needsTest: false, custom: true, defaultFormat: "portrait" },
  { id: "custom", label: "Custom message", blurb: "Festival wishes, a thank-you, anything you want to say.", needsTest: false, custom: true, defaultFormat: "square" },
  { id: "doctor", label: "For doctors & clinics", blurb: "A one-pager for clinics — print it (A4) or send it on WhatsApp. Scans to the doctors' page.", needsTest: false, custom: false, defaultFormat: "a4" },
];

export type PosterInput = {
  template: TemplateId;
  fmt: Format;
  lang: Lang;
  theme: Theme;
  product: PosterProduct | null;
  coupon: PosterCoupon | null;
  headline?: string;
  body?: string;
  eyebrow?: string;
  date?: string;
  place?: string;
  mythId?: string;
  factId?: string;
  showQr: boolean;
  showPrice: boolean;
  qrUri: string | null;
  logoUri: string | null;
};

type Ctx = { lang: Lang; th: Theme; fmt: Format; s: number; cw: number; pad: number; i: PosterInput };
type Item = { el: ReactElement; h: number };

const bi = (b: Bi, lang: Lang) => b[lang];
const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;

type TOpts = Partial<TextStyle> & { w?: number; lines?: number; min?: number; tight?: boolean };

function T(c: Ctx, text: string, o: TOpts & { size: number }) {
  const { w, lines, min, tight, ...st } = o;
  const kind = st.kind ?? "body";
  // Devanagari has marks above and below the line — give it more leading than Latin.
  const lh = c.lang === "hi" ? Math.max(st.lineHeight ?? 1.25, kind === "display" ? 1.32 : 1.42) : st.lineHeight;
  const style = { kind: "body", weight: 400, color: c.th.ink, ...st, lineHeight: lh, size: Math.round(st.size * c.s) } as TextStyle;
  const minSize = min ? Math.round(min * c.s) : undefined;
  return Txt({ text, lang: c.lang, style, width: w ?? c.cw, maxLines: lines, minSize, tight });
}

const col = (extra: Record<string, unknown> = {}) => ({ display: "flex", flexDirection: "column", ...extra }) as const;
const row = (extra: Record<string, unknown> = {}) => ({ display: "flex", flexDirection: "row", ...extra }) as const;

// ── decoration ───────────────────────────────────────────────────────────
function Helix({ w, h, color, opacity, amp, wave, y }: { w: number; h: number; color: string; opacity: number; amp: number; wave: number; y: number }) {
  const a: string[] = [];
  const b: string[] = [];
  const rungs: string[] = [];
  const mid = h / 2;
  for (let x = 0; x <= w; x += 6) {
    const dy = amp * Math.sin(x / wave);
    a.push(`${x === 0 ? "M" : "L"}${x} ${(mid + dy).toFixed(1)}`);
    b.push(`${x === 0 ? "M" : "L"}${x} ${(mid - dy).toFixed(1)}`);
    if (x % Math.round(wave * 0.65) < 6) rungs.push(`M${x} ${(mid + dy).toFixed(1)}L${x} ${(mid - dy).toFixed(1)}`);
  }
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ position: "absolute", left: 0, top: y, opacity }}>
      <path d={a.join("")} stroke={color} strokeWidth={4} fill="none" />
      <path d={b.join("")} stroke={color} strokeWidth={4} fill="none" />
      <path d={rungs.join("")} stroke={color} strokeWidth={2} fill="none" />
    </svg>
  );
}

function Decor({ c }: { c: Ctx }) {
  const { fmt, th, s } = c;
  const big = Math.round(fmt.w * 0.9);
  return (
    <div style={{ display: "flex", position: "absolute", left: 0, top: 0, width: fmt.w, height: fmt.h }}>
      <div style={{ display: "flex", position: "absolute", right: -Math.round(big * 0.38), bottom: -Math.round(big * 0.34), width: big, height: big, borderRadius: big, background: th.decor, opacity: 0.07 }} />
      <div style={{ display: "flex", position: "absolute", left: -Math.round(big * 0.3), top: -Math.round(big * 0.3), width: Math.round(big * 0.7), height: Math.round(big * 0.7), borderRadius: big, background: th.decor, opacity: 0.05 }} />
      <Helix w={fmt.w} h={Math.round(130 * s)} color={th.decor} opacity={th.decorOpacity} amp={Math.round(34 * s)} wave={Math.round(58 * s)} y={Math.round(c.pad + fmt.safeTop + 84 * s)} />
    </div>
  );
}

// ── small parts ──────────────────────────────────────────────────────────
function Logo({ c, size }: { c: Ctx; size: number }) {
  const { i, th } = c;
  if (i.logoUri) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={i.logoUri} width={size} height={size} alt="" style={{ borderRadius: Math.round(size * 0.2) }} />;
  }
  const t = T(c, BRAND.mono, { kind: "display", weight: 700, size: 26, color: th.logoInk, w: size, align: "center" });
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: size, height: size, borderRadius: Math.round(size * 0.22), background: th.logoBg }}>
      {t.el}
    </div>
  );
}

function Header({ c }: { c: Ctx }) {
  const { s, th } = c;
  const name = T(c, BRAND.name, { kind: "display", weight: 600, size: 30, tight: true, w: c.cw });
  const tag = T(c, bi(UI.cities, c.lang), { weight: 600, size: 22, color: th.sub, tight: true, w: 400 });
  return (
    <div style={row({ alignItems: "center", justifyContent: "space-between", width: c.cw, height: Math.round(72 * s) })}>
      <div style={row({ alignItems: "center", gap: Math.round(16 * s) })}>
        <Logo c={c} size={Math.round(64 * s)} />
        {name.el}
      </div>
      <div style={{ display: "flex", padding: `${Math.round(8 * s)}px ${Math.round(18 * s)}px`, borderRadius: 999, border: `2px solid ${th.cardBorder}` }}>{tag.el}</div>
    </div>
  );
}

function PhoneIcon({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill={color} />
    </svg>
  );
}

function Check({ size, color, bg }: { size: number; color: string; bg: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="12" fill={bg} />
      <path d="M7 12.5l3.2 3.2L17 8.8" stroke={color} strokeWidth="2.6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Icon({ d, size, color }: { d: string; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d={d} fill={color} />
    </svg>
  );
}
const CAL = "M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z";
const PIN = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z";

function footerItem(c: Ctx, doctor?: boolean): Item {
  const { s, th, i } = c;
  const qr = i.showQr && i.qrUri;
  const qrSize = Math.round((doctor ? 210 : 150) * s);
  const leftW = c.cw - (qr ? qrSize + Math.round(60 * s) : 0);
  // Google rejects posts that show a phone number (its own Call / Learn more button does that job), so the Google-post size leaves the digits off.
  const label = bi(doctor ? UI.askWhatsApp : UI.bookWhatsApp, c.lang);
  const cta = T(c, c.fmt.id === "gbp" ? label : `${label}   ${phoneDisplay(BRAND.whatsapp)}`, {
    weight: 700,
    size: 30,
    color: th.ctaInk,
    tight: true,
    w: leftW - Math.round(110 * s),
    lines: 2,
    min: 22,
  });
  const site = T(c, `${BRAND.siteHost}  ·  ${BRAND.location}`, { size: 23, color: th.sub, w: leftW, lines: 2, min: 18 });
  const pillH = Math.max(Math.round(66 * s), cta.height + Math.round(26 * s));
  const gap = Math.round(14 * s);
  const leftH = pillH + gap + site.height;
  const qrH = qr ? qrSize + Math.round(20 * s) : 0;
  const el = (
    <div style={row({ alignItems: "center", justifyContent: "space-between", width: c.cw })}>
      <div style={col({ gap })}>
        <div style={row({ alignItems: "center", gap: Math.round(14 * s), background: th.ctaBg, borderRadius: 999, height: pillH, padding: `0 ${Math.round(26 * s)}px`, alignSelf: "flex-start" })}>
          <PhoneIcon size={Math.round(32 * s)} color={th.ctaInk} />
          {cta.el}
        </div>
        {site.el}
      </div>
      {qr ? (
        <div style={{ display: "flex", padding: Math.round(10 * s), background: "#ffffff", borderRadius: Math.round(16 * s) }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={i.qrUri!} width={qrSize} height={qrSize} alt="" />
        </div>
      ) : null}
    </div>
  );
  return { el, h: Math.max(leftH, qrH) };
}

function eyebrowItem(c: Ctx, text: string): Item {
  const { th, s, lang } = c;
  const t = T(c, text, { weight: 700, size: 24, color: th.accent, tracking: lang === "en" ? 3 : 0, upper: lang === "en", tight: true, w: c.cw - 60, lines: 2, min: 18 });
  return {
    el: <div style={{ display: "flex", alignSelf: "flex-start", background: th.accentSoft, borderRadius: 999, padding: `${Math.round(10 * s)}px ${Math.round(24 * s)}px` }}>{t.el}</div>,
    h: t.height + Math.round(20 * s),
  };
}

function chipRowItem(c: Ctx, texts: string[]): Item {
  const { th, s } = c;
  const gap = Math.round(14 * s);
  const chips = texts.map((txt) => {
    const t = T(c, txt, { weight: 600, size: 26, tight: true, w: c.cw - 70, lines: 1, min: 18 });
    return {
      w: t.width + Math.round(48 * s) + 4,
      h: t.height + Math.round(22 * s) + 4,
      el: <div style={{ display: "flex", padding: `${Math.round(11 * s)}px ${Math.round(24 * s)}px`, borderRadius: 999, border: `2px solid ${th.cardBorder}`, background: th.card }}>{t.el}</div>,
    };
  });
  let rows = 1;
  let used = 0;
  for (const ch of chips) {
    if (used && used + gap + ch.w > c.cw) {
      rows++;
      used = 0;
    }
    used += (used ? gap : 0) + ch.w;
  }
  const chipH = Math.max(...chips.map((x) => x.h));
  return {
    el: (
      <div style={row({ flexWrap: "wrap", gap })}>
        {chips.map((x, k) => (
          <div key={k} style={{ display: "flex" }}>
            {x.el}
          </div>
        ))}
      </div>
    ),
    h: rows * chipH + (rows - 1) * gap,
  };
}

function disclaimerItem(c: Ctx): Item {
  const t = T(c, bi(UI.disclaimer, c.lang), { size: 22, color: c.th.sub, opacity: 0.9, lines: 2, min: 16 });
  return { el: t.el, h: t.height };
}

function tItem(c: Ctx, text: string, o: TOpts & { size: number }): Item {
  const t = T(c, text, o);
  return { el: t.el, h: t.height };
}

function stack(items: Item[], gap: number): Item {
  return {
    el: (
      <div style={col({ gap })}>
        {items.map((x, k) => (
          <div key={k} style={{ display: "flex", flexDirection: "column" }}>
            {x.el}
          </div>
        ))}
      </div>
    ),
    h: items.reduce((a, b) => a + b.h, 0) + gap * Math.max(0, items.length - 1),
  };
}

const KS = [1.7, 1.6, 1.5, 1.4, 1.3, 1.2, 1.1, 1.0, 0.92, 0.85, 0.78, 0.7, 0.62];

/** Largest text scale k (from the list) at which the content still fits the space. */
function fit(maxH: number, build: (k: number) => Item, ks = KS): ReactElement {
  let last: Item | null = null;
  for (const k of ks) {
    last = build(k);
    if (last.h <= maxH) return last.el;
  }
  return last!.el;
}

function checkRow(c: Ctx, items: Item[], mark: number, gap: number, doc?: boolean): Item {
  return {
    el: (
      <div style={col({ gap })}>
        {items.map((b, k) => (
          <div key={k} style={row({ alignItems: "flex-start", gap: Math.round(24 * c.s) })}>
            <Check size={mark} color={doc ? c.th.ctaInk : c.th.ink} bg={c.th.accent} />
            {b.el}
          </div>
        ))}
      </div>
    ),
    h: items.reduce((a, b) => a + Math.max(b.h, mark), 0) + gap * Math.max(0, items.length - 1),
  };
}

function Frame({ c, body, footer }: { c: Ctx; body: ReactElement; footer: Item }) {
  const { fmt, th } = c;
  return (
    <div style={{ display: "flex", position: "relative", width: fmt.w, height: fmt.h, background: th.bg, overflow: "hidden" }}>
      <Decor c={c} />
      <div
        style={col({
          width: fmt.w,
          height: fmt.h,
          padding: `${c.pad + fmt.safeTop}px ${c.pad}px ${c.pad + fmt.safeBottom}px ${c.pad}px`,
          justifyContent: "space-between",
        })}
      >
        <Header c={c} />
        <div style={col({ flexGrow: 1, justifyContent: "center", paddingTop: Math.round(18 * c.s), paddingBottom: Math.round(18 * c.s) })}>{body}</div>
        {footer.el}
      </div>
    </div>
  );
}

/** The footer, plus the vertical space left for the body (with a margin so text never touches the chrome). */
function chrome(c: Ctx, doctor = false) {
  const footer = footerItem(c, doctor);
  const header = Math.round(72 * c.s);
  const maxH = c.fmt.h - 2 * c.pad - c.fmt.safeTop - c.fmt.safeBottom - header - footer.h - Math.round(36 * c.s) - Math.round(44 * c.s);
  return { footer, maxH };
}

// ── templates ────────────────────────────────────────────────────────────
function Spotlight({ c }: { c: Ctx }) {
  const p = c.i.product!;
  const { s, th, lang, i } = c;
  const ch = chrome(c);
  const compact = c.fmt.id === "square" || c.fmt.id === "gbp";
  const homeTxt = p.homeCollection ? bi(UI.homeCollection, lang) : bi(UI.arranged, lang);
  const body = fit(
    ch.maxH,
    (k) => {
      const items: Item[] = [
        eyebrowItem(c, p.group),
        tItem(c, p.displayName, { kind: "display", weight: 700, size: 96 * k, lines: 3, min: 40, lineHeight: 1.1 }),
        tItem(c, p.tagline, { size: 36 * Math.min(k, 1.25), color: th.sub, lines: compact ? 3 : 5, min: 24, lineHeight: 1.42 }),
        chipRowItem(c, [`${bi(UI.sample, lang)}: ${p.sample}`, `${bi(UI.report, lang)}: ${p.report}`, homeTxt]),
      ];
      if (i.showPrice && p.lowestPrice > 0) {
        const label = T(c, bi(UI.startingPrice, lang), { weight: 600, size: 28, color: th.accent, tight: true, w: c.cw });
        const num = T(c, inr(p.lowestPrice), { kind: "display", weight: 700, size: (compact ? 120 : 150) * Math.min(k, 1.3), tight: true, w: c.cw, lineHeight: 1.05 });
        items.push({
          el: (
            <div style={col({ gap: Math.round(4 * s) })}>
              {label.el}
              {num.el}
            </div>
          ),
          h: label.height + num.height + Math.round(4 * s),
        });
      }
      return stack(items, Math.round(26 * s * Math.min(k, 1.2)));
    },
    [1.3, 1.2, 1.1, 1.0, 0.92, 0.85, 0.78, 0.7, 0.62]
  );
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function ListPoster({ c, kind }: { c: Ctx; kind: "who" | "why" }) {
  const p = c.i.product!;
  const { s, lang } = c;
  const ch = chrome(c);
  const items = (kind === "who" ? p.who : p.why).slice(0, 4);
  const label = bi(kind === "who" ? UI.whoFor : UI.why, lang);
  const body = fit(ch.maxH, (k) => {
    const mark = Math.round(40 * s * Math.min(k, 1.3));
    const tw = c.cw - mark - Math.round(24 * s);
    const list: Item = items.length
      ? checkRow(c, items.map((txt) => tItem(c, txt, { size: 38 * k, w: tw, lines: 6, min: 22, lineHeight: 1.32 })), mark, Math.round(24 * s * Math.min(k, 1.3)))
      : tItem(c, p.tagline, { size: 38 * k, color: c.th.sub, lines: 8, min: 22 });
    return stack(
      [eyebrowItem(c, label), tItem(c, p.displayName, { kind: "display", weight: 700, size: 78 * Math.min(k, 1.3), lines: 2, min: 40, lineHeight: 1.12 }), list, disclaimerItem(c)],
      Math.round(26 * s * Math.min(k, 1.2))
    );
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function Faq({ c }: { c: Ctx }) {
  const p = c.i.product!;
  const { s, th, lang } = c;
  const ch = chrome(c);
  const gap = Math.round(22 * s);
  const cardW = Math.floor((c.cw - gap) / 2);
  const cards: { q: string; a: string }[] = [
    { q: bi(UI.qCost, lang), a: p.lowestPrice > 0 ? (lang === "hi" ? `${inr(p.lowestPrice)} ${UI.from.hi}` : `${inr(p.lowestPrice)} onwards`) : "—" },
    { q: bi(UI.qReport, lang), a: p.report },
    { q: bi(UI.qSample, lang), a: p.sample },
    { q: bi(UI.qFast, lang), a: bi(p.fastingLabel === "yes" ? UI.fastYes : UI.fastNo, lang) },
  ];
  const body = fit(ch.maxH, (k) => {
    const kk = Math.min(k, 1.35);
    const cardH = Math.round((c.fmt.id === "square" || c.fmt.id === "gbp" ? 190 : 250) * s * kk);
    const grid: Item = {
      el: (
        <div style={col({ gap })}>
          {[0, 2].map((start) => (
            <div key={start} style={row({ gap })}>
              {cards.slice(start, start + 2).map((card, n) => {
                const q = T(c, card.q, { weight: 600, size: 24 * kk, color: th.accent, w: cardW - Math.round(56 * s), lines: 1, min: 16 });
                const a = T(c, card.a, { kind: "display", weight: 700, size: 46 * kk, w: cardW - Math.round(56 * s), lines: 3, min: 24, lineHeight: 1.15 });
                return (
                  <div key={n} style={col({ width: cardW, height: cardH, padding: Math.round(28 * s), gap: Math.round(10 * s), justifyContent: "center", background: th.card, border: `2px solid ${th.cardBorder}`, borderRadius: Math.round(26 * s) })}>
                    {q.el}
                    {a.el}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ),
      h: cardH * 2 + gap,
    };
    return stack(
      [eyebrowItem(c, bi(UI.faq, lang)), tItem(c, p.displayName, { kind: "display", weight: 700, size: 70 * kk, lines: 2, min: 40, lineHeight: 1.12 }), grid, disclaimerItem(c)],
      Math.round(24 * s)
    );
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function Price({ c }: { c: Ctx }) {
  const p = c.i.product!;
  const { s, th, lang, i } = c;
  const ch = chrome(c);
  const perks = [
    p.homeCollection ? bi(UI.homeCollection, lang) : bi(UI.arranged, lang),
    lang === "hi" ? "रिपोर्ट ऑनलाइन" : "Reports delivered online",
    lang === "hi" ? `${GENETICIST_CREDENTIAL_HI} से मार्गदर्शन` : `Guidance from ${GENETICIST_CREDENTIAL}`,
  ];
  const showPrice = i.showPrice && p.lowestPrice > 0;
  const coupon = i.coupon;
  const cpTxt = coupon ? `${bi(UI.newCustomer, lang)}: ${coupon.text} · ${bi(UI.couponCode, lang)} ${coupon.code}` : null;
  const body = fit(ch.maxH, (k) => {
    const kk = Math.min(k, 1.35);
    const items: Item[] = [tItem(c, p.displayName, { kind: "display", weight: 700, size: 68 * kk, lines: 2, min: 38, lineHeight: 1.12, align: "center" })];
    if (showPrice) {
      const lab = T(c, bi(UI.startingPrice, lang), { weight: 600, size: 30, color: th.sub, align: "center", tracking: lang === "en" ? 2 : 0, upper: lang === "en" });
      const num = T(c, inr(p.lowestPrice), { kind: "display", weight: 700, size: (c.fmt.id === "square" || c.fmt.id === "gbp" ? 170 : 210) * kk, color: th.accent, align: "center", lineHeight: 1.05 });
      items.push({
        el: (
          <div style={col({ alignItems: "center", gap: Math.round(2 * s) })}>
            {lab.el}
            {num.el}
          </div>
        ),
        h: lab.height + num.height + Math.round(2 * s),
      });
    }
    const pk = perks.map((txt) => tItem(c, txt, { weight: 500, size: 32 * kk, w: c.cw - Math.round(64 * s), lines: 2, min: 20 }));
    const mark = Math.round(36 * s * Math.min(kk, 1.2));
    items.push({
      el: (
        <div style={col({ gap: Math.round(14 * s), width: c.cw })}>
          {pk.map((b, n) => (
            <div key={n} style={row({ alignItems: "center", gap: Math.round(18 * s) })}>
              <Check size={mark} color={th.ink} bg={th.accent} />
              {b.el}
            </div>
          ))}
        </div>
      ),
      h: pk.reduce((a, b) => a + Math.max(b.h, mark), 0) + Math.round(14 * s) * (pk.length - 1),
    });
    if (cpTxt) {
      const cp = T(c, cpTxt, { weight: 700, size: 27, color: th.ctaInk, tight: true, w: c.cw - Math.round(90 * s), lines: 2, min: 18, align: "center" });
      items.push({
        el: <div style={{ display: "flex", alignSelf: "center", background: th.accent, borderRadius: Math.round(20 * s), padding: `${Math.round(16 * s)}px ${Math.round(28 * s)}px` }}>{cp.el}</div>,
        h: cp.height + Math.round(32 * s),
      });
    }
    const st = stack(items, Math.round(22 * s));
    return { el: <div style={col({ alignItems: "center", width: c.cw })}>{st.el}</div>, h: st.h };
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function MythPoster({ c }: { c: Ctx }) {
  const { s, th, lang, i } = c;
  const ch = chrome(c);
  const m = MYTHS.find((x) => x.id === i.mythId) ?? MYTHS[0];
  const dark = th.id === "light";
  const inner = c.cw - Math.round(64 * s);
  const tag = (txt: string, color: string, ink: string): Item => {
    const t = T(c, txt, { weight: 700, size: 24, color: ink, tight: true, tracking: lang === "en" ? 3 : 0, w: 300 });
    return { el: <div style={{ display: "flex", alignSelf: "flex-start", background: color, borderRadius: 999, padding: `${Math.round(8 * s)}px ${Math.round(22 * s)}px` }}>{t.el}</div>, h: t.height + Math.round(16 * s) };
  };
  const card = (tg: Item, tx: Item, border: string): Item => {
    const pad = Math.round(32 * s);
    return {
      el: (
        <div style={col({ gap: Math.round(14 * s), padding: pad, background: th.card, border: `2px solid ${border}`, borderRadius: Math.round(28 * s) })}>
          {tg.el}
          {tx.el}
        </div>
      ),
      h: tg.h + tx.h + Math.round(14 * s) + pad * 2 + 4,
    };
  };
  const body = fit(ch.maxH, (k) => {
    const kk = Math.min(k, 1.4);
    const a = card(tag(bi(UI.myth, lang), th.bad, dark ? "#ffffff" : "#5a1d0a"), tItem(c, bi(m.myth, lang), { weight: 600, size: 40 * kk, w: inner, lines: 6, min: 22, lineHeight: 1.3 }), th.cardBorder);
    const b = card(tag(bi(UI.fact, lang), th.good, dark ? "#ffffff" : "#063f34"), tItem(c, bi(m.fact, lang), { size: 36 * kk, w: inner, lines: 9, min: 22, lineHeight: 1.38 }), th.good);
    return stack(
      [eyebrowItem(c, bi(m.topic, lang)), tItem(c, bi(UI.mythVsFact, lang), { kind: "display", weight: 700, size: 76 * Math.min(kk, 1.2), lines: 2, min: 40, lineHeight: 1.1 }), a, b, disclaimerItem(c)],
      Math.round(22 * s)
    );
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function FactPoster({ c }: { c: Ctx }) {
  const { s, th, lang, i } = c;
  const ch = chrome(c);
  const f = FACTS.find((x) => x.id === i.factId) ?? FACTS[0];
  const body = fit(ch.maxH, (k) => {
    const q = T(c, "“", { kind: "display", weight: 700, size: 200 * Math.min(k, 1.2), color: th.accent, opacity: 0.45, tight: true, lineHeight: 0.8, w: 300 });
    const qh = Math.round(110 * s * Math.min(k, 1.2));
    return stack(
      [
        tItem(c, bi(UI.didYouKnow, lang), { kind: "display", weight: 700, size: 60 * Math.min(k, 1.3), color: th.accent, lines: 1, min: 36 }),
        { el: <div style={{ display: "flex", height: qh, overflow: "hidden" }}>{q.el}</div>, h: qh },
        tItem(c, bi(f.text, lang), { kind: "display", weight: 700, size: 66 * k, lines: 14, min: 30, lineHeight: 1.22 }),
        disclaimerItem(c),
      ],
      Math.round(22 * s)
    );
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function TimelinePoster({ c }: { c: Ctx }) {
  const { s, th, lang } = c;
  const ch = chrome(c);
  const body = fit(ch.maxH, (k) => {
    const kk = Math.min(k, 1.5);
    const node = Math.round(34 * s * Math.min(kk, 1.3));
    const tw = c.cw - node - Math.round(26 * s);
    const rows = TIMELINE.map((step, n) => {
      const when = T(c, bi(step.when, lang), { weight: 700, size: 30 * kk, color: th.accent, w: tw, lines: 2, min: 18 });
      const what = T(c, bi(step.what, lang), { weight: 500, size: 36 * kk, w: tw, lines: 4, min: 20, lineHeight: 1.3 });
      const last = n === TIMELINE.length - 1;
      const padB = last ? 0 : Math.round(34 * s * kk);
      return {
        h: when.height + what.height + Math.round(6 * s) + padB,
        el: (
          <div key={n} style={row({ gap: Math.round(26 * s) })}>
            <div style={col({ alignItems: "center", width: node })}>
              <div style={{ display: "flex", width: node, height: node, borderRadius: node, background: th.accent, border: `${Math.round(6 * s)}px solid ${th.accentSoft}` }} />
              {!last ? <div style={{ display: "flex", flexGrow: 1, width: Math.round(4 * s), background: th.cardBorder, marginTop: Math.round(6 * s), marginBottom: Math.round(6 * s) }} /> : null}
            </div>
            <div style={col({ gap: Math.round(6 * s), paddingBottom: padB })}>
              {when.el}
              {what.el}
            </div>
          </div>
        ),
      };
    });
    const list: Item = { el: <div style={col({})}>{rows.map((r) => r.el)}</div>, h: rows.reduce((a, b) => a + b.h, 0) };
    return stack(
      [
        tItem(c, bi(UI.timelineTitle, lang), { kind: "display", weight: 700, size: 70 * Math.min(kk, 1.3), lines: 3, min: 38, lineHeight: 1.12 }),
        list,
        tItem(c, bi(UI.timelineNote, lang), { size: 28 * Math.min(kk, 1.3), color: th.sub, weight: 500, lines: 3, min: 18 }),
      ],
      Math.round(30 * s)
    );
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function HomePoster({ c }: { c: Ctx }) {
  const { s, th, lang } = c;
  const ch = chrome(c);
  const steps = [UI.step1, UI.step2, UI.step3].map((x) => bi(x, lang));
  const body = fit(ch.maxH, (k) => {
    const kk = Math.min(k, 1.4);
    const num = Math.round(56 * s * Math.min(kk, 1.25));
    const rows = steps.map((st, n) => {
      const nT = T(c, String(n + 1), { kind: "display", weight: 700, size: 30 * Math.min(kk, 1.25), color: th.ctaInk, w: num, align: "center" });
      const t = T(c, st, { weight: 500, size: 34 * kk, w: c.cw - num - Math.round(30 * s), lines: 3, min: 22 });
      return {
        h: Math.max(num, t.height),
        el: (
          <div key={n} style={row({ alignItems: "center", gap: Math.round(26 * s) })}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", width: num, height: num, borderRadius: num, background: th.accent }}>{nT.el}</div>
            {t.el}
          </div>
        ),
      };
    });
    const gap = Math.round(20 * s * Math.min(kk, 1.3));
    const list: Item = { el: <div style={col({ gap })}>{rows.map((r) => r.el)}</div>, h: rows.reduce((a, b) => a + b.h, 0) + gap * (rows.length - 1) };
    return stack(
      [
        tItem(c, bi(UI.homeTitle, lang), { kind: "display", weight: 700, size: 88 * Math.min(kk, 1.25), lines: 3, min: 44, lineHeight: 1.1 }),
        tItem(c, bi(UI.homeSub, lang), { size: 36 * Math.min(kk, 1.2), color: th.sub, lines: 3, min: 22, lineHeight: 1.4 }),
        list,
        chipRowItem(c, [bi(UI.cities, lang), lang === "hi" ? `₹${DIAGNOSTIC_FEE} प्रति विज़िट` : `₹${DIAGNOSTIC_FEE} per visit`]),
      ],
      Math.round(28 * s)
    );
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function CustomPoster({ c, announce }: { c: Ctx; announce: boolean }) {
  const { s, th, lang, i } = c;
  const ch = chrome(c);
  const eyebrow = i.eyebrow?.trim() || (announce ? (lang === "hi" ? "सूचना" : "Announcement") : "");
  const headline = i.headline?.trim() || (lang === "hi" ? "यहाँ शीर्षक लिखें" : "Your headline here");
  const bodyText = i.body?.trim();
  const meta = (icon: string, txt: string): Item => {
    const t = T(c, txt, { weight: 600, size: 30, tight: true, w: c.cw - Math.round(80 * s), lines: 2, min: 20 });
    return {
      el: (
        <div style={row({ alignItems: "center", gap: Math.round(14 * s), padding: `${Math.round(12 * s)}px ${Math.round(24 * s)}px`, borderRadius: 999, border: `2px solid ${th.cardBorder}`, background: th.card })}>
          <Icon d={icon} size={Math.round(32 * s)} color={th.accent} />
          {t.el}
        </div>
      ),
      h: Math.max(t.height, Math.round(32 * s)) + Math.round(24 * s) + 4,
    };
  };
  const body = fit(ch.maxH, (k) => {
    const items: Item[] = [];
    if (eyebrow) items.push(eyebrowItem(c, eyebrow));
    items.push(tItem(c, headline, { kind: "display", weight: 700, size: 92 * k, lines: 7, min: 38, lineHeight: 1.12 }));
    if (bodyText) items.push(tItem(c, bodyText, { size: 38 * Math.min(k, 1.3), color: th.sub, lines: 10, min: 22, lineHeight: 1.42 }));
    const metas: Item[] = [];
    if (i.date) metas.push(meta(CAL, i.date));
    if (i.place) metas.push(meta(PIN, i.place));
    if (metas.length) {
      items.push({
        el: (
          <div style={row({ flexWrap: "wrap", gap: Math.round(14 * s) })}>
            {metas.map((m, n) => (
              <div key={n} style={{ display: "flex" }}>
                {m.el}
              </div>
            ))}
          </div>
        ),
        h: Math.max(...metas.map((m) => m.h)) * (metas.length > 1 ? 2 : 1),
      });
    }
    return stack(items, Math.round(26 * s * Math.min(k, 1.2)));
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

function DoctorPoster({ c }: { c: Ctx }) {
  const { s, th, lang } = c;
  const ch = chrome(c, true);
  const sub =
    lang === "hi" ? "जेनेटिक व ऑन्कोलॉजी जाँच — आपके मरीज़ों के लिए काउंसलिंग सहयोग के साथ।" : "Genetic and oncology tests, with counselling support for your patients.";
  const items =
    lang === "hi"
      ? [
          "प्रीनेटल स्क्रीनिंग, नवजात स्क्रीनिंग, वंशानुगत कैंसर, एक्सोम सीक्वेंसिंग और सैकड़ों ऑन्कोलॉजी जाँच",
          "सैंपल आपके क्लिनिक या मरीज़ के घर से",
          "हर जाँच की साफ़ कीमत और रिपोर्ट का समय",
          `मरीज़ों के लिए ${GENETICIST_CREDENTIAL_HI} से काउंसलिंग सहयोग`,
          "रिपोर्ट ऑनलाइन — और आपको भी, अनुरोध पर",
        ]
      : [
          "Prenatal and newborn screening, hereditary cancer, exome sequencing and hundreds of oncology tests",
          "Sample collection from your clinic or your patient's home",
          "A clear price and turnaround time for every test",
          `Counselling support for your patients from ${GENETICIST_CREDENTIAL}`,
          "Reports online — and to you, on request",
        ];
  const body = fit(ch.maxH, (k) => {
    const mark = Math.round(40 * s * Math.min(k, 1.3));
    const tw = c.cw - mark - Math.round(24 * s);
    const list = checkRow(c, items.map((txt) => tItem(c, txt, { size: 36 * k, w: tw, lines: 5, min: 22, lineHeight: 1.32 })), mark, Math.round(24 * s * Math.min(k, 1.3)), true);
    return stack(
      [
        tItem(c, bi(UI.doctorsTitle, lang), { kind: "display", weight: 700, size: 92 * Math.min(k, 1.3), lines: 2, min: 44, lineHeight: 1.1 }),
        tItem(c, sub, { size: 38 * Math.min(k, 1.2), color: th.sub, lines: 3, min: 22, lineHeight: 1.4 }),
        list,
      ],
      Math.round(26 * s)
    );
  });
  return <Frame c={c} body={body} footer={ch.footer} />;
}

export function renderPoster(input: PosterInput): ReactElement {
  const fmt = input.fmt;
  const c: Ctx = { lang: input.lang, th: input.theme, fmt, s: fmt.scale, pad: fmt.pad, cw: fmt.w - 2 * fmt.pad, i: input };
  switch (input.template) {
    case "spotlight":
      return <Spotlight c={c} />;
    case "who":
      return <ListPoster c={c} kind="who" />;
    case "why":
      return <ListPoster c={c} kind="why" />;
    case "faq":
      return <Faq c={c} />;
    case "price":
      return <Price c={c} />;
    case "myth":
      return <MythPoster c={c} />;
    case "fact":
      return <FactPoster c={c} />;
    case "timeline":
      return <TimelinePoster c={c} />;
    case "home":
      return <HomePoster c={c} />;
    case "announce":
      return <CustomPoster c={c} announce />;
    case "custom":
      return <CustomPoster c={c} announce={false} />;
    case "doctor":
      return <DoctorPoster c={c} />;
  }
}
