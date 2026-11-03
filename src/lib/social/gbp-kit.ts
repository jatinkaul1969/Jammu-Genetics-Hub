// Copy-ready text for the Google Business Profile: the business description and
// a Services list with prices. Limits come from the profile editor: service name
// ≤ 120 characters, service description ≤ 300, business description ≤ 750.
// (Re-check the limits in the editor — Google changes them occasionally.)

import { getProductBySlug } from "@/lib/catalog";
import { contentForProduct, GENETICIST_CREDENTIAL } from "@/lib/genetics-content";
import { BRAND, phoneDisplay } from "./brand";

export const GBP_DESCRIPTION = `Jammu Genetics Hub is a one-stop place in Jammu for genetic and oncology (cancer) tests. Compare prices across partner laboratories, book home sample collection, and get guidance from ${GENETICIST_CREDENTIAL}. Tests include NIPT, double marker, newborn screening, carrier screening, thalassemia testing, BRCA and hereditary cancer panels, whole exome sequencing and hundreds of oncology tests. We do not run our own laboratory — samples are processed by accredited partner labs. Call or WhatsApp ${phoneDisplay(BRAND.whatsapp)}.`;

export const GBP_CHECKLIST: { step: string; detail: string }[] = [
  { step: "Primary category", detail: "Pick the single category that best describes you in the dropdown (\"Medical laboratory\" or \"Diagnostic center\" are the usual fits). This is the biggest ranking factor you control — choose it deliberately, then add 2–3 relevant secondary categories." },
  { step: "Website", detail: `Set Website to ${BRAND.site} so Google ties the listing to the site.` },
  { step: "Appointment / booking link", detail: `${BRAND.site}/jammu?utm_source=gbp&utm_medium=organic&utm_campaign=booking` },
  { step: "Description", detail: "Paste the description below (keep the lab-partner sentence — it keeps the claim honest)." },
  { step: "Services", detail: "Add each service below with its name, price and description. Prices should match the website." },
  { step: "Hours & service area", detail: "Keep opening hours accurate (listings can drop out of results when closed). Add Jammu — and Mumbai if you serve it — under service areas." },
  { step: "Photos", detail: "Add 8–10 real photos: the entrance, signboard, the team in uniform, the collection kit, the counselling room. Real photos beat stock images." },
  { step: "Posts", detail: "Post once a week using the 'Google post (1200×900)' size in the poster maker. Use the UTM link on the post's \"Learn more\" button so you can see Google traffic. Google does not allow phone numbers in post text: use its \"Call now\" button instead." },
  { step: "Reviews", detail: "Ask every customer for a review, equally — don't pick only happy ones and never offer a reward. Reply to every review within a day or two." },
];

export type GbpService = { slug: string; name: string; description: string; price: number };

const KIT_SLUGS = [
  "nipt-non-invasive-prenatal-testing",
  "double-marker-test",
  "triple-marker-test",
  "quadruple-marker-test",
  "nipt-expanded-microdeletions",
  "newborn-screening-panel",
  "carrier-screening-expanded",
  "carrier-screening-focused",
  "beta-thalassemia-mutation-analysis",
  "alpha-thalassemia-mutation-analysis",
  "karyotyping-blood",
  "karyotyping-prenatal",
  "chromosomal-microarray-prenatal",
  "brca1-brca2-gene-analysis",
  "hereditary-cancer-gene-panel",
  "whole-exome-sequencing",
  "clinical-exome-sequencing",
  "whole-genome-sequencing",
  "fragile-x-syndrome-testing",
  "spinal-muscular-atrophy-testing",
  "cystic-fibrosis-cftr-testing",
  "g6pd-deficiency-screening",
  "pgt-a-preimplantation-aneuploidy",
  "pgt-m-preimplantation-monogenic",
];

function clip(s: string, n: number) {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "") + "…";
}

export async function buildGbpServices(): Promise<GbpService[]> {
  const out: GbpService[] = [];
  for (const slug of KIT_SLUGS) {
    const p = await getProductBySlug(slug);
    if (!p) continue;
    const priced = p.prices.map((x) => x.price).filter((x) => x > 0);
    if (!priced.length) continue;
    const c = contentForProduct(p);
    const base = p.description || p.about || "";
    const tail = c?.collection === "home" ? " Home sample collection in Jammu." : "";
    out.push({
      slug,
      name: clip(`${p.name} in Jammu`, 120),
      description: clip(`${base}${tail}`, 300),
      price: Math.min(...priced),
    });
  }
  return out;
}
