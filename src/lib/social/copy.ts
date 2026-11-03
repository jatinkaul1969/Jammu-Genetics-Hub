// Captions, hashtags and tracked links for the posters.
//
// Wording rules baked in (so a caption can be posted as-is):
//   • educational, third-person phrasing — never "Are you pregnant?" style hooks
//     (Meta's ad rules forbid implying a reader's health condition, and it keeps
//     organic posts safe to boost later);
//   • no guarantees or superlatives ("100% accurate", "best", "cheapest");
//   • one short disclaimer, and the phone/WhatsApp/site details every time.

import { SITE_URL } from "@/lib/site-url";
import { GENETICIST_CREDENTIAL, GENETICIST_CREDENTIAL_HI } from "@/lib/genetics-content";
import { DIAGNOSTIC_FEE } from "@/lib/collection-slots";
import { BRAND, phoneDisplay } from "./brand";
import { FACTS, MYTHS, TIMELINE, UI } from "./content";
import type { PosterCoupon, PosterProduct } from "./data";
import type { Lang } from "./text";
import type { TemplateId } from "./templates";

export type SourceId = "instagram" | "facebook" | "whatsapp_status" | "whatsapp_channel" | "gbp" | "print" | "doctor_card" | "youtube";

export const SOURCES: { id: SourceId; label: string; medium: string }[] = [
  { id: "instagram", label: "Instagram", medium: "social" },
  { id: "facebook", label: "Facebook", medium: "social" },
  { id: "whatsapp_status", label: "WhatsApp status / groups", medium: "social" },
  { id: "whatsapp_channel", label: "WhatsApp channel", medium: "social" },
  { id: "gbp", label: "Google Business post", medium: "organic" },
  { id: "youtube", label: "YouTube", medium: "social" },
  { id: "print", label: "Printed poster / QR", medium: "print" },
  { id: "doctor_card", label: "Doctor's clinic", medium: "referral" },
];

export function buildLink(o: { template: TemplateId; slug?: string | null; source: SourceId }) {
  const path =
    o.template === "doctor"
      ? "/for-doctors"
      : o.template === "home"
        ? "/jammu"
        : o.slug && ["spotlight", "who", "why", "faq", "price"].includes(o.template)
          ? `/jammu/tests/${o.slug}`
          : o.template === "timeline" || o.template === "myth" || o.template === "fact"
            ? "/jammu/genetic-counselling"
            : "/jammu/genetic-tests";
  const src = SOURCES.find((s) => s.id === o.source) ?? SOURCES[0];
  const month = new Date().toISOString().slice(0, 7).replace("-", "");
  const campaign = `${month}-${o.template}${o.slug ? "-" + o.slug : ""}`.slice(0, 60);
  const qs = new URLSearchParams({ utm_source: src.id, utm_medium: src.medium, utm_campaign: campaign });
  return `${SITE_URL}${path}?${qs.toString()}`;
}

const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;

export function hashtagsFor(p: PosterProduct | null, template: TemplateId, lang: Lang): string[] {
  const tags = ["#JammuGeneticsHub", "#Jammu"];
  const slug = p?.slug ?? "";
  if (/nipt|insight/.test(slug)) tags.push("#NIPT", "#PrenatalScreening", "#PregnancyCare");
  else if (/double|triple|quadruple|evico/.test(slug)) tags.push("#DoubleMarkerTest", "#PrenatalScreening", "#PregnancyCare");
  else if (/newborn|g6pd|cariem/.test(slug)) tags.push("#NewbornScreening", "#NewbornCare", "#ChildHealth");
  else if (/thal/.test(slug)) tags.push("#Thalassemia", "#ThalassemiaAwareness", "#CarrierScreening");
  else if (/carrier/.test(slug)) tags.push("#CarrierScreening", "#PreconceptionCare", "#GeneticTesting");
  else if (/brca|hereditary/.test(slug)) tags.push("#BRCA", "#HereditaryCancer", "#CancerAwareness");
  else if (/exome|genome/.test(slug)) tags.push("#ExomeSequencing", "#GeneticTesting", "#RareDisease");
  else if (p?.hub === "oncology") tags.push("#CancerCare", "#OncologyTests", "#CancerDiagnosis");
  else if (p?.hub === "genetic") tags.push("#GeneticTesting", "#GeneticCounselling");
  else if (template === "myth" || template === "fact" || template === "timeline") tags.push("#GeneticTesting", "#HealthEducation", "#PregnancyCare");
  else tags.push("#GeneticTesting", "#HealthEducation");
  tags.push("#GeneticCounselling", "#JammuHealth");
  if (lang === "hi") tags.push("#जम्मू", "#जेनेटिकटेस्ट");
  return Array.from(new Set(tags)).slice(0, 10);
}

type CopyIn = {
  template: TemplateId;
  source: SourceId;
  lang: Lang;
  product: PosterProduct | null;
  coupon: PosterCoupon | null;
  link: string;
  headline?: string;
  body?: string;
  date?: string;
  place?: string;
  mythId?: string;
  factId?: string;
  showPrice: boolean;
};

export type CopyOut = { caption: string; hashtags: string[]; whatsapp: string; alt: string };

export function buildCopy(i: CopyIn): CopyOut {
  const hi = i.lang === "hi";
  const p = i.product;
  const L = (b: { en: string; hi: string }) => b[i.lang];
  const price = p && i.showPrice && p.lowestPrice > 0 ? inr(p.lowestPrice) : null;
  const cred = hi ? GENETICIST_CREDENTIAL_HI : GENETICIST_CREDENTIAL;
  // Google rejects post text that contains a phone number, and its Call / Learn more
  // button carries the link, so a Google post gets the address line only.
  const contact =
    i.source === "gbp"
      ? `📍 ${BRAND.name}, ${BRAND.location}`
      : [
          `📍 ${BRAND.name}, ${BRAND.location}`,
          `📲 WhatsApp: ${phoneDisplay(BRAND.whatsapp)}`,
          // Instagram captions can't hold a clickable link, so point to the bio instead
          // (the tracked link goes in a Story link sticker or the bio).
          i.source === "instagram" ? (hi ? "🔗 लिंक बायो में" : "🔗 Link in bio") : `🔗 ${i.link}`,
        ].join("\n");
  const disclaimer = L(UI.disclaimer);
  const bullets = (items: string[]) => items.map((x) => `• ${x}`).join("\n");

  let head = "";
  let main = "";
  let alt = "";

  switch (i.template) {
    case "spotlight": {
      head = hi ? `${p!.displayName} — जम्मू में` : `${p!.displayName} in Jammu — what it is, and what it costs`;
      main = [p!.tagline, "", price ? (hi ? `💰 ${price} से शुरू` : `💰 Starting at ${price}`) : "", p!.homeCollection ? (hi ? `🏠 घर बैठे सैंपल कलेक्शन (₹${DIAGNOSTIC_FEE} प्रति विज़िट)` : `🏠 Home sample collection available (₹${DIAGNOSTIC_FEE} per visit)`) : (hi ? "🏠 सैंपल की व्यवस्था हमारी टीम करेगी" : "🏠 Sample collection arranged by our team")]
        .filter((x, k, a) => !(x === "" && (k === 0 || a[k - 1] === "")))
        .join("\n");
      alt = `${p!.displayName} — ${p!.tagline}`;
      break;
    }
    case "who":
    case "why": {
      const items = i.template === "who" ? p!.who : p!.why;
      const q = i.template === "who" ? L(UI.whoFor) : L(UI.why);
      head = `${p!.displayName}: ${q}`;
      main = items.length ? bullets(items) : p!.tagline;
      alt = `${p!.displayName}: ${q}`;
      break;
    }
    case "faq": {
      head = hi ? `${p!.displayName}: ज़रूरी बातें` : `${p!.displayName}: quick answers`;
      main = [
        `${L(UI.qCost)} ${price ?? "—"}${price ? (hi ? " से शुरू" : " onwards") : ""}`,
        `${L(UI.qReport)} ${p!.report}`,
        `${L(UI.qSample)}: ${p!.sample}`,
        `${L(UI.qFast)} ${L(p!.fastingLabel === "yes" ? UI.fastYes : UI.fastNo)}`,
      ].join("\n");
      alt = `${p!.displayName}: quick answers on price, report time, sample and fasting`;
      break;
    }
    case "price": {
      head = hi ? `${p!.displayName} — ${price ?? ""} से शुरू` : `${p!.displayName}${price ? ` from ${price}` : ""}`;
      main = [
        hi ? "✔ रिपोर्ट ऑनलाइन" : "✔ Reports delivered online",
        p!.homeCollection ? (hi ? "✔ घर बैठे सैंपल कलेक्शन" : "✔ Home sample collection") : "",
        hi ? `✔ ${cred} से मार्गदर्शन` : `✔ Guidance from ${cred}`,
        i.coupon ? `\n🎁 ${L(UI.newCustomer)}: ${i.coupon.text} — ${L(UI.couponCode)} ${i.coupon.code}` : "",
      ]
        .filter(Boolean)
        .join("\n");
      alt = `${p!.displayName}${price ? ` starting at ${price}` : ""}`;
      break;
    }
    case "myth": {
      const m = MYTHS.find((x) => x.id === i.mythId) ?? MYTHS[0];
      head = `${L(UI.mythVsFact)}: ${L(m.topic)}`;
      main = `❌ ${L(UI.myth)}: ${L(m.myth)}\n\n✅ ${L(UI.fact)}: ${L(m.fact)}`;
      alt = `${L(UI.mythVsFact)} — ${L(m.myth)}`;
      break;
    }
    case "fact": {
      const f = FACTS.find((x) => x.id === i.factId) ?? FACTS[0];
      head = L(UI.didYouKnow);
      main = L(f.text);
      alt = L(f.text);
      break;
    }
    case "timeline": {
      head = L(UI.timelineTitle);
      main = TIMELINE.map((s) => `📅 ${L(s.when)} — ${L(s.what)}`).join("\n") + `\n\n${L(UI.timelineNote)}`;
      alt = L(UI.timelineTitle);
      break;
    }
    case "home": {
      head = L(UI.homeTitle);
      main = [L(UI.homeSub), "", `1️⃣ ${L(UI.step1)}`, `2️⃣ ${L(UI.step2)}`, `3️⃣ ${L(UI.step3)}`, "", `${L(UI.cities)} · ${hi ? `₹${DIAGNOSTIC_FEE} प्रति विज़िट` : `₹${DIAGNOSTIC_FEE} per visit`}`].join("\n");
      alt = L(UI.homeTitle);
      break;
    }
    case "announce":
    case "custom": {
      head = i.headline?.trim() || "";
      main = [i.body?.trim(), i.date ? `📅 ${i.date}` : "", i.place ? `📍 ${i.place}` : ""].filter(Boolean).join("\n");
      alt = head;
      break;
    }
    case "doctor": {
      head = hi ? "डॉक्टरों व क्लिनिक के लिए — जम्मू जेनेटिक्स हब" : "For doctors & clinics — Jammu Genetics Hub";
      main = hi
        ? `जेनेटिक व ऑन्कोलॉजी जाँच आपके मरीज़ों के लिए: साफ़ कीमत व रिपोर्ट का समय, क्लिनिक या घर से सैंपल, और ${cred} से काउंसलिंग सहयोग।`
        : `Genetic and oncology tests for your patients: a clear price and turnaround for every test, sample collection from your clinic or the patient's home, and counselling support from ${cred}.`;
      alt = head;
      break;
    }
  }

  const caption = [head, "", main, "", contact, "", disclaimer].join("\n").replace(/\n{3,}/g, "\n\n");
  const hashtags = hashtagsFor(p, i.template, i.lang);
  const whatsapp = (() => {
    const t = i.template;
    if (t === "doctor") return `${head}\n${i.link}`;
    if (p && ["spotlight", "who", "why", "faq", "price"].includes(t)) return `${p.displayName}${price ? ` — ${price}${hi ? " से शुरू" : " onwards"}` : ""}\n${p.tagline}\n${i.link}`;
    return `${head}\n${i.link}`;
  })();
  return { caption, hashtags, whatsapp, alt };
}
