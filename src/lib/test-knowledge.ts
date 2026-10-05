// Rule-based "what is this test for" knowledge for the specialty lab catalogs
// (Lilac Insights, Redcliffe oncology, …). The partner price lists only give a
// code, a name and a price — no explanation — so this module reads a test's
// name (and its partner code, when we have one) and works out what kind of
// test it is, who it's for and what its limits are.
//
// Used in two places, so the wording stays identical:
//   • prisma/import-lab-catalogs.ts — writes each imported product's
//     category, description, `about`, sample type and turnaround;
//   • the landing pages — fills the "why it's done / who it's for / good to
//     know" sections for any test that isn't hand-written in genetics-content.ts.
//
// Rules are deliberately general (a method × a disease area, or a named
// test family) and every statement is the kind found in a patient-education
// leaflet. If a name matches nothing, knowledgeFor() returns null and the
// test is NOT treated as genetics/oncology — nothing is guessed.

export type HubKey = "genetic" | "oncology";

export type TestGroup = { name: string; slug: string; hubs: HubKey[]; blurb: string };

function g(name: string, hubs: HubKey[], blurb: string): TestGroup {
  const slug = name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return { name, slug, hubs, blurb };
}

export const TEST_GROUPS: TestGroup[] = [
  // ── Genetic tests ───────────────────────────────────────────────────
  g("Pregnancy screening", ["genetic"], "Safe blood-based screens for Down syndrome, other chromosomal conditions and pre-eclampsia."),
  g("Prenatal diagnosis & IVF", ["genetic"], "Definitive prenatal tests on the baby's cells, and embryo testing for IVF."),
  g("Pregnancy loss & fertility genetics", ["genetic"], "Genetic answers after a miscarriage, and for couples facing infertility."),
  g("Newborn & child health", ["genetic"], "Early detection of treatable inherited and metabolic conditions in babies and children."),
  g("Exome, genome & chromosome tests", ["genetic"], "Broad tests to find the genetic cause of an unexplained condition."),
  g("Gene panels & single-gene tests", ["genetic"], "Focused gene tests when a specific inherited condition is suspected."),
  g("Carrier screening & thalassemia", ["genetic"], "Plan ahead for pregnancy: find out whether you carry an inherited condition."),
  g("Hereditary cancer", ["genetic", "oncology"], "Find out whether cancer runs in your genes — for you and your family."),
  // ── Oncology (cancer) tests ─────────────────────────────────────────
  g("Leukemia", ["oncology"], "Genetic, molecular and flow-cytometry tests for acute and chronic leukemia (AML, ALL, CML, CLL)."),
  g("Lymphoma", ["oncology"], "FISH, molecular and pathology tests to classify and risk-stratify lymphoma."),
  g("Multiple myeloma", ["oncology"], "Cytogenetic, molecular and protein tests for myeloma and related plasma-cell disorders."),
  g("MDS & myeloproliferative neoplasms", ["oncology"], "Tests for myelodysplastic syndromes and blood disorders such as polycythemia vera and myelofibrosis."),
  g("Lung cancer", ["oncology"], "Biomarker tests (EGFR, ALK, ROS1, PD-L1 and more) that guide lung cancer treatment."),
  g("Breast & ovarian cancer", ["oncology"], "Hormone-receptor, HER2, BRCA and HRD tests for breast and ovarian cancer."),
  g("Colorectal & GI cancer", ["oncology"], "KRAS/NRAS/BRAF, MSI and other tests for colorectal, stomach and GI cancers."),
  g("Brain, thyroid & other solid tumors", ["oncology"], "Molecular and FISH tests for brain, thyroid, bladder and other solid tumors."),
  g("Sarcoma & childhood tumors", ["oncology"], "Translocation and amplification tests that confirm sarcomas and childhood tumors."),
  g("Comprehensive tumor profiling", ["oncology"], "Large NGS panels, liquid biopsy and tumor-mutation-burden testing for personalised treatment."),
  g("Pathology, cytology & IHC", ["oncology"], "Biopsy examination, cytology and immunohistochemistry to diagnose and type a cancer."),
  g("Tumor markers", ["oncology"], "Blood markers used to monitor cancer treatment and detect recurrence."),
  g("Cytogenetics & flow cytometry", ["oncology"], "Karyotype, FISH and flow-cytometry tests used to diagnose and monitor blood cancers and related disorders."),
  g("Stem cell transplant monitoring", ["oncology"], "Chimerism and HLA tests used around bone-marrow / stem-cell transplantation."),
];

export function groupByName(name: string) {
  return TEST_GROUPS.find((x) => x.name === name);
}
export function groupBySlug(slug: string) {
  return TEST_GROUPS.find((x) => x.slug === slug);
}
export function groupsForHub(hub: HubKey) {
  // The hub's own groups first; groups shared from the other hub (e.g.
  // "Hereditary cancer" on the oncology hub) after them.
  return TEST_GROUPS.filter((x) => x.hubs.includes(hub)).sort((a, b) => Number(b.hubs[0] === hub) - Number(a.hubs[0] === hub));
}

export type TestKnowledge = {
  group: string;
  category: "genetic-testing" | "pregnancy" | "child-care" | "oncology";
  /** "What is it" paragraph (becomes the product's `about`). */
  what: string;
  whyDone: string[];
  whoFor: string[];
  goodToKnow: string[];
  aliases: string[];
  collection: "home" | "arrange";
  sampleType: string;
  reportHours: number;
  gender: "male" | "female" | "both";
};

type Family = {
  key: string;
  test: (name: string, code: string) => boolean;
  group: string;
  category: TestKnowledge["category"];
  sampleType: string;
  reportHours: number;
  collection?: "home" | "arrange";
  gender?: "male" | "female" | "both";
  aliases?: string[];
  what: (name: string) => string;
  why: string[];
  who: string[];
  limits: string[];
};

const NOT_ONCO = /^(?!.*(leukemi|lymphoma|myeloma|oncoinsight|oncoprecise|tumou?r|cancer|carcinoma|sarcoma|\bMDS\b|\bMPN\b|\bAML\b|\bALL\b|\bCML\b|\bCLL\b|FFPE|malignan|hematolog|\bBMT\b))/i;

// ─────────────────────────────────────────────────────────────────────
// Genetic test families — explicit, named, most specific first.
// ─────────────────────────────────────────────────────────────────────
const GENETIC_FAMILIES: Family[] = [
  {
    key: "nipt",
    test: (n) => /(?<![a-z])insight(?![a-z])|^nipt/i.test(n),
    group: "Pregnancy screening",
    category: "pregnancy",
    sampleType: "Blood (maternal)",
    reportHours: 168,
    gender: "female",
    aliases: ["NIPT", "NIPT test", "Non-invasive prenatal screening", "Down syndrome blood test", "Cell-free DNA test"],
    what: (n) => {
      const adv = /advance/i.test(n);
      const plus = /plus/i.test(n);
      const pe = /-?\bPE\b/i.test(n);
      const scope = adv
        ? "Trisomy 21, 18 and 13, sex-chromosome aneuploidies and 92 microdeletion/duplication syndromes"
        : plus
          ? "Trisomy 21, 18 and 13, sex-chromosome aneuploidies and 60 microdeletion/duplication syndromes"
          : "common chromosomal conditions such as Trisomy 21 (Down syndrome), Trisomy 18 and Trisomy 13";
      return `${n} is a non-invasive prenatal screening (NIPT) test from Lilac Insights (the InsighT range). Cell-free DNA in a sample of the mother's blood is read by next-generation sequencing to estimate the chance that the baby has ${scope}.${pe ? " The -PE variants add pre-eclampsia (PE) risk assessment alongside the NIPT." : ""} The InsighT tiers differ in how many conditions they cover — message us and we will confirm exactly what this one includes.`;
    },
    why: [
      "Screens a pregnancy for chromosomal conditions from a simple maternal blood sample, with no risk to the baby.",
      "More accurate for Down syndrome than blood-marker screens such as the Double or Triple Marker.",
      "Helps decide whether a diagnostic test (amniocentesis or CVS) is really needed.",
    ],
    who: [
      "Pregnant women from about 10 weeks who want a highly accurate, non-invasive screen.",
      "Pregnancies with a higher-risk marker result or an ultrasound finding.",
      "Mothers aged 35 or above, or with a previous pregnancy affected by a chromosomal condition.",
    ],
    limits: [
      "NIPT is a screening test, not a diagnosis — a high-risk result is confirmed with a diagnostic test before any decision is made.",
      "Results are occasionally inconclusive (for example when the fetal DNA fraction is low) and a repeat sample may be needed.",
      "In India the sex of the baby cannot be disclosed (PC-PNDT Act) and is not part of the report.",
    ],
  },
  {
    key: "evico",
    test: (n, c) =>
      /evico|first trimester|integrated screening|serum integrated|\bONTD\b|pre-?eclam|\bPlGF\b|sFlt|only bio values|pappa|^(double|triple|quadruple) marker/i.test(n) ||
      (c.startsWith("G03S07") && /^AFP$/i.test(n)),
    group: "Pregnancy screening",
    category: "pregnancy",
    sampleType: "Blood (serum)",
    reportHours: 48,
    gender: "female",
    aliases: ["First trimester screening", "Double marker test", "Triple marker test", "Quadruple marker test", "Pre-eclampsia screening"],
    what: (n) =>
      /pre-?eclam|\bPE\b|PlGF|sFlt/i.test(n)
        ? `${n} is a maternal blood test used in pregnancy to assess the risk of pre-eclampsia — a pregnancy complication with high blood pressure — using markers such as PlGF (and, in some versions, the sFlt-1/PlGF ratio). It is part of Lilac Insights' Evico range of pregnancy screening tests.`
        : `${n} is a maternal serum (blood) screening test used in pregnancy. Biochemical markers in the mother's blood are combined with maternal details — and, for first-trimester tests, the NT ultrasound scan — to estimate the risk of Down syndrome (Trisomy 21) and Edwards syndrome (Trisomy 18). It belongs to the Evico / marker-screening range from Lilac Insights; the variants differ in which markers and which trimester they use.`,
    why: [
      "Estimates the chance of common chromosomal conditions (and, for the -PE tests, pre-eclampsia) from blood markers.",
      "A routine early screen that helps your doctor decide whether further testing, such as NIPT or a diagnostic test, is worthwhile.",
    ],
    who: [
      "Pregnant women — first-trimester tests are done at about 11 weeks to 13 weeks 6 days, second-trimester tests at about 15–20 weeks.",
      "Women who want a risk estimate alongside their ultrasound scans.",
    ],
    limits: [
      "It gives a risk estimate, not a diagnosis — 'screen positive' does not mean the baby has a condition.",
      "Accurate dating of the pregnancy matters, because marker values are interpreted by gestational age.",
      "A higher-risk result is usually followed by NIPT or a diagnostic test such as CVS or amniocentesis.",
    ],
  },
  {
    key: "poc",
    test: (n) => /concep-?t|products of conception/i.test(n),
    group: "Pregnancy loss & fertility genetics",
    category: "genetic-testing",
    sampleType: "Products of conception (pregnancy tissue)",
    reportHours: 72,
    collection: "arrange",
    gender: "female",
    aliases: ["Products of conception test", "POC test", "Miscarriage chromosome test", "Recurrent pregnancy loss test"],
    what: (n) =>
      `${n} is Lilac Insights' products-of-conception (POC) test. After an early pregnancy loss, tissue from the pregnancy is tested to see whether a chromosomal abnormality caused it. The panel covers the chromosomes most often responsible for pregnancy loss (13, 15, 16, 18, 21, 22, X and Y) and checks for maternal cell contamination so the result reflects the baby and not the mother.`,
    why: [
      "Looks for a chromosomal cause of an early miscarriage, giving couples an explanation.",
      "Helps decide what further tests, if any, are needed in recurrent pregnancy loss.",
    ],
    who: [
      "Couples after a miscarriage, especially recurrent pregnancy loss (two or more losses).",
      "Early pregnancy losses (usually before 12 weeks) where tissue can be collected.",
    ],
    limits: [
      "The tissue sample is collected by your gynaecologist at the time of the loss, not at home.",
      "A normal result does not rule out other causes of miscarriage; a doctor or geneticist should interpret it.",
    ],
  },
  {
    key: "qfpcr",
    test: (n) => /qf-?pcr/i.test(n),
    group: "Prenatal diagnosis & IVF",
    category: "genetic-testing",
    sampleType: "Amniotic fluid / CVS",
    reportHours: 72,
    collection: "arrange",
    gender: "female",
    aliases: ["QF-PCR", "Rapid aneuploidy test", "Prenatal Down syndrome test"],
    what: (n) =>
      `${n} is a rapid prenatal diagnostic test. Using quantitative fluorescent PCR, cells from amniotic fluid or chorionic villus sampling (CVS) are checked for extra or missing copies of chromosomes 13, 18, 21, X and Y — the most common chromosomal conditions — usually within a few days.`,
    why: [
      "Gives a quick, definite answer for the common chromosomal conditions after a high-risk screening result or abnormal scan.",
      "Results usually arrive within 2–3 days, much faster than a full karyotype.",
    ],
    who: [
      "Pregnancies with a high-risk NIPT or marker-screening result.",
      "Pregnancies with abnormal ultrasound findings, where amniocentesis or CVS is being done.",
    ],
    limits: [
      "The sample is collected by a fetal-medicine specialist or obstetrician (amniocentesis or CVS), which carries a small procedure risk.",
      "It checks only specific chromosomes; microdeletions and rearrangements need karyotyping or microarray.",
    ],
  },
  {
    key: "pgt",
    test: (n) => /\bpgt\b|pgt-|\bpgd\b|pre-?pgt|preimplantation|hla typing.*embryo|\bembryos?\b/i.test(n),
    group: "Prenatal diagnosis & IVF",
    category: "genetic-testing",
    sampleType: "Embryo biopsy",
    reportHours: 336,
    collection: "arrange",
    gender: "female",
    aliases: ["PGT", "Preimplantation genetic testing", "Embryo testing", "IVF genetic testing"],
    what: (n) =>
      /pre-?pgt/i.test(n)
        ? `${n} is the family work-up done before PGT-M in IVF. The parents' (and, where needed, relatives') samples are tested to identify and set up the specific gene variant so that embryos can later be tested accurately.`
        : /pgt-?a|aneuploid/i.test(n)
          ? `${n} is preimplantation genetic testing for aneuploidy: a few cells from each IVF embryo are tested to check it has the right number of chromosomes before an embryo is chosen for transfer.`
          : `${n} is a preimplantation genetic test used with IVF. A few cells are taken from each embryo and tested for a specific inherited condition or chromosome change before an embryo is chosen for transfer.`,
    why: [
      "Tests IVF embryos before transfer, to help choose embryos without a known genetic problem.",
      "Lets couples who carry a serious inherited condition try for a healthy pregnancy.",
    ],
    who: [
      "Couples undergoing IVF where one or both partners carry a known gene variant or chromosome rearrangement.",
      "Women with advanced maternal age, recurrent miscarriage or repeated IVF failure (PGT-A).",
    ],
    limits: [
      "The embryo biopsy is performed by your IVF clinic; it is not a blood test.",
      "Needs planning with your IVF clinic and a geneticist before the cycle; price depends on the number of embryos tested.",
      "How much PGT-A improves outcomes varies from case to case — discuss it with your fertility specialist.",
    ],
  },
  {
    key: "cma",
    test: (n) => /altum|microarray|xon array|180k/i.test(n) && !/exome|carrier/i.test(n.replace(/\+.*/, "")) || /^altum/i.test(n),
    group: "Prenatal diagnosis & IVF",
    category: "genetic-testing",
    sampleType: "Amniotic fluid / CVS / Blood",
    reportHours: 288,
    aliases: ["Chromosomal microarray", "CMA", "Altum", "Array CGH"],
    what: (n) =>
      `${n} is a chromosomal microarray (CMA) test — Lilac Insights' Altum range. It scans the whole genome for missing or extra pieces of DNA (copy-number changes) that are far too small to see on a karyotype. The "315K" and "750K" versions differ in resolution; the higher number looks in finer detail.`,
    why: [
      "Finds microdeletion and microduplication syndromes and other copy-number changes.",
      "Often the first-line test for fetuses with ultrasound anomalies, and for children with developmental delay or birth defects.",
    ],
    who: [
      "Pregnancies with abnormal ultrasound findings (sample from amniotic fluid or CVS).",
      "Children with developmental delay, intellectual disability, autism or multiple birth defects.",
    ],
    limits: [
      "Cannot detect balanced chromosome rearrangements or single-gene (point) mutations.",
      "May report variants of uncertain significance, which need genetic counselling to interpret.",
    ],
  },
  {
    key: "fetal_combo",
    test: (n) => /^fetal testing \d|fetal testing \d combo/i.test(n),
    group: "Prenatal diagnosis & IVF",
    category: "genetic-testing",
    sampleType: "Amniotic fluid / CVS",
    reportHours: 336,
    collection: "arrange",
    gender: "female",
    aliases: ["Prenatal diagnosis package", "Fetal testing combo"],
    what: (n) =>
      n + " is a bundled prenatal diagnostic package from Lilac Insights that combines more than one test on the same fetal sample — chromosomal microarray and/or cytogenetics, plus Sanger sequencing of a known gene variant — so a fetus with an abnormal ultrasound or a known family variant can be evaluated in one go.",
    why: ["Evaluates a pregnancy with ultrasound anomalies or a known family variant using several complementary tests on a single sample."],
    who: ["Pregnancies with abnormal scan findings, or where a gene variant is already known in the family, as advised by a fetal-medicine specialist or geneticist."],
    limits: ["The sample is collected by your doctor through amniocentesis or CVS, which carries a small procedure risk.", "Pre-test counselling is important: these tests can find variants of uncertain significance."],
  },
  {
    key: "fish_prenatal",
    test: (n) => /^fish[ -]*(chromosomes? )?(13|18|21|sex)|fish.*sex chromosomes/i.test(n),
    group: "Prenatal diagnosis & IVF",
    category: "genetic-testing",
    sampleType: "Amniotic fluid / CVS",
    reportHours: 96,
    collection: "arrange",
    gender: "female",
    aliases: ["FISH 13 18 21", "Prenatal FISH", "Rapid aneuploidy FISH"],
    what: (n) =>
      `${n} is a fluorescence in-situ hybridisation (FISH) test on cells from amniotic fluid or CVS. Fluorescent probes count specific chromosomes (13, 18, 21 and the sex chromosomes) to quickly confirm or rule out the common chromosomal conditions.`,
    why: [
      "Quickly confirms or rules out Down, Edwards and Patau syndromes after a high-risk screen.",
      "Results are available faster than a full karyotype.",
    ],
    who: ["Pregnancies with a high-risk screening result or abnormal scan where amniocentesis or CVS is being done."],
    limits: [
      "Sampling by amniocentesis or CVS carries a small procedure risk and is done by a specialist.",
      "FISH tests only the chromosomes targeted; other abnormalities need karyotyping or microarray.",
    ],
  },
  {
    key: "karyotype",
    test: (n) => /karyotyp|epitome|c banding|nor staining|spectral/i.test(n) && NOT_ONCO.test(n),
    group: "Exome, genome & chromosome tests",
    category: "genetic-testing",
    sampleType: "Blood (Sodium Heparin)",
    reportHours: 240,
    aliases: ["Karyotype", "Chromosome analysis", "Cytogenetics test"],
    what: (n) =>
      /prenatal/i.test(n)
        ? `${n} examines the baby's chromosomes from amniotic fluid or CVS under the microscope to give a definite diagnosis of chromosomal conditions such as Down syndrome.`
        : `${n} is a chromosome analysis (karyotype). Cells from a blood sample are grown, and the number and structure of all 46 chromosomes are examined under the microscope to find extra, missing or rearranged chromosomes.`,
    why: [
      "Detects conditions caused by extra, missing or rearranged chromosomes, such as Down, Turner and Klinefelter syndromes.",
      "Identifies balanced chromosome rearrangements in couples with repeated miscarriages or infertility.",
    ],
    who: [
      "Couples with recurrent miscarriage or unexplained infertility.",
      "People with delayed puberty or suspected sex-chromosome conditions; children with features of a chromosomal condition.",
    ],
    limits: [
      "Cannot see very small deletions or duplications — a chromosomal microarray or sequencing test covers those.",
      "Needs living cells, so the sample must reach the lab quickly; takes longer than most blood tests.",
    ],
  },
  {
    key: "fish_syndrome",
    test: (n) => /^fish\b.*(22q|prader|angelman|william'?s|digeorge)|^fish-?22q/i.test(n),
    group: "Exome, genome & chromosome tests",
    category: "genetic-testing",
    sampleType: "Blood (Sodium Heparin)",
    reportHours: 168,
    aliases: ["FISH microdeletion test"],
    what: (n) =>
      `${n} is a FISH test that uses fluorescent probes to look for a specific small chromosome deletion linked to a known syndrome (such as 22q11.2 deletion, Prader-Willi, Angelman or Williams syndrome).`,
    why: ["Confirms or rules out a specific microdeletion syndrome suspected from a child's features or an ultrasound finding."],
    who: ["Children or fetuses with features suggestive of the syndrome in question, as advised by a doctor or geneticist."],
    limits: ["FISH looks only at the one region targeted; a normal result does not exclude other genetic conditions."],
  },
  {
    key: "carrier",
    test: (n) => /carrier screening|carrier test/i.test(n),
    group: "Carrier screening & thalassemia",
    category: "genetic-testing",
    sampleType: "Blood / Saliva",
    reportHours: 336,
    aliases: ["Carrier screening", "Pre-pregnancy genetic test", "Genetic carrier test"],
    what: (n) =>
      `${n} checks whether you carry a changed copy of a gene linked to a serious recessive condition — usually without having any symptoms. Testing is most informative when both partners are tested, because a child is affected only when both parents carry a change in the same gene.`,
    why: [
      "Shows a couple's chance of having a child with a recessive genetic condition (1 in 4 per pregnancy if both carry the same one).",
      "Lets couples plan ahead — prenatal testing, PGT or other options.",
    ],
    who: [
      "Couples planning a pregnancy or in early pregnancy.",
      "Couples who are blood relatives, or with a family history of a genetic condition.",
    ],
    limits: [
      "Being a carrier does not mean you are, or will become, unwell.",
      "A negative result lowers but does not remove the chance of being a carrier — no panel covers every variant.",
    ],
  },
  {
    key: "exome",
    test: (n) => /exome|genome sequencing|mitochondrial genome|\bWES\b|\bCES\b/i.test(n) && NOT_ONCO.test(n),
    group: "Exome, genome & chromosome tests",
    category: "genetic-testing",
    sampleType: "Blood (EDTA)",
    reportHours: 360,
    aliases: ["Exome sequencing", "WES", "CES", "Genetic test for undiagnosed disease"],
    what: (n) =>
      /whole genome/i.test(n)
        ? `${n} reads essentially all of a person's DNA, coding and non-coding, giving the most complete genetic picture available.`
        : /clinical exome|\bCES\b/i.test(n)
          ? `${n} analyses the roughly 5,000 genes with established links to inherited disease — a focused alternative to whole exome sequencing.`
          : `${n} reads the protein-coding regions (the exome) of about 20,000 genes at once, where most known disease-causing variants are found.${/trio/i.test(n) ? " The 'Trio' version tests the child and both parents together, which makes results easier to interpret." : ""}${/duo/i.test(n) ? " The 'Duo' version tests the patient and one parent." : ""}${/mito/i.test(n) ? " The mitochondrial genome is read as well." : ""}`,
    why: [
      "Looks for a genetic cause when a child or adult has symptoms but no single gene is clearly suspected.",
      "Can end a long series of inconclusive tests and give a family a name for the condition, with implications for treatment and family planning.",
    ],
    who: [
      "Children with developmental delay, intellectual disability, or epilepsy of unknown cause.",
      "People with multiple birth defects or a suspected rare genetic condition without a clear diagnosis.",
      "Families where earlier genetic tests, such as a karyotype or microarray, were normal.",
    ],
    limits: [
      "A cause is found in a substantial minority of cases, so 'no cause found' does not rule out a genetic condition.",
      "May report variants of uncertain significance or unrelated findings — counselling before and after is important.",
      "Can miss some kinds of change (such as repeat expansions and variants in non-coding DNA).",
    ],
  },
  {
    key: "thal",
    test: (n) => /thal|sickle|\bHBB\b|hemoglobin|haemoglobin|HPFH|\bHb[ -]?[SEDC]\b|(^|[^a-z])globin/i.test(n) && !/hemoglobinuria|myoglobin/i.test(n) && NOT_ONCO.test(n),
    group: "Carrier screening & thalassemia",
    category: "genetic-testing",
    sampleType: "Blood (EDTA)",
    reportHours: 168,
    aliases: ["Thalassemia test", "Sickle cell test", "Haemoglobinopathy test", "HBB gene test"],
    what: (n) =>
      /prenatal/i.test(n)
        ? `${n} is a prenatal test on amniotic fluid or CVS to find out whether an unborn baby has inherited thalassemia or a sickle-cell disorder from carrier parents.`
        : `${n} is a molecular test for inherited blood-haemoglobin disorders such as thalassemia and sickle-cell disease. It identifies the specific gene change, confirming carrier status or the cause of a haemoglobin disorder.`,
    why: [
      "Confirms thalassemia or sickle-cell carrier status after an abnormal haemoglobin (HPLC) screening result.",
      "Essential for planning prenatal diagnosis or embryo testing when both partners are carriers.",
    ],
    who: [
      "Couples where both partners are carriers; people with an abnormal HPLC or blood count.",
      "Pregnant women found to be carriers whose partners need testing.",
    ],
    limits: [
      "Common-mutation panels cover the frequent changes only; rare ones may need full gene sequencing.",
      "If both parents are carriers, each pregnancy has a 1-in-4 chance of a severely affected baby — prenatal diagnosis is available.",
    ],
  },
  {
    key: "repeat",
    test: (n) => /fragile|huntington|myotonic|spinocerebellar|friedreich|triplet|repeat|ATN1|\bSCA\b/i.test(n) && NOT_ONCO.test(n),
    group: "Gene panels & single-gene tests",
    category: "genetic-testing",
    sampleType: "Blood (EDTA)",
    reportHours: 240,
    aliases: ["Repeat expansion test", "Fragile X test", "Triplet repeat test"],
    what: (n) =>
      `${n} is a molecular test that measures the number of repeats in a gene. In some inherited conditions — such as Fragile X syndrome, Huntington disease, myotonic dystrophy, Friedreich ataxia and the spinocerebellar ataxias — a short DNA sequence is repeated too many times, and counting the repeats makes the diagnosis.`,
    why: [
      "Confirms or rules out a repeat-expansion disorder in someone with suggestive symptoms or a family history.",
      "Identifies carriers and supports prenatal diagnosis in affected families.",
    ],
    who: [
      "People with suggestive neurological or developmental symptoms and relatives of affected patients.",
      "Couples planning pregnancy in families with a known repeat-expansion disorder.",
    ],
    limits: [
      "Repeat expansions can change between generations, so counselling is important.",
      "Predictive testing for adult-onset disorders (e.g. Huntington disease) needs careful pre-test counselling.",
    ],
  },
  {
    key: "methylation",
    test: (n) => /methylation|ms-?mlpa|snrpn|beckwith|russell|silver|prader|angelman/i.test(n) && NOT_ONCO.test(n) && !/^fish/i.test(n),
    group: "Gene panels & single-gene tests",
    category: "genetic-testing",
    sampleType: "Blood (EDTA)",
    reportHours: 240,
    aliases: ["Methylation test", "Imprinting disorder test"],
    what: (n) =>
      `${n} is a methylation test used to diagnose imprinting disorders such as Prader-Willi, Angelman, Beckwith-Wiedemann and Silver-Russell syndromes, where the problem is how certain genes are switched on or off rather than a change in the DNA letters.`,
    why: ["Diagnoses imprinting disorders that routine chromosome tests may miss."],
    who: ["Children with features of the suspected syndrome, and fetuses in families with a known imprinting disorder."],
    limits: ["It detects the methylation pattern but not always the underlying cause; further testing may be advised."],
  },
  {
    key: "mlpa",
    test: (n) => /mlpa|del(etion)?\/ ?dup|deletion\/duplication|digital mlpa/i.test(n) && NOT_ONCO.test(n),
    group: "Gene panels & single-gene tests",
    category: "genetic-testing",
    sampleType: "Blood (EDTA)",
    reportHours: 240,
    aliases: ["MLPA test", "Deletion duplication analysis"],
    what: (n) =>
      `${n} uses MLPA (multiplex ligation-dependent probe amplification) to detect large deletions or duplications — missing or extra whole exons — in a gene. These large changes are missed by routine gene sequencing and cause conditions such as Duchenne muscular dystrophy and spinal muscular atrophy.`,
    why: ["Finds large deletions and duplications in a specific gene, often the main cause in diseases such as Duchenne muscular dystrophy."],
    who: ["Patients with a suspected single-gene disorder, carriers in affected families and pregnancies at known risk."],
    limits: ["Does not detect small point mutations — sequencing is used for those; both are often needed."],
  },
  {
    key: "male_fertility",
    test: (n, c) => /y-?microdeletion|azoospermia|\bNOA\b|\bOA panel|\bMA panel|infertility|\bRPL\b|premature ovarian|\bPOI\b/i.test(n) && (/^G0[5-8]S/.test(c) || /y-?microdeletion/i.test(n)),
    group: "Pregnancy loss & fertility genetics",
    category: "genetic-testing",
    sampleType: "Blood (EDTA)",
    reportHours: 240,
    aliases: ["Infertility genetic test", "Y microdeletion test", "Recurrent pregnancy loss genetic panel"],
    what: (n) =>
      `${n} is a genetic test used to look for an inherited cause of infertility or recurrent pregnancy loss — for example Y-chromosome microdeletions or other gene changes in men with very low or absent sperm count, and gene panels for women with premature ovarian insufficiency or repeated miscarriage.`,
    why: [
      "Looks for a genetic reason behind infertility or repeated miscarriage.",
      "Helps couples and fertility specialists choose the right treatment, including whether sperm retrieval or IVF is likely to help.",
    ],
    who: [
      "Men with azoospermia or severe oligospermia.",
      "Women with premature ovarian insufficiency or recurrent pregnancy loss.",
    ],
    limits: ["A normal result does not exclude other causes of infertility.", "Results should be discussed with your fertility specialist and a geneticist."],
  },
  {
    key: "newborn_metabolic",
    test: (n) =>
      /carie?m|\bTMS\b|tandem mass|gc-?ms|amino acid|advance metabolic|complete metabolic|bio7|succinylacetone|\bMRST\b|galactosemia|galactose|biotinidase|congenital hypothyroidism|g6pd deficiency|cystic fibrosis\(|plasma free fatty|metabolic gene panel|metabolic combo|inborn errors/i.test(n),
    group: "Newborn & child health",
    category: "child-care",
    sampleType: "Dried blood spot / Blood",
    reportHours: 168,
    collection: "arrange",
    aliases: ["Newborn screening", "Metabolic screening", "Inborn errors of metabolism test", "Tandem mass spectrometry"],
    what: (n) =>
      `${n} is a newborn / metabolic screening test used to detect inborn errors of metabolism — rare inherited conditions in which the body cannot process certain nutrients properly. Detected early, many of these conditions can be treated with a special diet or medicines before they cause harm. (CarIeM is Lilac Insights' tiered newborn-screening range; the panel names indicate how broad the screen is.)`,
    why: [
      "Picks up treatable metabolic and endocrine conditions before symptoms appear.",
      "Early treatment can prevent serious illness and developmental problems.",
    ],
    who: [
      "Newborns, ideally sampled in the first days of life, and babies or children with unexplained illness, poor feeding or developmental regression.",
    ],
    limits: [
      "A screening result that needs follow-up is not a diagnosis — confirmatory testing is arranged by your doctor.",
      "Tell us the baby's date of birth when you book; timing of sampling matters.",
    ],
  },
  {
    key: "enzyme",
    test: (n) => /enzyme|\bMPS\b|mucopolysacc|gaucher|pompe|krabbe|metachromatic|fabry|galactosidase|hunter|hurler|morquio|niemann|sphingomyelinase|chitotriosidase|mannosid|batten|\bPPT\b|TPP1|gm1|i-cell|\bCDG\b|sialic|oligosaccharide|\bGAG\b|glycogen storage|acid lipase|wolman|\bNCL\b|\bADA2\b|lsd gene|hexosaminidase|fucosidase|mucolipidosis|\bVLCFA\b|lysosomal|methylmalonic|succinyl ?acetone|phenylalanine|neuraminic|tfief|transferrin isoelectric/i.test(n),
    group: "Newborn & child health",
    category: "child-care",
    sampleType: "Blood / Dried blood spot",
    reportHours: 336,
    aliases: ["Enzyme assay", "Lysosomal storage disorder test", "Metabolic disorder test"],
    what: (n) =>
      `${n} is an enzyme or biochemical test used to diagnose a specific inherited metabolic condition, such as a lysosomal storage disorder (for example Gaucher disease, Pompe disease or the mucopolysaccharidoses). Measuring how well a particular enzyme works shows whether it is deficient.`,
    why: ["Confirms or excludes a specific inherited metabolic disorder in a child with suggestive symptoms.", "Guides treatment, such as enzyme-replacement therapy, where available."],
    who: ["Children and adults with unexplained developmental regression, organ enlargement, bone or neurological problems, as advised by a doctor."],
    limits: ["Usually followed by gene testing to confirm the exact variant, which helps with family planning."],
  },
  {
    key: "hereditary_cancer",
    test: (n) => /germline|hereditary (cancer|breast|panel|ovarian|colorectal)|extended hereditary|\bBRCA1\b.*\bBRCA2\b|brca1,brca2/i.test(n) && !/fish|ihc|ffpe|tumou?r brca|somatic/i.test(n),
    group: "Hereditary cancer",
    category: "oncology",
    sampleType: "Blood (EDTA)",
    reportHours: 336,
    aliases: ["Hereditary cancer test", "BRCA test", "Germline cancer panel", "Cancer risk gene test"],
    what: (n) =>
      `${n} is a germline (inherited) cancer-risk gene test. It looks in a blood sample for harmful changes in genes such as BRCA1 and BRCA2 that raise the lifetime risk of cancers like breast, ovarian, prostate and pancreatic cancer, and are passed through families.`,
    why: [
      "Shows whether cancer in the family is linked to an inherited gene change.",
      "Guides screening, preventive options and, in some cancers, treatment choices — and lets relatives be tested.",
    ],
    who: [
      "People diagnosed with breast cancer at a young age, triple-negative breast cancer, ovarian cancer or several related cancers.",
      "People with several close relatives with breast, ovarian, prostate, pancreatic or colorectal cancer.",
    ],
    limits: [
      "A negative result lowers but does not remove cancer risk.",
      "Some results are 'variants of uncertain significance' needing specialist interpretation — counselling before and after testing is strongly recommended.",
    ],
  },
  {
    key: "gene_panel",
    test: (n, c) => (/^G0[56]S/.test(c) && /panel/i.test(n)) || /gene sequencing|gene analysis|sequencing$|single variant|syndrome|dystrophy|dysplasia|neurofibromatosis|achondroplasia|\bFGFR3\b|wilson|ataxia|hemophilia|noonan|cornelia|autism|epilepsy|retinal|albinism|ichthyosis|exostoses|polycystic|\bMODY\b|maturity-onset|parkinson|\bRB1\b|\bTSC[12]\b|\bNF[12]\b|\bPMP22\b|\bCFTR\b|SMN1|\bG6PD gene|alpha globin|dystrophin|\bDMD\b|\bVHL\b|spinal muscular|\bSMA\b|cystic fibrosis|delta ?f508|incontinentia|\bNEMO\b|rh-?genotyping|familial testing/i.test(n) && NOT_ONCO.test(n) && !/fish/i.test(n),
    group: "Gene panels & single-gene tests",
    category: "genetic-testing",
    sampleType: "Blood (EDTA)",
    reportHours: 336,
    aliases: ["Genetic test", "Gene panel", "Single gene test", "Genetic disorder test"],
    what: (n) =>
      `${n} is a targeted genetic test. Instead of reading every gene, it looks at the one gene — or the group of genes — linked to the specific inherited condition that a doctor suspects, which makes it faster and more affordable than an exome when the diagnosis is narrowed down.`,
    why: [
      "Confirms or rules out a specific suspected inherited condition at the DNA level.",
      "Supports carrier testing and prenatal diagnosis once the family's gene change is known.",
    ],
    who: [
      "Patients whose symptoms or investigations point to a particular inherited disorder.",
      "Relatives and couples in families with a known gene variant, and pregnancies at known risk.",
    ],
    limits: [
      "A targeted test only covers the genes it names; if it is normal, broader testing such as an exome may be advised.",
      "Variants of uncertain significance can be reported — a geneticist helps interpret them.",
    ],
  },
  {
    key: "thrombophilia_pgx",
    test: (n, c) => /factor v leiden|prothrombin g|prothrombin gene|\bmthfr\b|thrombophilia mutation|ugt1a1|nudt15|\btpmt\b|\bDPD\b|hla[ -]/i.test(n) && (/^G0[4-8]S/.test(c) || /mutation|polymorphism|gene/i.test(n)) && NOT_ONCO.test(n),
    group: "Gene panels & single-gene tests",
    category: "genetic-testing",
    sampleType: "Blood (EDTA)",
    reportHours: 168,
    aliases: ["Thrombophilia genetic test", "Pharmacogenetic test", "HLA typing"],
    what: (n) =>
      `${n} is a genetic or coagulation-related test used to look for an inherited tendency to blood clotting (such as Factor V Leiden, prothrombin G20210A or MTHFR variants), to type HLA genes for transplant or disease-association work, or to check gene variants that affect how a person handles certain medicines.`,
    why: ["Helps explain recurrent clots or recurrent pregnancy loss, and guide medication or transplant matching decisions."],
    who: ["People with unexplained clots or recurrent miscarriage, or patients being assessed for a specific drug or transplant."],
    limits: ["Carrying a variant raises risk but does not mean a clot will definitely occur; interpretation needs a doctor."],
  },
  {
    key: "torch_pcr",
    test: (n) => /^(torch|rubella|toxoplasma|cmv|hsv|varicella|parvovirus|cmv toxoplasma).*pcr|pcr.*(torch|cmv|toxoplasma)|urine torch/i.test(n),
    group: "Pregnancy loss & fertility genetics",
    category: "pregnancy",
    sampleType: "Blood / Amniotic fluid / Urine",
    reportHours: 96,
    gender: "female",
    aliases: ["TORCH PCR", "Congenital infection PCR"],
    what: (n) =>
      `${n} is a PCR test that detects the DNA of infections which can harm an unborn baby (toxoplasma, rubella, cytomegalovirus, herpes and similar). It is used when a mother's antibody tests are unclear or an infection of the baby is suspected.`,
    why: ["Confirms or excludes a congenital infection that antibody tests cannot settle."],
    who: ["Pregnant women with infection exposure or abnormal ultrasound findings, and newborns with suspected congenital infection."],
    limits: ["Sample type (blood, amniotic fluid or urine) depends on the question being asked; your doctor decides."],
  },
];

// ─────────────────────────────────────────────────────────────────────
// Oncology: a test is described by its METHOD × its DISEASE area.
// ─────────────────────────────────────────────────────────────────────
type Method = {
  key: string;
  test: RegExp;
  what: string;
  why: string;
  limits: string[];
  sampleType: string;
  reportHours: number;
};

const ONCO_METHODS: Method[] = [
  { key: "karyotype", test: /karyotyp|\bCK\b|chromosomal breakage|ploidy/i, what: "a conventional karyotyping (chromosome analysis) test", why: "Karyotyping shows the whole set of chromosomes of cancer cells under the microscope, revealing extra, missing or rearranged chromosomes across the genome.", limits: ["Needs living, dividing cells, so the sample must reach the lab quickly.", "Small changes below the microscope's resolution can be missed — FISH or molecular tests are used alongside."], sampleType: "Bone marrow / Blood (Sodium Heparin)", reportHours: 240 },
  { key: "flow", test: /flow ?cytometry|\bFCM\b|immunophenotyp|flow panel|\bFLAER\b|lymphocyte subset|\bPID\b|T-regulatory|DHR|\bNBT\b|\bMRD by flow/i, what: "a flow cytometry (immunophenotyping) test", why: "Flow cytometry identifies cell types from the proteins on their surface — classifying leukemias and lymphomas and detecting tiny numbers of remaining cancer cells (minimal residual disease, MRD).", limits: ["Needs a fresh sample that reaches the lab promptly.", "Interpreted together with the blood/marrow smear and genetic results."], sampleType: "Blood / Bone marrow (EDTA or Sodium Heparin)", reportHours: 96 },
  { key: "fish", test: /\bFISH\b|\bDISH\b|translocation|rearrangement|amplification|\bdel ?\(|deletion analysis|trisomy|t\(\d|inv\(|break ?apart|\bCDx\b/i, what: "a FISH (fluorescence in-situ hybridisation) test", why: "FISH uses fluorescent probes to find specific chromosome changes — translocations, deletions or extra gene copies — in individual cells, even cells that are not dividing.", limits: ["FISH looks only for the specific changes it is designed to detect; a normal result does not exclude other abnormalities."], sampleType: "Blood / Bone marrow (Sodium Heparin) or FFPE tissue", reportHours: 168 },
  { key: "ngs", test: /\bNGS\b|next generation|oncoprecise|gene panel|comprehensive genomic|\bCGP\b|\bTMB\b|tumou?r mutation burden|pan cancer|liquid biopsy|whole exome|\bHRD\b|\bHRR\b|panel by|myeloid.*panel|haemat-onco|extended molecular panel|precise panel|molecular panel|(?<!\w)panel \(/i, what: "a next-generation sequencing (NGS) test", why: "NGS reads many genes at once to find the mutations driving a cancer — helping with diagnosis, prognosis and, in some cancers, the choice of targeted therapy.", limits: ["Can report variants of uncertain significance.", "A negative result does not exclude cancer; changes outside the genes covered are not seen."], sampleType: "Blood / Bone marrow / FFPE tissue", reportHours: 336 },
  { key: "pcr", test: /pcr|arms|rt-?q|transcript|mlpa|fragment analysis|genotyping|\bMRD\b|\bIRMA\b|mutation|sequencing|mutations|methylation|\bV600E?\b|\bJAK2\b|\bCALR\b|\bMPL\b|\bFLT3\b|\bNPM1\b|\bCEBPA\b|\bIDH[12]\b|\bKRAS\b|\bNRAS\b|\bEGFR\b|\bBRAF\b|\bMSI\b|\bTP53\b|\bKIT\b|PDGFRA|\bMYD88\b|\bCXCR4\b|\bIGHV\b|\bNOTCH1\b|\bSF3B1\b|\bASXL1\b|\bDNMT3A\b|\bEZH2\b|\bCTNNB1\b|\bPIK3CA\b|\bIKZF1\b|\bNUDT15\b|\bTPMT\b|\bDPD\b|MGMT|EBV/i, what: "a molecular (PCR / gene-sequencing) test", why: "Molecular tests detect or measure specific gene mutations and fusion genes with high sensitivity — useful at diagnosis, for choosing treatment and for tracking response over time.", limits: ["Detects only the targets it is designed for."], sampleType: "Blood / Bone marrow (EDTA) or FFPE tissue", reportHours: 120 },
  { key: "ihc", test: /\bIHC\b|immunohistochem|\bICH\b|PD-?L1|\bHER2 by|\bMSI by IHC|claudin|mismatch repair/i, what: "an immunohistochemistry (IHC) test on tissue", why: "IHC uses antibodies to show which proteins are present in a tissue sample, helping the pathologist name the tumor type and choose treatment.", limits: ["Needs a tissue block or slides from a biopsy or surgery.", "Result quality depends on how the tissue was handled and fixed."], sampleType: "Tissue block / slides (FFPE)", reportHours: 96 },
  { key: "histo", test: /histopath|biopsy|bone marrow|\bBMA\b|\bBM aspirate|reticulin|iron staining|peripheral (blood )?smear|morphology|lymph ?node|second opinion|slide review|block review|final diagnosis/i, what: "a pathology (tissue / blood-smear) examination", why: "A pathologist examines the tissue or cells under the microscope to diagnose disease — including cancer — and report its type, grade and extent.", limits: ["Needs a good-quality, adequately sized sample; the report is correlated with clinical and imaging findings."], sampleType: "Tissue biopsy / Bone marrow / Blood smear", reportHours: 72 },
  { key: "cyto", test: /cytology|\bFNAC\b|pap smear|\bLBC\b|liquid based cytology|\bHPV\b/i, what: "a cytology test", why: "Cells from a fluid, swab or needle aspirate are examined under the microscope (or tested for HPV DNA) for abnormal or malignant cells — including early cervical changes.", limits: ["A negative result does not completely exclude cancer; tissue biopsy may still be needed."], sampleType: "Fluid / Swab / Needle aspirate", reportHours: 48 },
  { key: "marker", test: /\bCA ?\d|\bCEA\b|\bAFP\b|alpha fet|\bPSA\b|prostate specific|cyfra|\bHE4\b|chromogranin|progrp|\bROMA\b|beta[ -]?2[ -]?micro|tumou?r marker|testicular cancer|cancer screening|free light chain|protein electrophoresis|immunofixation|erythropoietin/i, what: "a tumor-marker blood test", why: "Tumor markers are substances in the blood that can be raised in some cancers. They are mainly used to monitor treatment and spot recurrence rather than to diagnose cancer by themselves.", limits: ["Markers can be raised in non-cancer conditions and normal in some cancers, so they are not a stand-alone screening test."], sampleType: "Blood (serum)", reportHours: 24 },
  { key: "chimerism", test: /chimerism|\bBMT\b|\bSTR\b|\bVNTR\b|hla typing|post bmt/i, what: "a transplant-monitoring (chimerism / HLA) test", why: "After a bone-marrow / stem-cell transplant, chimerism testing shows what proportion of the patient's blood cells come from the donor; HLA typing checks donor–patient matching.", limits: ["Interpreted by the transplant team over serial samples, not from a single result."], sampleType: "Blood (EDTA)", reportHours: 120 },
];

type Disease = {
  key: string;
  group: string;
  test: RegExp;
  label: string;
  why: string[];
  who: string[];
};

const ONCO_DISEASES: Disease[] = [
  { key: "hereditary", group: "Hereditary cancer", test: /germline|hereditary|lynch|\bBRCA[12]\b.*(germline|ngs|mlpa)|brca1 ?,? ?brca2|basal cell nervous/i, label: "inherited cancer risk", why: ["Shows whether a cancer or a strong family history is linked to an inherited gene change."], who: ["People with cancer at a young age, several related cancers, or a known family variant."] },
  { key: "transplant", group: "Stem cell transplant monitoring", test: /chimerism|\bBMT\b|hla typing|\bSTR\b|\bVNTR\b|cell pellet/i, label: "stem-cell / bone-marrow transplant follow-up", why: ["Tracks whether the donor's cells have taken over after a transplant, so relapse or graft failure is caught early."], who: ["Patients who have had or are about to have a bone-marrow / stem-cell transplant."] },
  { key: "cgp", group: "Comprehensive tumor profiling", test: /oncoprecise|pan cancer|comprehensive genomic|\bCGP\b|\bTMB\b|tumou?r mutation burden|liquid biopsy|precise panel|comprehensive tumor|\b52 gene\b|\b270 gene\b|whole exome|haemat-onco|\bHRD\b|\bHRR\b|PARPi|\bPARP\b|risk predictor/i, label: "solid tumors and blood cancers needing broad molecular profiling", why: ["Looks across many cancer genes at once to match the tumor to targeted or immune therapies and to clinical trials.", "Liquid-biopsy versions use a blood sample when tissue is not available or to monitor treatment."], who: ["Patients with advanced or hard-to-classify cancer, as advised by their oncologist.", "People whose cancer has stopped responding to treatment and who may benefit from targeted therapy."] },
  { key: "myeloma", group: "Multiple myeloma", test: /myeloma|\bMM\b|plasma cell|IGH\/(CCND|MAF|FGFR)|IGK|IGL|\bAMP \(1q\)|1q analysis|waldenstr|\bCXCR4\b|\bMYD88\b|free light chain|protein electrophoresis|immunofixation|\bCD138\b/i, label: "multiple myeloma and related plasma-cell disorders", why: ["Cytogenetic and molecular findings (such as del(17p), t(4;14), t(14;16)) define high-risk myeloma and shape treatment.", "Flow cytometry and protein tests help diagnose and monitor treatment response, including minimal residual disease."], who: ["Patients with suspected or confirmed myeloma, MGUS or Waldenström macroglobulinemia, as advised by a hematologist."] },
  { key: "mpn_mds", group: "MDS & myeloproliferative neoplasms", test: /\bMDS\b|myelodysplas|\bMPN\b|myeloproliferative|\bJAK2\b|\bCALR\b|\bMPL\b|\bASXL1\b|\bSF3B1\b|\bCEL\b|eosinophil|PDGFR[AB]|FGFR1|polycythemia|myelofibrosis|thrombocythemia/i, label: "myelodysplastic syndromes and myeloproliferative neoplasms", why: ["Mutations such as JAK2 V617F, CALR and MPL confirm a myeloproliferative neoplasm; cytogenetic and gene changes classify MDS and its risk.", "Results guide prognosis and treatment choices."], who: ["Patients with unexplained high blood counts, low blood counts or suspected MDS / MPN, as advised by a hematologist."] },
  { key: "cll", group: "Leukemia", test: /\bCLL\b|chronic lymphocytic|\bIGHV\b|\bNOTCH1\b|trisomy 12|del\(?13q|\b13q\b|ATM deletion|del ?\(?11q|\bT-PLL\b|hairy cell|\bHCL\b|prolymphocytic/i, label: "chronic lymphocytic leukemia (CLL) and related disorders", why: ["IGHV status, TP53 changes and FISH results (del 13q, del 11q, del 17p, trisomy 12) predict how CLL will behave and which treatment suits it."], who: ["Patients with CLL or suspected chronic lymphoproliferative disease before and during treatment."] },
  { key: "cml", group: "Leukemia", test: /\bCML\b|chronic myeloid|BCR-?ABL|imatinib|\bIRMA\b|ABL1 kinase|\bp210|\bp190|\bp230|philadelphia|t\(9;22\)|ph1/i, label: "chronic myeloid leukemia (CML) and Philadelphia-positive leukemia", why: ["BCR::ABL1 testing confirms the diagnosis; repeated quantitative (RT-qPCR) testing tracks response to treatment.", "Kinase-domain mutation testing explains resistance to imatinib and related drugs."], who: ["Patients with suspected or confirmed CML, and Philadelphia-positive ALL, at diagnosis and during follow-up."] },
  { key: "all", group: "Leukemia", test: /\bB-?ALL\b|\bT-?ALL\b|acute lymphoblastic|\bALL\b|ph1 like|\bIKZF1\b|\bCRLF2\b|ETV6|RUNX1.*ETV6|\bPBX1\b|\bTCF3\b|IAMP21|\bMEF2D\b|\bZNF384\b|\bEPOR\b|\bNUP214\b|\bABL[12]\b|\bCSF1R\b|\bTLX[13]\b|TCR-|CDKN2A.*(del|9p21)|9p21|\bNUDT15\b|\bKMT2A\b|\bMLL\b|hyperdiploid|ploidy|trisomy 4|IGH positive/i, label: "acute lymphoblastic leukemia (ALL)", why: ["Chromosome and gene changes (such as BCR::ABL1, ETV6::RUNX1, KMT2A rearrangements, hyperdiploidy) define ALL subtypes, predict outcome and decide treatment intensity.", "MRD testing after treatment shows whether any leukemia cells remain."], who: ["Children and adults with suspected or confirmed acute lymphoblastic leukemia, as advised by a hematologist or oncologist."] },
  { key: "aml", group: "Leukemia", test: /\bAML\b|acute myeloid|myeloid|\bFLT3\b|\bNPM1\b|\bCEBPA\b|\bDNMT3A\b|\bIDH[12]\b|\bRUNX1\b|inv\(?16\)?|inv\(?3\)?|t\(8;21\)|t\(6;9\)|t\(1;22\)|RBM15|\bNUP98\b|\bMECOM\b|PML-?RARA|\bAPL\b|\bRARA\b|c-?KIT D816|cKIT|\bCBF\b|RUNX1T1|leukemia|leukaemia|acute leukemia|-5\/del|-7\/del|del ?\(20q|\bBMT\b|\bMRD\b/i, label: "acute and chronic leukemia, including acute myeloid leukemia (AML)", why: ["Genetic findings (for example FLT3, NPM1, CEBPA, PML::RARA, RUNX1::RUNX1T1) classify AML, predict outcome and decide which treatment to use.", "Repeat testing after treatment (MRD) shows whether leukemia cells remain."], who: ["Patients with suspected or confirmed acute leukemia or related blood cancer, as advised by a hematologist or oncologist."] },
  { key: "lymphoma", group: "Lymphoma", test: /lymphoma|\bDLBCL\b|mantle|follicular|burkitt|\bMALT\b|hodgkin|\bBCL[26]\b|\bIRF4\b|8q24|\bMYC\b|dual hit|triple hit|\bALPS\b|\bCLPD\b|T-cell gene rearrangement|TCR gene|\bEZH2\b|hepatosplenic|lymphnode|lymph node/i, label: "lymphoma", why: ["Translocations such as MYC, BCL2 and BCL6 (and the 'double/triple-hit' pattern), together with IHC, separate types of lymphoma and identify high-risk disease.", "Clonality tests (T-cell and B-cell gene rearrangement) help tell cancer from a reactive process."], who: ["Patients with a lymph-node or tissue biopsy suspicious for lymphoma, as advised by a hematologist or oncologist."] },
  { key: "lung", group: "Lung cancer", test: /lung|nsclc|non small cell|\bEGFR\b|\bALK\b|\bROS1\b|\bMET\b|c-?met|\bKRAS\b.*lung|\bRET\b|\bNTRK\b|\bPD-?L1\b|\bBRAF\b.*lung/i, label: "lung cancer", why: ["Biomarkers such as EGFR, ALK, ROS1, BRAF V600E, MET and PD-L1 decide whether a lung cancer can be treated with a targeted drug or immunotherapy.", "Testing at diagnosis (and again if treatment stops working) lets doctors pick the most effective drug."], who: ["Patients with non-small-cell lung cancer, especially adenocarcinoma, as advised by their oncologist."] },
  { key: "colorectal", group: "Colorectal & GI cancer", test: /colorectal|\bMSI\b|microsatellite|\bKRAS\b|\bNRAS\b|\bHRAS\b|mismatch repair|\bMMR\b|\bMLH1\b/i, label: "colorectal cancer", why: ["KRAS, NRAS and BRAF results decide whether anti-EGFR therapy will work in colorectal cancer.", "MSI / mismatch-repair testing guides immunotherapy and screens for Lynch syndrome."], who: ["Patients with colorectal cancer, as advised by their oncologist."] },
  { key: "breast", group: "Breast & ovarian cancer", test: /breast|ovarian|endometrial cancer|\bHER2\b|\bERBB2\b|\bER\b.*\bPR\b|ki-?67|\bPIK3CA\b|ca ?125|ca ?15\.3|\bHE4\b|\bROMA\b|\bBRCA/i, label: "breast and ovarian cancer", why: ["ER, PR and HER2 status decide hormone, anti-HER2 and other treatment for breast cancer.", "BRCA, HRD and PIK3CA results guide PARP-inhibitor and other targeted treatment, especially in ovarian cancer."], who: ["Patients with breast, ovarian or endometrial cancer, as advised by their oncologist."] },
  { key: "gi", group: "Colorectal & GI cancer", test: /claudin|\bGIST\b|gastric|\bGI cancer|ca ?19\.9|\bCEA\b|carcino ?embryonic|\bKIT\b|PDGFRA|pancreatic|hepatocellular|liver cancer/i, label: "stomach, pancreatic, liver and other gastrointestinal cancers, and GIST", why: ["Tumor markers such as CEA and CA 19-9 help monitor gastrointestinal cancers.", "KIT/PDGFRA testing guides treatment of GIST; claudin 18.2 and HER2 guide treatment of gastric cancer."], who: ["Patients with colorectal, gastric, pancreatic, liver or GIST tumors, as advised by their oncologist."] },
  { key: "sarcoma", group: "Sarcoma & childhood tumors", test: /sarcoma|ewing|\bEWSR1\b|synovial|rhabdo|neuroblastoma|\bMYCN\b|n-?myc|\bFOXO1\b|\bPAX3\b|liposarcoma|fibrosarcoma|\bMDM2\b|retinoblastoma|\bRB1\b|wilms|\bBCOR\b|\bDDIT3\b|\bTFE3\b|dermatofibro|\bNTRK[123]\b|ETV6 trans|\bFLI1\b|1p36|isochromosome|germ ?cell/i, label: "sarcomas and childhood tumors", why: ["Many sarcomas and childhood tumors are defined by a characteristic translocation or amplification (for example EWSR1, SS18::SSX, PAX3::FOXO1, MYCN), so FISH or molecular testing confirms the exact diagnosis."], who: ["Patients whose biopsy suggests a sarcoma or paediatric tumor, as advised by a pathologist or oncologist."] },
  { key: "solid_other", group: "Brain, thyroid & other solid tumors", test: /glioma|medulloblastoma|\bMGMT\b|1p ?\/?19q|\bIDH\b|thyroid (cancer|carcinoma|tumou?r)|\bBRAF\b|bladder|urothelial|melanoma|neurolog|\bCDKN2A\b|\bCTNNB1\b|\bRET\b|basal cell|\bCDx\b|\bWT1\b|\bFGFR/i, label: "brain tumors, thyroid cancer, melanoma, bladder cancer and other solid tumors", why: ["Molecular and FISH findings (for example IDH, 1p/19q, MGMT in gliomas; BRAF in melanoma and thyroid cancer) help classify the tumor, predict outcome and guide treatment."], who: ["Patients with a confirmed or suspected tumor of these types, as advised by their oncologist or surgeon."] },
  { key: "marker", group: "Tumor markers", test: /\bCA ?\d|\bCEA\b|carcino ?embryonic|\bAFP\b|alpha fet|\bPSA\b|prostate specific|cyfra|chromogranin|progrp|beta[ -]?2[ -]?micro|tumou?r marker|testicular|cancer screening|erythropoietin/i, label: "monitoring cancer and spotting recurrence", why: ["Serial marker levels can show whether treatment is working and flag a return of cancer early."], who: ["Patients on treatment for, or in follow-up after, a cancer where the marker is relevant, as advised by their oncologist."] },
  { key: "path", group: "Pathology, cytology & IHC", test: /histopath|biopsy|\bIHC\b|immunohistochem|\bICH\b|cytology|\bFNAC\b|pap smear|\bLBC\b|smear|bone marrow|\bBM\b|reticulin|iron staining|morphology|block review|slide review|second opinion|\bPD-?L1\b|\bHER2\b|\bHPV\b|final diagnosis|\bAFB\b|\bki-?67\b/i, label: "diagnosing and typing cancer from tissue and cells", why: ["Examination of tissue and cells by a pathologist is the foundation of a cancer diagnosis; IHC then identifies the tumor type and its treatment markers."], who: ["Patients who have had a biopsy, surgery, needle aspiration or bone-marrow sample, as advised by their doctor."] },
];

const isOncoCode = (code: string) => /^G(08|09|10|11|12|14|15)S/.test(code) || /^(CG|HM|MD|BC|PL|CY|HP)\d/.test(code);
const ONCO_GENES = /\b(TP53|EGFR|KRAS|NRAS|BRAF|ALK|ROS1|JAK2|FLT3|NPM1|IDH[12]|BCR-?ABL1?|PML-?RARA?|MYD88|PIK3CA|HER2|ERBB2|MSI|WT1|FGFR[1-4s]?)\b/;
// Routine / non-cancer tests whose names happen to contain an oncology word.
const NEVER_ONCO = /glomerular|creatinine|triglycerid|cholest|\blipid\b|\bCPK\b|thyroid stimulating|T3,T4|free thyroid|thyroid profile|thyroid function|parathyroid|hemogram|viper venom|\bRVVT\b|leukocyte alkaline|\bLAP\b|endometrial receptivity|\bvit\b|immunodeficiency|\bPID\b|\bPNH\b|\bCGD\b|lymphocyte subset|t-regulatory|IgG,IgA,IgM|phospholipid|\bHLH\b|hemophagocytic|sideroblastic|adamts/i;
// Tests in the oncology code ranges that are genetic (not cancer) tests — let the genetic families claim them.
const NON_CANCER_GENETIC = /thal|sickle|mthfr|digeorge/i;

function matchOncology(name: string, code: string): { disease: Disease | null; method: Method | null } {
  // Names that state the organ outright win over gene names that also occur in blood cancers (e.g. ETV6).
  const explicit = /breast cancer/i.test(name)
    ? "breast"
    : /lung cancer|nsclc|non small cell/i.test(name)
      ? "lung"
      : /colorectal|colon cancer/i.test(name)
        ? "colorectal"
        : null;
  const disease = (explicit ? ONCO_DISEASES.find((d) => d.key === explicit) : null) ?? ONCO_DISEASES.find((d) => d.test.test(name)) ?? null;
  const method = ONCO_METHODS.find((m) => m.test.test(name)) ?? null;
  // Lilac's oncology codes are G08 (molecular), G09 (FISH/cytogenetics),
  // G10 (combi panels), G11 (hemato-pathology), G12 (histopath/IHC),
  // G14 (precision oncology), G15 — anything under those is oncology even if
  // the name alone is terse (e.g. "Trisomy 12").
  const oncoCode = isOncoCode(code);
  if (!disease && !method && !oncoCode) return { disease: null, method: null };
  return { disease, method };
}

function oncologyKnowledge(name: string, code: string): TestKnowledge | null {
  const { disease, method } = matchOncology(name, code);
  const oncoCode = isOncoCode(code);
  const cancerWords = /cancer|tumou?r|leuk|lymphom|myelom|carcinom|sarcom|oncol|malignan|metasta/i.test(name);
  const markerOk = /^(ca ?\d{1,3}(\.\d)?|cea|carcino ?embryonic|afp|alpha feto|total prostate specific|prostate specific|cyfra|he4|chromogranin|beta 2-?micro)/i.test(name);
  const pathOk = /histopath|biopsy|cytology|fnac|pap smear|liquid based cytology|\bLBC\b|hpv dna|\bIHC\b|immunohistochem/i.test(name);
  const looksOnco =
    oncoCode ||
    ONCO_GENES.test(name) ||
    cancerWords ||
    markerOk ||
    pathOk ||
    (!!disease && disease.key !== "path" && disease.key !== "marker");
  if (!looksOnco) return null;

  const m =
    method ??
    (/\bpanel\b|\bcombi\b/i.test(name)
      ? ONCO_METHODS.find((x) => x.key === "ngs")!
      : { key: "generic", test: /./, what: "a specialised cancer-diagnostic test", why: "This test examines a patient sample for features that help diagnose, classify or monitor a cancer.", limits: [], sampleType: "Blood / Bone marrow / Tissue (as specified)", reportHours: 168 });
  const d = disease;
  const isCombi = /combi|karyotyping ?\+|\+ ?(fish|ngs|karyotyp)|ck ?\+|cytogenetic panel/i.test(name);

  const what =
    `${name} is ${m.what}${isCombi ? " (a combined panel that bundles more than one method)" : ""}${d ? ` used in ${d.label}` : " used in cancer diagnosis"}. ${m.why}` +
    (/oncoinsights?|oncoprecise/i.test(name) ? " Oncoinsights and Oncoprecise are Lilac Insights' oncology test brands." : "");
  const whyDone = [m.why, ...(d?.why ?? ["Helps your oncologist diagnose, classify and plan treatment for a cancer."])];
  const whoFor = d?.who ?? ["Patients with a suspected or confirmed cancer, as advised by their oncologist or hematologist."];
  const goodToKnow = [
    ...m.limits,
    "This is a diagnostic test ordered for patients with a suspected or known cancer — it is not a general screening test for healthy people.",
    "Results should be read with the clinical picture by your treating oncologist or hematologist.",
  ];

  const group =
    (m.key === "marker" && /^(ca ?\d|cea|carcino ?embryonic|afp|alpha feto|total prostate|prostate specific|cyfra|he4|chromogranin|progrp|beta 2|human chorionic|testicular|cancer screening|roma|human epididymis)/i.test(name) ? "Tumor markers" : undefined) ??
    d?.group ??
    (m.key === "marker"
      ? "Tumor markers"
      : m.key === "histo" || m.key === "ihc" || m.key === "cyto"
        ? "Pathology, cytology & IHC"
        : m.key === "flow" || m.key === "fish" || m.key === "karyotype"
          ? "Cytogenetics & flow cytometry"
          : "Comprehensive tumor profiling");
  const aliases = [name, "Oncology test", "Cancer test"];
  if (d) aliases.push(d.label.split(",")[0]);

  return {
    group,
    category: "oncology",
    what,
    whyDone,
    whoFor,
    goodToKnow,
    aliases,
    collection: m.key === "ihc" || m.key === "histo" || m.key === "cyto" ? "arrange" : "home",
    sampleType: m.sampleType,
    reportHours: m.reportHours,
    gender: "both",
  };
}

// Lilac-code → family override, for tests whose names alone are ambiguous
// (e.g. "AFP" is a pregnancy marker in G03S07 but a tumor marker elsewhere).
export function knowledgeFor(name: string, codes: string | string[] = ""): TestKnowledge | null {
  // Partner codes may be several joined with commas ("G08S01T01, G08S01T02").
  const all = (Array.isArray(codes) ? codes : [codes]).flatMap((c) => (c ?? "").split(/[,\s]+/)).filter(Boolean);
  const code = all.find((c) => /^G\d+S\d+/.test(c)) ?? all[0] ?? "";
  const nm = name.replace(/\s+/g, " ").trim();

  // Oncology wins when the name is clearly about cancer (so "Oncoinsights
  // Whole Exome Sequencing" is not mistaken for a germline exome test).
  const onco = NEVER_ONCO.test(nm) && !/immunohistochem|IHC/i.test(nm) ? null : oncologyKnowledge(nm, code);
  const clearlyOnco = (isOncoCode(code) && !/constitutional|fanconi/i.test(nm) && !NON_CANCER_GENETIC.test(nm)) || /oncoinsight|oncoprecise|leukemi|leukaemi|lymphoma|myeloma|\bAML\b|\bCLL\b|\bCML\b|\bMDS\b|\bMPN\b|\bB-?ALL\b|\bT-?ALL\b|tumou?r|cancer|carcinoma|sarcoma|\bFFPE\b|\bNSCLC\b/i.test(nm);
  if (onco && clearlyOnco && !/^(hereditary|germline)/i.test(nm)) {
    const hereditary = GENETIC_FAMILIES.find((f) => f.key === "hereditary_cancer")!;
    if (hereditary.test(nm, code)) return fromFamily(hereditary, nm);
    return onco;
  }

  for (const f of GENETIC_FAMILIES) {
    if (f.test(nm, code)) return fromFamily(f, nm);
  }
  return onco;
}

function fromFamily(f: Family, name: string): TestKnowledge {
  return {
    group: f.group,
    category: f.category,
    what: f.what(name),
    whyDone: f.why,
    whoFor: f.who,
    goodToKnow: f.limits,
    aliases: [...(f.aliases ?? []), name],
    collection: f.collection ?? "home",
    sampleType: f.sampleType,
    reportHours: f.reportHours,
    gender: f.gender ?? "both",
  };
}

/** A one-line card/meta description derived from the "what" paragraph. */
export function shortDescription(k: TestKnowledge): string {
  // First two sentences, cut at a word boundary — enough to say what the test
  // is AND what it looks for, short enough for a card / meta description.
  const sentences = k.what.split(/(?<=\.)\s/);
  let out = sentences[0];
  if (out.length < 110 && sentences[1]) out += " " + sentences[1];
  if (out.length <= 200) return out;
  const cut = out.slice(0, 197);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s]+$/, "") + "…";
}
