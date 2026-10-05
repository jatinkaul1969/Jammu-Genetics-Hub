import type { HubKey } from "@/lib/test-knowledge";
import { GENETICIST_CREDENTIAL } from "@/lib/genetics-content";

// Copy + routing for the two test hubs: /[city]/genetic-tests and
// /[city]/oncology-tests (and their per-group pages).

export type HubConfig = {
  key: HubKey;
  path: string; // URL segment under /[city]
  label: string; // breadcrumb label
  title: (city: string) => string;
  description: (city: string, count: number) => string;
  h1: (city: string) => string;
  pitch: (city: string, count: number) => string;
  keywords: (city: string) => string[];
  faqs: (city: string, count: number) => { q: string; a: string }[];
  groupTitle: (group: string, city: string) => string;
  groupDescription: (group: string, city: string, count: number) => string;
};

const NOT_ADVICE =
  "This page is general information, not medical advice — please discuss test choices and results with your doctor.";

export const HUBS: Record<HubKey, HubConfig> = {
  genetic: {
    key: "genetic",
    path: "genetic-tests",
    label: "Genetic tests",
    title: (city) => `Genetic Testing in ${city}: All Genetic Tests in One Place`,
    description: (city, count) =>
      `${count}+ genetic tests in ${city} — NIPT (InsighT), double marker, newborn screening, BRCA, whole exome sequencing, carrier screening and more. Compare prices and book, with guidance from ${GENETICIST_CREDENTIAL}.`,
    h1: (city) => `Genetic Testing in ${city} — every genetic test, one place`,
    pitch: (city, count) =>
      `From NIPT and double marker screening in pregnancy to newborn screening, hereditary cancer testing, whole exome sequencing and rare-disease gene panels — Jammu Genetics Hub is your one-stop place for ${count}+ genetic tests in ${city}. Compare prices across our partner laboratories, book online, and get guidance from ${GENETICIST_CREDENTIAL} who help you understand exactly what your results mean.`,
    keywords: (city) => [
      `genetic testing in ${city}`,
      `genetic tests ${city}`,
      `genetic lab ${city}`,
      `genetic counselling ${city}`,
      `NIPT in ${city}`,
      `InsighT NIPT ${city}`,
      `whole exome sequencing in ${city}`,
      `double marker test in ${city}`,
    ],
    faqs: (city, count) => [
      {
        q: `What genetic tests are available in ${city}?`,
        a: `Through Jammu Genetics Hub you can book ${count}+ genetic tests in ${city} — pregnancy screening (NIPT / InsighT, Double, Triple and Quadruple Marker, pre-eclampsia screening), prenatal diagnosis and IVF embryo testing (PGT), pregnancy-loss and fertility genetics, newborn and metabolic screening, hereditary cancer testing, exome / genome / karyotype / microarray tests, carrier screening and thalassemia testing, and single-gene and rare-disease panels.`,
      },
      {
        q: `Does Jammu Genetics Hub have its own genetics lab?`,
        a: `No. Jammu Genetics Hub is a one-stop platform to compare, book and follow up on genetic tests. Your sample is processed by an accredited partner laboratory that performs the test, so you can choose between labs and prices in one place.`,
      },
      {
        q: `Can I talk to a geneticist before or after my test?`,
        a: `Yes. We help patients connect with ${GENETICIST_CREDENTIAL} who explain which test is right, what the result means and what to do next. Message us on WhatsApp or call to get started.`,
      },
      {
        q: `How do I know which genetic test I need?`,
        a: `It depends on why you are testing — pregnancy, a child's symptoms, family history of cancer, or planning a pregnancy. Each test page explains who the test is for and its limits, and a geneticist can help you choose. ${NOT_ADVICE}`,
      },
    ],
    groupTitle: (group, city) => `${group} in ${city}: Tests, Prices & Uses`,
    groupDescription: (group, city, count) =>
      `${count} ${group.toLowerCase()} available in ${city} through Jammu Genetics Hub — what each test is for, prices from partner labs, and guidance from ${GENETICIST_CREDENTIAL}.`,
  },
  oncology: {
    key: "oncology",
    path: "oncology-tests",
    label: "Oncology tests",
    title: (city) => `Oncology (Cancer) Tests in ${city}: Leukemia, Lymphoma, Lung & Breast Cancer Panels`,
    description: (city, count) =>
      `${count}+ oncology tests in ${city} — leukemia, lymphoma and myeloma panels (FISH, PCR, NGS, flow cytometry), lung, breast and colorectal cancer biomarkers, tumor markers and histopathology. Compare partner-lab prices and book through Jammu Genetics Hub.`,
    h1: (city) => `Oncology (Cancer) Tests in ${city}`,
    pitch: (city, count) =>
      `Jammu Genetics Hub brings ${count}+ cancer-diagnostic tests from our partner laboratories into one place in ${city}: molecular, FISH, karyotype and flow-cytometry tests for blood cancers, biomarker panels for lung, breast, colorectal and other solid tumors, tumor markers, histopathology and IHC. Find the test your oncologist has advised, see what it is for and what it costs, and book it online.`,
    keywords: (city) => [
      `oncology test in ${city}`,
      `cancer test ${city}`,
      `leukemia test ${city}`,
      `BCR-ABL test ${city}`,
      `FISH test ${city}`,
      `lung cancer EGFR test ${city}`,
      `tumor marker test ${city}`,
      `histopathology ${city}`,
    ],
    faqs: (city, count) => [
      {
        q: `What oncology tests can I book in ${city}?`,
        a: `Through Jammu Genetics Hub you can book ${count}+ oncology tests in ${city} — leukemia, lymphoma, multiple myeloma, MDS and myeloproliferative-neoplasm panels (FISH, karyotype, PCR, NGS, flow cytometry), lung, breast, colorectal and other solid-tumor biomarker tests, comprehensive tumor profiling and liquid biopsy, hereditary-cancer gene tests, tumor markers, histopathology, cytology and immunohistochemistry (IHC).`,
      },
      {
        q: `Do I need a doctor's prescription for an oncology test?`,
        a: `Oncology tests are ordered for patients with a suspected or confirmed cancer, so they are normally advised by your oncologist, hematologist or pathologist. Our pages explain what each test is for, but the choice of test should be made with your doctor. ${NOT_ADVICE}`,
      },
      {
        q: `What sample is needed for oncology tests?`,
        a: `It depends on the test — blood or bone marrow for leukemia and lymphoma tests, a tissue block (FFPE) or slides for solid-tumor and IHC tests, or a blood sample for tumor markers and liquid biopsy. Each test page lists the sample type, and our team will guide you on how and where it can be collected in ${city}.`,
      },
      {
        q: `Does Jammu Genetics Hub run its own laboratory?`,
        a: `No. Jammu Genetics Hub is a one-stop booking and comparison platform — your sample is processed by one of our accredited partner laboratories, and we help with booking, sample logistics and getting your report to you.`,
      },
      {
        q: `Can I get help understanding inherited cancer risk?`,
        a: `Yes. For hereditary cancer testing (such as BRCA1/BRCA2 and multi-gene panels), we can connect you with ${GENETICIST_CREDENTIAL} before and after testing so you understand what the result means for you and your family.`,
      },
    ],
    groupTitle: (group, city) => `${group} Tests in ${city}: Prices & What They're For`,
    groupDescription: (group, city, count) =>
      `${count} ${group.toLowerCase()} tests available in ${city} through Jammu Genetics Hub — what each test is used for, sample type and partner-lab prices.`,
  },
};

export function hubPath(cityKey: string, hub: HubKey, groupSlug?: string) {
  return `/${cityKey}/${HUBS[hub].path}${groupSlug ? `/${groupSlug}` : ""}`;
}
