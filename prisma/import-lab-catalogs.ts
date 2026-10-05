// Imports the Lilac Insights full test list and the Redcliffe oncology price
// list as catalog products with REAL partner prices.
//
//   npx tsx --env-file=.env prisma/import-lab-catalogs.ts            # dry run (reads DB, writes nothing)
//   npx tsx --env-file=.env prisma/import-lab-catalogs.ts --apply    # writes
//
// Safe to re-run, and safe next to prisma/seed.ts: it only ever creates or
// updates the products it owns (identified by their partner test codes) plus
// a few explicit Lilac price rows on existing curated tests. It never touches
// a routine-test product or any other lab's price.
//
// What gets imported is decided by src/lib/test-knowledge.ts: a test is
// added only if it is recognisably a genetic / prenatal / newborn / oncology
// test. Routine commodity tests (CBC, TSH, …) in the same lists are left out
// — they already exist in the catalog and are not what these labs are for.

import fs from "node:fs";
import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { LILAC_CATALOG } from "./lilac-catalog-data";
import { REDCLIFFE_ONCOLOGY } from "./redcliffe-oncology-data";
import { GENETIC_PRODUCTS } from "./genetic-tests-seed-data";
import { knowledgeFor, shortDescription, type TestKnowledge } from "../src/lib/test-knowledge";

const APPLY = process.argv.includes("--apply");
// The hand-curated genetic tests from prisma/seed.ts. Their Lilac codes mean
// "already covered"; any OTHER product carrying a Lilac/Redcliffe code was
// created by this script and is updated in place on a re-run.
const CURATED_SLUGS = new Set(GENETIC_PRODUCTS.map((g) => g.slug));
const REPORT_PATH = process.env.IMPORT_REPORT;

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL, max: 3 });
const prisma = new PrismaClient({ adapter });

// Lilac tests that are the SAME test as an existing curated product — attach
// Lilac's price to it instead of creating a duplicate product.
const LILAC_TO_EXISTING: Record<string, string> = {
  G03S07T01: "double-marker-test", // EVICODUO-First Trimester Screening
  G05S02T12: "whole-exome-sequencing",
  G04S02T01: "karyotyping-prenatal",
  G05S05T01: "chromosomal-microarray-prenatal", // Altum 315k
};

function cleanName(raw: string): string {
  return raw
    .replace(/[™®]/g, "")
    .replace(/Oncoinsights?TM\b/gi, (m) => m.replace(/TM$/i, ""))
    .replace(/\bOncoinsighs\b/gi, "Oncoinsights")
    .replace(/\bGlysine\b/g, "Glycine")
    .replace(/Hostspot/g, "Hotspot")
    .replace(/\bAminozcidopathies\b/g, "Aminoacidopathies")
    .replace(/Diffused Large/g, "Diffuse Large")
    .replace(/\s+/g, " ")
    .replace(/\s*\(\s*$/, "")
    .trim();
}

function excludeReason(name: string): string | null {
  if (/^\(deleted\)$/i.test(name) || /\(delete\)/i.test(name)) return "deleted";
  if (/\b(dna|rna) (storage|retrieval|extraction|quantification)|dna and rna extraction|raw data|data analysis|cyto slide|cell pellet|maternal cell contamination|^mcc\b|reanalysis|dna storage|\+ ?GC\b|\+DNA Storage/i.test(name)) return "service add-on";
  if (/counsel+ing|consultation|metabolic diet|prescience|at ?ease|reverse phenotyping|dysmorphology|visual autopsy|muscle biopsy|insightome/i.test(name)) return "service / unclear scope";
  if (/^(xx\/xy|digital mlpa|mutation specific testing|myeloproliferative neoplasms-?)$/i.test(name)) return "vague name";
  if (/\bSRY\b/i.test(name)) return "fetal-sex related (PC-PNDT)";
  if (/hla b27|^cd4\b|cd3, cd4/i.test(name)) return "not an oncology test";
  const mult = /\b(\d{1,2})\s*(embryos?|individuals?)\b/i.exec(name);
  if (mult && Number(mult[1]) > 1) return "per-count variant";
  if (/sure-?t[ -]?\d/i.test(name)) return "PGT-A tier duplicate";
  return null;
}

function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function slugify(name: string) {
  const s = name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.slice(0, 80).replace(/-+$/g, "");
}

type Candidate = {
  name: string;
  slugBase: string;
  knowledge: TestKnowledge;
  lilac?: { codes: string[]; price: number };
  redcliffe?: { codes: string[]; price: number; sample: string; method: string; tatHours: number; components: string };
};

async function main() {
  console.log(APPLY ? "MODE: APPLY (will write)" : "MODE: dry run (no writes)");

  // ── existing state ────────────────────────────────────────────────
  const labs = await prisma.lab.findMany({ select: { id: true, slug: true } });
  const labId = Object.fromEntries(labs.map((l) => [l.slug, l.id]));
  if (!labId["lilac-insights"] || !labId["redcliffe-labs"]) throw new Error("Lilac / Redcliffe lab rows missing");

  const existingProducts = await prisma.product.findMany({
    select: { id: true, slug: true, name: true, prices: { select: { id: true, labId: true, testCode: true } } },
  });
  // Existing routine/curated products by normalised name — a Lilac/Redcliffe
  // test with exactly the same name is the SAME test, so its real price is
  // attached to that product instead of creating a duplicate listing.
  const existingByNorm = new Map<string, { id: string; slug: string }>();
  for (const p of existingProducts) existingByNorm.set(norm(p.name), { id: p.id, slug: p.slug });
  const slugToProduct = new Map(existingProducts.map((p) => [p.slug, p]));
  const lilacCodesAlready = new Set<string>();
  for (const p of existingProducts) {
    if (!CURATED_SLUGS.has(p.slug)) continue;
    for (const pr of p.prices) {
      if (pr.labId === labId["lilac-insights"] && pr.testCode) pr.testCode.split(",").forEach((c) => lilacCodesAlready.add(c.trim()));
    }
  }

  // ── build candidates ──────────────────────────────────────────────
  const excluded: Record<string, string[]> = {};
  const unclassified: string[] = [];
  const byKey = new Map<string, Candidate>();
  const attach: { slug: string; code: string; price: number; name: string }[] = [];
  let skippedExisting = 0;

  for (const [code, rawName, mrp] of LILAC_CATALOG) {
    const name = cleanName(rawName);
    const reason = excludeReason(name);
    if (reason) {
      (excluded[reason] ??= []).push(`${code} ${name}`);
      continue;
    }
    if (LILAC_TO_EXISTING[code]) {
      attach.push({ slug: LILAC_TO_EXISTING[code], code, price: mrp, name });
      continue;
    }
    if (lilacCodesAlready.has(code)) {
      skippedExisting++;
      continue;
    }
    const k = knowledgeFor(name, code);
    if (!k) {
      unclassified.push(`${code} | ${name} | ${mrp}`);
      continue;
    }
    const key = norm(name);
    const cur = byKey.get(key);
    if (cur?.lilac) {
      cur.lilac.codes.push(code);
      cur.lilac.price = Math.min(cur.lilac.price, mrp);
    } else {
      byKey.set(key, { name, slugBase: slugify(name), knowledge: k, lilac: { codes: [code], price: mrp } });
    }
  }

  let redSkipped = 0;
  for (const [code, rawName, components, mrp, sample, method, tatHours] of REDCLIFFE_ONCOLOGY) {
    const name = cleanName(rawName);
    const reason = excludeReason(name);
    if (reason) {
      (excluded[reason] ??= []).push(code + " " + name);
      continue;
    }
    const k = knowledgeFor(name, code);
    if (!k) {
      redSkipped++;
      unclassified.push(`REDCLIFFE ${code} | ${name} | ${mrp}`);
      continue;
    }
    const key = norm(name);
    const cur = byKey.get(key);
    const red = { codes: [code], price: mrp, sample, method, tatHours, components };
    if (cur) {
      if (cur.redcliffe) {
        cur.redcliffe.codes.push(code);
        cur.redcliffe.price = Math.min(cur.redcliffe.price, mrp);
      } else cur.redcliffe = red;
    } else {
      byKey.set(key, { name, slugBase: slugify(name), knowledge: k, redcliffe: red });
    }
  }

  // ── same-name overlaps with existing products: attach, don't duplicate ──
  const overlapAttach: { productId: string; slug: string; name: string; lilac?: Candidate["lilac"]; redcliffe?: Candidate["redcliffe"] }[] = [];
  for (const [key, c] of [...byKey.entries()]) {
    const bySlug = slugToProduct.get(c.slugBase);
    const ex = existingByNorm.get(key) ?? (bySlug ? { id: bySlug.id, slug: bySlug.slug } : undefined);
    if (!ex) continue;
    // skip products created by a previous run of this script
    const exProduct = existingProducts.find((p) => p.id === ex.id)!;
    const myCodes = [...(c.lilac?.codes ?? []), ...(c.redcliffe?.codes ?? [])];
    const isOurs = exProduct.prices.some((p) => p.testCode && p.testCode.split(",").some((x) => myCodes.includes(x.trim())));
    // A product this script created under the very slug we would give it is
    // updated in place below; anything else (a routine product that merely
    // has the same name) just gets the partner price attached.
    if (isOurs && ex.slug === c.slugBase && exProduct.name === c.name) continue;
    overlapAttach.push({ productId: ex.id, slug: ex.slug, name: c.name, lilac: c.lilac, redcliffe: c.redcliffe });
    byKey.delete(key);
  }

  // ── slugs: unique within batch and against FOREIGN existing products ──
  const candidates = [...byKey.values()];
  const usedSlugs = new Set<string>();
  const finalSlug = new Map<Candidate, string>();
  for (const c of candidates) {
    let slug = c.slugBase;
    const myCodes = [...(c.lilac?.codes ?? []), ...(c.redcliffe?.codes ?? [])];
    const existing = slugToProduct.get(slug);
    const owned =
      !!existing &&
      existing.prices.some((p) => p.testCode && p.testCode.split(",").some((x) => myCodes.includes(x.trim())));
    const foreign = !!existing && !owned;
    if (!owned && (foreign || usedSlugs.has(slug))) {
      const code = (c.lilac?.codes[0] ?? c.redcliffe?.codes[0] ?? "x").toLowerCase();
      slug = `${slug}-${code}`.slice(0, 90);
    }
    let n = 2;
    while (usedSlugs.has(slug)) slug = `${c.slugBase}-${n++}`;
    usedSlugs.add(slug);
    finalSlug.set(c, slug);
  }

  // ── report ────────────────────────────────────────────────────────
  const byGroup: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  for (const c of candidates) {
    byGroup[c.knowledge.group] = (byGroup[c.knowledge.group] ?? 0) + 1;
    byCategory[c.knowledge.category] = (byCategory[c.knowledge.category] ?? 0) + 1;
  }
  const both = candidates.filter((c) => c.lilac && c.redcliffe);
  console.log(`\nLilac rows: ${LILAC_CATALOG.length}  Redcliffe oncology rows: ${REDCLIFFE_ONCOLOGY.length}`);
  console.log(`Already in catalog (skipped): ${skippedExisting}   attach-to-existing: ${attach.length}`);
  console.log(`Excluded: ${Object.entries(excluded).map(([k, v]) => `${k}=${v.length}`).join(", ")}`);
  console.log(`Unclassified (not imported): ${unclassified.length}`);
  console.log(`Attached to existing same-name products: ${overlapAttach.length}`);
  console.log(`\nNEW PRODUCTS: ${candidates.length}  (priced by both labs: ${both.length})`);
  console.log("by category:", JSON.stringify(byCategory));
  for (const [g, n] of Object.entries(byGroup).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${g}`);

  if (REPORT_PATH) {
    fs.writeFileSync(
      REPORT_PATH,
      JSON.stringify(
        {
          unclassified,
          excluded,
          attach,
          overlapAttach: overlapAttach.map((o) => ({ slug: o.slug, name: o.name, lilac: o.lilac?.price, redcliffe: o.redcliffe?.price })),
          candidates: candidates.map((c) => ({
            slug: finalSlug.get(c),
            name: c.name,
            group: c.knowledge.group,
            category: c.knowledge.category,
            lilac: c.lilac,
            redcliffe: c.redcliffe ? { codes: c.redcliffe.codes, price: c.redcliffe.price } : undefined,
            description: shortDescription(c.knowledge),
          })),
        },
        null,
        1
      )
    );
    console.log("report written:", REPORT_PATH);
  }

  if (!APPLY) return;

  // ── apply ─────────────────────────────────────────────────────────
  const categorySpecs = [{ slug: "oncology", name: "Oncology (Cancer Tests)", icon: "Microscope", order: 19 }];
  for (const cat of categorySpecs) {
    await prisma.category.upsert({ where: { slug: cat.slug }, update: {}, create: cat });
  }
  const cats = await prisma.category.findMany({ select: { id: true, slug: true } });
  const catId = Object.fromEntries(cats.map((c) => [c.slug, c.id]));

  const productData = candidates.map((c) => {
    const k = c.knowledge;
    const red = c.redcliffe;
    const components = red?.components ? red.components.split(/\s*,\s*/).filter(Boolean) : [];
    const sample = red?.sample && red.sample.length > 2 ? red.sample : k.sampleType;
    const hours = red && red.tatHours > 0 ? red.tatHours : k.reportHours;
    const extra = red ? ` Method: ${red.method || "as per lab"}. Typical turnaround: ${red.tatHours > 0 ? Math.round(red.tatHours / 24) + " working days" : "as per lab"}.` : "";
    return {
      slug: finalSlug.get(c)!,
      name: c.name,
      type: /package/i.test(c.name) ? "PACKAGE" : "TEST",
      categoryId: catId[k.category],
      parameters: Math.max(1, components.length || 1),
      sampleType: sample.slice(0, 120),
      fasting: false,
      fastingHours: null as number | null,
      reportHours: hours,
      gender: /only for males/i.test(c.name) ? "male" : k.gender,
      minAge: 0,
      description: shortDescription(k),
      about: k.what + extra,
      includesJson: JSON.stringify(components),
      popular: false,
      badge: null as string | null,
    };
  });

  const slugSet = new Set(productData.map((p) => p.slug));
  const nowExisting = await prisma.product.findMany({ where: { slug: { in: [...slugSet] } }, select: { id: true, slug: true } });
  const existingSlugs = new Set(nowExisting.map((p) => p.slug));
  const toCreate = productData.filter((p) => !existingSlugs.has(p.slug));
  const toUpdate = productData.filter((p) => existingSlugs.has(p.slug));

  console.log(`\nCreating ${toCreate.length} products, updating ${toUpdate.length}...`);
  const CHUNK = 200;
  for (let i = 0; i < toCreate.length; i += CHUNK) {
    await prisma.product.createMany({ data: toCreate.slice(i, i + CHUNK), skipDuplicates: true });
    process.stdout.write(`  created ${Math.min(i + CHUNK, toCreate.length)}/${toCreate.length}\r`);
  }
  console.log();
  for (const p of toUpdate) {
    const { slug, ...rest } = p;
    await prisma.product.update({ where: { slug }, data: rest });
  }

  const allProducts = await prisma.product.findMany({ where: { slug: { in: [...slugSet] } }, select: { id: true, slug: true } });
  const idBySlug = new Map(allProducts.map((p) => [p.slug, p.id]));

  type PriceRow = { productId: string; labId: string; price: number; mrp: number; testCode: string };
  const wanted: PriceRow[] = [];
  for (const c of candidates) {
    const productId = idBySlug.get(finalSlug.get(c)!)!;
    if (c.lilac) wanted.push({ productId, labId: labId["lilac-insights"], price: c.lilac.price, mrp: c.lilac.price, testCode: c.lilac.codes.join(", ") });
    if (c.redcliffe) wanted.push({ productId, labId: labId["redcliffe-labs"], price: c.redcliffe.price, mrp: c.redcliffe.price, testCode: c.redcliffe.codes.join(", ") });
  }
  for (const o of overlapAttach) {
    if (o.lilac) wanted.push({ productId: o.productId, labId: labId["lilac-insights"], price: o.lilac.price, mrp: o.lilac.price, testCode: o.lilac.codes.join(", ") });
    if (o.redcliffe) wanted.push({ productId: o.productId, labId: labId["redcliffe-labs"], price: o.redcliffe.price, mrp: o.redcliffe.price, testCode: o.redcliffe.codes.join(", ") });
  }
  for (const a of attach) {
    const prod = slugToProduct.get(a.slug);
    if (!prod) {
      console.warn(`  attach target missing: ${a.slug}`);
      continue;
    }
    wanted.push({ productId: prod.id, labId: labId["lilac-insights"], price: a.price, mrp: a.price, testCode: a.code });
  }

  const existingPrices = await prisma.price.findMany({
    where: { productId: { in: wanted.map((w) => w.productId) }, labId: { in: [labId["lilac-insights"], labId["redcliffe-labs"]] } },
    select: { id: true, productId: true, labId: true },
  });
  const existingKey = new Map(existingPrices.map((p) => [`${p.productId}|${p.labId}`, p.id]));
  const newPrices = wanted.filter((w) => !existingKey.has(`${w.productId}|${w.labId}`));
  const oldPrices = wanted.filter((w) => existingKey.has(`${w.productId}|${w.labId}`));
  console.log(`Creating ${newPrices.length} price rows, updating ${oldPrices.length}...`);
  for (let i = 0; i < newPrices.length; i += CHUNK) {
    await prisma.price.createMany({ data: newPrices.slice(i, i + CHUNK), skipDuplicates: true });
  }
  for (const w of oldPrices) {
    await prisma.price.update({ where: { id: existingKey.get(`${w.productId}|${w.labId}`)! }, data: { price: w.price, mrp: w.mrp, testCode: w.testCode } });
  }

  const [nProducts, nPrices] = await Promise.all([prisma.product.count(), prisma.price.count()]);
  console.log(`\nDone. Catalog now has ${nProducts} products and ${nPrices} price rows.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
