// A rolling content calendar: what to post on which day, pre-linked to the
// poster maker. Rhythm (Mon–Sat; Sunday is a rest day): one educational post a
// day, rotating through myths, test spotlights, "who needs it", facts, price /
// home-collection posts and a weekly longer piece. Awareness days replace the
// regular post on their date.
//
// Awareness dates below are fixed-calendar observances (WHO / UN / India). The
// tone note on each one matters more than the date: health awareness posts
// should inform and include, never alarm.

import { MYTHS, FACTS } from "./content";
import type { TemplateId } from "./templates";

export type PlanItem = {
  date: string; // yyyy-mm-dd
  weekday: string;
  template: TemplateId;
  slug?: string;
  mythId?: string;
  factId?: string;
  format: "square" | "portrait" | "story";
  theme: "teal" | "light" | "warm";
  lang: "en" | "hi";
  channels: string;
  why: string;
  awareness?: string;
  headline?: string;
  body?: string;
};

type Observance = { m: number; d: number | "lastFeb"; name: string; template: TemplateId; slug?: string; mythId?: string; factId?: string; headline: string; body: string; tone: string };

export const OBSERVANCES: Observance[] = [
  { m: 2, d: 4, name: "World Cancer Day", template: "myth", mythId: "cancer-genes", slug: "brca1-brca2-gene-analysis", headline: "World Cancer Day", body: "", tone: "Inform, don't frighten. Mention family history and speaking to a doctor." },
  { m: 2, d: 15, name: "International Childhood Cancer Day", template: "custom", headline: "International Childhood Cancer Day", body: "Accurate diagnosis starts with the right test. We help families find and book the tests their oncologist advises.", tone: "Supportive and respectful. No statistics unless you can cite them." },
  { m: 2, d: "lastFeb", name: "Rare Disease Day", template: "fact", factId: "exome-1pct", slug: "whole-exome-sequencing", headline: "", body: "", tone: "Explain that many rare diseases are genetic and that testing can end a long search for answers." },
  { m: 3, d: 3, name: "World Birth Defects Day", template: "fact", factId: "folic", headline: "", body: "", tone: "Folic acid message — always 'ask your doctor about the right dose'." },
  { m: 3, d: 8, name: "International Women's Day", template: "custom", headline: "Happy Women's Day", body: "Wishing every woman good health — at every stage of life.", tone: "Warm greeting. No selling." },
  { m: 3, d: 21, name: "World Down Syndrome Day", template: "custom", headline: "World Down Syndrome Day", body: "Every person deserves respect and inclusion. For families who want information about prenatal screening, our counselling team is here to explain the options.", tone: "Respectful, inclusive language. Lead with inclusion, then information. Review the wording with your counsellor first." },
  { m: 4, d: 7, name: "World Health Day", template: "fact", factId: "family-matters", headline: "", body: "", tone: "General health message." },
  { m: 4, d: 17, name: "World Haemophilia Day", template: "fact", factId: "recessive", headline: "", body: "", tone: "Explain inheritance simply." },
  { m: 5, d: 8, name: "World Thalassaemia Day", template: "myth", mythId: "thal-carrier", slug: "beta-thalassemia-mutation-analysis", headline: "", body: "", tone: "Carrier screening and the 1-in-4 message; mention HPLC." },
  { m: 6, d: 19, name: "World Sickle Cell Day", template: "fact", factId: "thal-common", headline: "", body: "", tone: "Haemoglobin disorders — carrier testing." },
  { m: 7, d: 1, name: "National Doctors' Day (India)", template: "doctor", headline: "", body: "", tone: "Thank doctors. Share the doctors' one-pager with clinics you work with." },
  { m: 9, d: 1, name: "Childhood Cancer Awareness Month begins", template: "custom", headline: "Childhood Cancer Awareness Month", body: "Early, accurate diagnosis matters. Ask your child's oncologist which tests are right — we help with booking and sample logistics.", tone: "Supportive; no medical claims." },
  { m: 10, d: 1, name: "Breast Cancer Awareness Month begins", template: "who", slug: "brca1-brca2-gene-analysis", headline: "", body: "", tone: "Family-history message; mention counselling before and after testing." },
  { m: 10, d: 15, name: "Pregnancy & Infant Loss Remembrance Day", template: "custom", headline: "Remembering and supporting families", body: "Grief after pregnancy or infant loss is real. Our counselling team can talk through genetic testing options, if and when families want that information.", tone: "Very gentle. No selling, no urgency. Consider skipping the promotional footer." },
  { m: 11, d: 7, name: "National Cancer Awareness Day (India)", template: "who", slug: "hereditary-cancer-gene-panel", headline: "", body: "", tone: "Early detection and family history; encourage talking to a doctor." },
  { m: 11, d: 17, name: "World Prematurity Day", template: "myth", mythId: "newborn", slug: "newborn-screening-panel", headline: "", body: "", tone: "Newborn screening basics." },
  { m: 12, d: 3, name: "International Day of Persons with Disabilities", template: "custom", headline: "Inclusion matters", body: "Understanding genetics helps families get answers and support sooner. We're here to help you find the right test and the right guidance.", tone: "Respectful, inclusive." },
];

// The tests we feature, in rotation (all exist in the catalog).
export const SPOTLIGHT_ROTATION = [
  "double-marker-test",
  "nipt-non-invasive-prenatal-testing",
  "newborn-screening-panel",
  "carrier-screening-expanded",
  "whole-exome-sequencing",
  "brca1-brca2-gene-analysis",
  "beta-thalassemia-mutation-analysis",
  "triple-marker-test",
  "karyotyping-blood",
  "clinical-exome-sequencing",
  "hereditary-cancer-gene-panel",
  "nipt-expanded-microdeletions",
];

const WHO_ROTATION = [
  "nipt-non-invasive-prenatal-testing",
  "double-marker-test",
  "carrier-screening-expanded",
  "brca1-brca2-gene-analysis",
  "whole-exome-sequencing",
  "karyotyping-blood",
];

/** Link into the Social Studio with everything for this plan item already filled in. */
export function studioPath(i: PlanItem) {
  const p = new URLSearchParams({ tab: "posters", template: i.template, format: i.format, theme: i.theme, lang: i.lang });
  if (i.slug) p.set("slug", i.slug);
  if (i.mythId) p.set("myth", i.mythId);
  if (i.factId) p.set("fact", i.factId);
  if (i.headline) p.set("headline", i.headline);
  if (i.body) p.set("body", i.body);
  return `/admin/social?${p.toString()}`;
}

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function observanceOn(d: Date) {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const lastFeb = new Date(d.getFullYear(), 2, 0).getDate();
  return OBSERVANCES.find((o) => o.m === m && (o.d === "lastFeb" ? m === 2 && day === lastFeb : o.d === day));
}

export function buildPlan(start: Date, days = 30): PlanItem[] {
  const out: PlanItem[] = [];
  let mythI = 0;
  let factI = 0;
  let spotI = 0;
  let whoI = 0;
  for (let n = 0; n < days; n++) {
    const d = new Date(start.getFullYear(), start.getMonth(), start.getDate() + n);
    const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dow = d.getDay();
    const weekday = WEEKDAYS[dow];
    const week = Math.floor(n / 7);
    const base = { date: iso, weekday };

    const obs = observanceOn(d);
    if (obs) {
      out.push({
        ...base,
        template: obs.template,
        slug: obs.slug,
        mythId: obs.mythId,
        factId: obs.factId,
        headline: obs.headline || undefined,
        body: obs.body || undefined,
        format: obs.template === "fact" ? "story" : "portrait",
        theme: "light",
        lang: "en",
        channels: "Instagram + Facebook + WhatsApp status + Google post",
        why: `Awareness day: ${obs.name}. ${obs.tone}`,
        awareness: obs.name,
      });
      continue;
    }
    if (dow === 0) continue; // Sunday: rest

    if (dow === 1) {
      const m = MYTHS[mythI++ % MYTHS.length];
      out.push({ ...base, template: "myth", mythId: m.id, slug: m.slug, format: "portrait", theme: "light", lang: "en", channels: "Instagram + Facebook + WhatsApp status", why: "Myth vs Fact: corrects a common misunderstanding — the most shareable kind of post." });
    } else if (dow === 2) {
      out.push({ ...base, template: "spotlight", slug: SPOTLIGHT_ROTATION[spotI++ % SPOTLIGHT_ROTATION.length], format: "portrait", theme: "teal", lang: "en", channels: "Instagram + Facebook + Google post", why: "Test spotlight: puts the test, the price and your WhatsApp number in front of people searching for it." });
    } else if (dow === 3) {
      out.push({ ...base, template: "who", slug: WHO_ROTATION[whoI++ % WHO_ROTATION.length], format: "portrait", theme: "light", lang: "en", channels: "Instagram + Facebook", why: "Who may need it: a checklist people save and send to family." });
    } else if (dow === 4) {
      const f = FACTS[factI++ % FACTS.length];
      out.push({ ...base, template: "fact", factId: f.id, slug: f.slug, format: "story", theme: "teal", lang: "en", channels: "Instagram story + WhatsApp status", why: "Did you know: one simple fact for stories and status — low effort, steady reach." });
    } else if (dow === 5) {
      out.push(
        week % 2 === 0
          ? { ...base, template: "price", slug: SPOTLIGHT_ROTATION[(spotI + 3) % SPOTLIGHT_ROTATION.length], format: "square", theme: "teal", lang: "en", channels: "Instagram + Facebook + WhatsApp status + Google post", why: "Price card: clear starting price (and the new-customer offer when one is live)." }
          : { ...base, template: "home", format: "portrait", theme: "warm", lang: "en", channels: "Instagram + Facebook + Google post", why: "Home collection: removes the biggest hurdle (travel and waiting) in three steps." }
      );
    } else {
      const pick = week % 4;
      out.push(
        pick === 0
          ? { ...base, template: "timeline", format: "story", theme: "light", lang: "en", channels: "Instagram story + WhatsApp status + Facebook", why: "Pregnancy screening timeline: save-worthy for expecting parents." }
          : pick === 1
            ? { ...base, template: "faq", slug: "double-marker-test", format: "square", theme: "warm", lang: "en", channels: "Instagram + Facebook", why: "Quick answers: price, report time, sample and fasting at a glance." }
            : pick === 2
              ? { ...base, template: "why", slug: "newborn-screening-panel", format: "portrait", theme: "teal", lang: "en", channels: "Instagram + Facebook", why: "Why it is done: explains a test's purpose in three clear points." }
              : { ...base, template: "announce", headline: "Ask our genetic counselling team", body: "Send us your questions on WhatsApp — we'll answer the common ones next week.", format: "portrait", theme: "teal", lang: "en", channels: "Instagram + Facebook + WhatsApp channel", why: "Invite questions: tells you what people really want to know, and gives you next week's content." }
      );
    }
  }
  return out;
}
