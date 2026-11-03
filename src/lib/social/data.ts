import { prisma } from "@/lib/prisma";
import { getProductBySlug } from "@/lib/catalog";
import { contentForProduct } from "@/lib/genetics-content";
import { formatTat } from "@/lib/format";
import { DIAGNOSTIC_FEE } from "@/lib/collection-slots";
import { HI_TESTS, GROUP_HI, hiSample, hiTat, type HiTest } from "./content";
import type { Lang } from "./text";

export type PosterProduct = {
  slug: string;
  name: string; // English name
  displayName: string; // name in the poster language
  group: string; // English group label
  hub: "genetic" | "oncology" | "routine";
  tagline: string;
  who: string[];
  why: string[];
  lowestPrice: number;
  sample: string;
  report: string;
  fastingLabel: "yes" | "no";
  homeCollection: boolean;
  hi: HiTest | null;
  hiWho: boolean;
  hiWhy: boolean;
};

const MAX_TAGLINE = 190;

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "") + "…";
}

export async function loadProduct(slug: string, lang: Lang): Promise<PosterProduct | null> {
  const p = await getProductBySlug(slug);
  if (!p) return null;
  const content = contentForProduct(p);
  const priced = p.prices.map((x) => x.price).filter((x) => x > 0);
  const lowest = priced.length ? Math.min(...priced) : 0;
  const hi = HI_TESTS[p.slug] ?? null;
  const useHi = lang === "hi";

  const group = content?.group ?? p.category.name;
  const hub = content ? content.hub : "routine";

  const en = {
    tagline: clip(p.description || p.about || "", MAX_TAGLINE),
    who: (content?.whoFor ?? []).map((x) => clip(x, 150)),
    why: (content?.whyDone ?? []).map((x) => clip(x, 150)),
  };

  return {
    slug: p.slug,
    name: p.name,
    displayName: useHi && hi ? hi.name : p.name,
    group: useHi ? (GROUP_HI[group] ?? group) : group,
    hub,
    tagline: useHi && hi ? hi.tagline : en.tagline,
    who: useHi && hi?.who ? hi.who : en.who,
    why: useHi && hi?.why ? hi.why : en.why,
    lowestPrice: lowest,
    sample: useHi ? hiSample(p.sampleType) : p.sampleType,
    report: useHi ? hiTat(p.reportHours) : formatTat(p.reportHours),
    fastingLabel: p.fasting ? "yes" : "no",
    homeCollection: !content || content.collection === "home",
    hi,
    hiWho: Boolean(hi?.who),
    hiWhy: Boolean(hi?.why),
  };
}

export type PosterCoupon = { code: string; text: string };

/** The current new-customer coupon, if one is live. Posters never invent an offer. */
export async function activeNewCustomerCoupon(): Promise<PosterCoupon | null> {
  const c = await prisma.coupon.findFirst({
    where: {
      active: true,
      audience: { in: ["NEW_USER", "ALL"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ audience: "desc" }, { createdAt: "desc" }],
  });
  if (!c) return null;
  const off = c.type === "PERCENT" ? `${c.value}% off` : `₹${c.value} off`;
  const cap = c.type === "PERCENT" && c.maxDiscount ? ` (up to ₹${c.maxDiscount})` : "";
  const first = c.audience === "NEW_USER" ? " your first booking" : "";
  return { code: c.code, text: `${off}${first}${cap}` };
}

export const HOME_FEE = DIAGNOSTIC_FEE;
