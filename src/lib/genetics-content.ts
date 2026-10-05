// Educational copy for the 25 genetic tests, keyed by product slug. It feeds
// the genetics landing pages (/[city]/tests/[slug], /[city]/genetic-tests) —
// the DB only holds a one-paragraph `about` per test, which is too thin to
// answer "what is X / who needs it / what are its limits" searches.
//
// Keep it general and accurate: this is patient education, not advice, and
// every page pairs it with a "talk to a geneticist" call to action. A slug
// that isn't in this map is NOT a genetics test and keeps the plain
// price-page layout.

import { groupByName, knowledgeFor } from "@/lib/test-knowledge";

// The credential as the business owner states it. Not expanded here on
// purpose — keep it exactly as claimed, and only where it can be backed up.
export const GENETICIST_CREDENTIAL = "BGCI-certified geneticists";

export type GeneticTestContent = {
  group: string;
  /** Other names people search this test by — meta keywords + schema alternateName. */
  aliases: string[];
  /**
   * "home": a phlebotomist can collect a blood sample at the patient's address.
   * "arrange": sample comes from an embryo biopsy, amniocentesis/CVS or a
   * newborn heel-prick — not a routine home draw, so we say so honestly.
   */
  collection: "home" | "arrange";
  whyDone: string[];
  whoFor: string[];
  goodToKnow: string[];
};

export const GENETICS_CONTENT: Record<string, GeneticTestContent> = {
  // ── Pregnancy screening ─────────────────────────────────────────────
  "nipt-non-invasive-prenatal-testing": {
    group: "Pregnancy screening",
    aliases: ["NIPT", "NIPT test", "Non-invasive prenatal screening", "Down syndrome blood test", "Cell-free fetal DNA test"],
    collection: "home",
    whyDone: [
      "Screens the pregnancy for Down syndrome (Trisomy 21), Edwards syndrome (Trisomy 18) and Patau syndrome (Trisomy 13) from a simple blood sample taken from the mother.",
      "Gives a more accurate chromosomal risk estimate than blood-marker screens such as the Double or Triple Marker, with no risk to the pregnancy.",
      "Often chosen after a higher-risk marker or ultrasound result, to decide whether a diagnostic test like amniocentesis is really needed.",
    ],
    whoFor: [
      "Pregnant women from about 10 weeks who want a highly accurate, non-invasive screen.",
      "Pregnancies with a higher-risk Double/Triple Marker result or an ultrasound finding.",
      "Mothers aged 35 or above, or with a previous pregnancy affected by a chromosomal condition.",
      "IVF pregnancies, and anyone who wants a safe early screening option.",
    ],
    goodToKnow: [
      "NIPT is a screening test, not a diagnosis — a high-risk result is confirmed with a diagnostic test such as amniocentesis before any decision is made.",
      "Results are occasionally inconclusive (for example when the fetal DNA fraction is low) and a repeat sample may be needed.",
      "Twin pregnancies and some other situations need extra counselling about how the result should be read.",
    ],
  },
  "nipt-expanded-microdeletions": {
    group: "Pregnancy screening",
    aliases: ["Expanded NIPT", "NIPT with microdeletions", "Genome-wide NIPT", "22q11.2 deletion screening"],
    collection: "home",
    whyDone: [
      "Screens all chromosomes — not only 21, 18 and 13 — for extra or missing copies.",
      "Adds screening for common microdeletion syndromes, such as 22q11.2 deletion syndrome.",
      "Gives a broader view than standard NIPT from the same single blood sample, with no risk to the pregnancy.",
    ],
    whoFor: [
      "Pregnant women from about 10 weeks who want the widest non-invasive screen available.",
      "Pregnancies with ultrasound findings that raise concern about a chromosomal or microdeletion condition.",
      "Couples with a history of chromosomal conditions in the family or in a previous pregnancy.",
    ],
    goodToKnow: [
      "Still a screening test: a positive result needs a diagnostic test (amniocentesis or CVS) to confirm.",
      "Screening for rarer conditions has lower accuracy than for Down syndrome, so a geneticist should explain how to read the result.",
      "In India, telling the parents the sex of the baby is prohibited by law (PCPNDT Act) and is not part of the report.",
    ],
  },
  "double-marker-test": {
    group: "Pregnancy screening",
    aliases: ["Double marker test", "Dual marker test", "First trimester screening", "Combined screening", "Free beta hCG and PAPP-A"],
    collection: "home",
    whyDone: [
      "Estimates the chance of Down syndrome (Trisomy 21) and Edwards syndrome (Trisomy 18) in the first trimester using two blood markers — free β-hCG and PAPP-A.",
      "Combined with the NT (nuchal translucency) ultrasound and the mother's age to produce a single risk score.",
      "A routine early screen that helps decide whether further testing, such as NIPT or a diagnostic test, is worthwhile.",
    ],
    whoFor: [
      "Pregnant women, ideally between 11 weeks and 13 weeks 6 days of pregnancy.",
      "Mothers who want a first-trimester risk estimate alongside the NT scan.",
      "Women who prefer a lower-cost screen, or who are not opting for NIPT.",
    ],
    goodToKnow: [
      "It gives a risk estimate, not a diagnosis — 'screen positive' does not mean the baby has a condition.",
      "It is most reliable when done within the correct week window and paired with an NT scan; your doctor will advise on timing.",
      "A higher-risk result is usually followed by NIPT or a diagnostic test such as CVS or amniocentesis.",
    ],
  },
  "triple-marker-test": {
    group: "Pregnancy screening",
    aliases: ["Triple marker test", "Triple screen", "Second trimester screening", "AFP hCG uE3 test"],
    collection: "home",
    whyDone: [
      "A second-trimester blood screen that estimates the chance of Down syndrome and Edwards syndrome using AFP, hCG and unconjugated estriol (uE3).",
      "AFP also helps flag a raised risk of neural tube defects such as spina bifida.",
      "A useful option when the first-trimester Double Marker window has been missed.",
    ],
    whoFor: [
      "Pregnant women who missed the first-trimester Double Marker screen.",
      "Usually done between 15 and 20 weeks of pregnancy (most accurate around 16–18 weeks).",
      "Anyone whose doctor wants a second-trimester risk estimate.",
    ],
    goodToKnow: [
      "Screening only — results are a probability, and a high-risk result needs confirmation with a diagnostic test.",
      "Accurate dating of the pregnancy matters, because marker values are interpreted by gestational age.",
      "The Quadruple Marker adds a fourth marker and is slightly more sensitive.",
    ],
  },
  "quadruple-marker-test": {
    group: "Pregnancy screening",
    aliases: ["Quad marker test", "Quadruple screen", "Quad screen", "AFP hCG estriol inhibin A test"],
    collection: "home",
    whyDone: [
      "Second-trimester screen for Down syndrome, Edwards syndrome and neural tube defects using four markers — AFP, hCG, estriol and inhibin-A.",
      "Adding inhibin-A improves the detection of Down syndrome compared with the Triple Marker.",
      "Helps your doctor decide whether a diagnostic test is advisable.",
    ],
    whoFor: [
      "Pregnant women who did not have first-trimester screening.",
      "Usually done between 15 and 20 weeks of pregnancy.",
      "Anyone whose doctor wants a more sensitive second-trimester screen than the Triple Marker.",
    ],
    goodToKnow: [
      "A screening test, not a diagnosis — a screen-positive result is followed up with a diagnostic test.",
      "Accurate pregnancy dating is important for correct interpretation.",
      "Marker screens are less accurate than NIPT; NIPT is often offered next after a higher-risk result.",
    ],
  },

  // ── Prenatal diagnosis & IVF ────────────────────────────────────────
  "pgt-a-preimplantation-aneuploidy": {
    group: "Prenatal diagnosis & IVF",
    aliases: ["PGT-A", "PGS", "Preimplantation genetic screening", "Embryo chromosome screening", "IVF embryo screening"],
    collection: "arrange",
    whyDone: [
      "Checks IVF embryos for the correct number of chromosomes before an embryo is transferred.",
      "Aims to help select embryos with a normal chromosome count.",
      "Used in IVF cycles where chromosomal abnormality in embryos is a particular concern.",
    ],
    whoFor: [
      "Couples undergoing IVF where the mother is of advanced age.",
      "Women with recurrent pregnancy loss or repeated IVF failure.",
      "Couples with a previous pregnancy affected by a chromosomal condition.",
    ],
    goodToKnow: [
      "It is done on a few cells biopsied from the embryo by your IVF clinic — it is not a blood test.",
      "How much PGT-A improves outcomes varies from case to case and is still debated, so discuss it with your fertility specialist and a geneticist.",
      "Some embryos give mosaic or inconclusive results, which need careful counselling.",
    ],
  },
  "pgt-m-preimplantation-monogenic": {
    group: "Prenatal diagnosis & IVF",
    aliases: ["PGT-M", "PGD", "Preimplantation genetic diagnosis", "Embryo single-gene testing", "Thalassemia embryo testing"],
    collection: "arrange",
    whyDone: [
      "Tests IVF embryos for a specific, already-identified inherited single-gene condition in the family.",
      "Helps couples who carry a serious genetic condition — such as thalassemia, SMA or cystic fibrosis — transfer an embryo that does not have it.",
      "Offers an alternative to learning the result later through prenatal testing during pregnancy.",
    ],
    whoFor: [
      "Couples where one or both partners carry a known disease-causing gene variant.",
      "Families with a previous child affected by a genetic condition.",
      "Couples undergoing IVF who want to avoid passing on a known inherited condition.",
    ],
    goodToKnow: [
      "It needs a prior work-up on your family's specific gene variant, so set-up takes longer than the report time shown.",
      "The embryo biopsy is performed by your IVF clinic; confirmatory prenatal testing during pregnancy may still be advised.",
      "A geneticist should plan the test with you and your fertility doctor before the IVF cycle begins.",
    ],
  },
  "karyotyping-prenatal": {
    group: "Prenatal diagnosis & IVF",
    aliases: ["Prenatal karyotype", "Amniotic fluid karyotype", "CVS karyotype", "Fetal chromosome analysis", "Amniocentesis test"],
    collection: "arrange",
    whyDone: [
      "Directly examines the baby's chromosomes from amniotic fluid (amniocentesis) or chorionic villi (CVS).",
      "Gives a definite diagnosis for conditions such as Down syndrome, rather than a risk estimate.",
      "Used to confirm a high-risk screening result or an abnormal ultrasound finding.",
    ],
    whoFor: [
      "Pregnancies with a high-risk NIPT, Double Marker, Triple Marker or Quadruple Marker result.",
      "Pregnancies with abnormal ultrasound findings.",
      "Couples with a previous child or pregnancy affected by a chromosomal condition, or a known parental chromosome rearrangement.",
    ],
    goodToKnow: [
      "The sample is collected by a fetal medicine specialist or obstetrician through amniocentesis or CVS — a procedure with a small but real risk that your doctor will discuss with you.",
      "Karyotyping cannot see very small deletions or duplications; a prenatal chromosomal microarray can.",
      "Decisions after a result should be made with your doctor and a geneticist.",
    ],
  },
  "chromosomal-microarray-prenatal": {
    group: "Prenatal diagnosis & IVF",
    aliases: ["Prenatal microarray", "CMA", "Chromosomal microarray", "Array CGH prenatal", "Fetal microarray"],
    collection: "arrange",
    whyDone: [
      "Scans the baby's DNA for missing or extra pieces (copy-number changes) far smaller than a karyotype can show.",
      "Increases the chance of finding a cause when the ultrasound shows a structural anomaly.",
      "Can identify microdeletion and microduplication syndromes, such as 22q11.2 deletion syndrome.",
    ],
    whoFor: [
      "Pregnancies with abnormal ultrasound findings, such as heart defects or other malformations.",
      "Pregnancies where a karyotype was normal but concern remains.",
      "Couples who want the most detailed chromosomal evaluation after amniocentesis or CVS.",
    ],
    goodToKnow: [
      "The sample is amniotic fluid or CVS collected by your doctor — a procedure with a small risk.",
      "It cannot detect balanced chromosome rearrangements or single-gene (point) mutations.",
      "It can report variants of uncertain significance, which need genetic counselling to interpret.",
    ],
  },

  // ── Newborn & child health ──────────────────────────────────────────
  "newborn-screening-panel": {
    group: "Newborn & child health",
    aliases: ["Newborn screening test", "NBS test", "Heel prick test", "Newborn metabolic screening", "Baby screening test"],
    collection: "arrange",
    whyDone: [
      "Screens a newborn for treatable conditions that may show no symptoms at birth — including congenital hypothyroidism, CAH, G6PD deficiency, galactosemia, biotinidase deficiency and phenylketonuria (PKU).",
      "Early detection lets treatment — such as thyroid hormone or a special diet — start before permanent harm occurs.",
      "Needs only a few drops of blood from the baby's heel.",
    ],
    whoFor: [
      "Every newborn — ideally sampled between 48 and 72 hours after birth, and before discharge where possible.",
      "Babies born at home or in centres without a routine screening programme.",
      "Parents who want a wider panel than the basic screen offered at the birth hospital.",
    ],
    goodToKnow: [
      "A result that needs follow-up is not a diagnosis — your doctor will arrange confirmatory testing.",
      "Tell us your baby's date of birth when you book, because the best sampling time is in the first few days of life.",
      "Premature or unwell newborns, and babies who have had a transfusion, may need repeat sampling.",
    ],
  },
  "g6pd-deficiency-screening": {
    group: "Newborn & child health",
    aliases: ["G6PD test", "G6PD deficiency test", "G6PD enzyme assay", "Favism test"],
    collection: "home",
    whyDone: [
      "Measures the activity of G6PD, an enzyme that protects red blood cells.",
      "Identifies G6PD deficiency, in which red cells can break down after certain medicines, infections or fava beans.",
      "Helps doctors choose safe medicines — for example before certain antimalarial and other drugs.",
    ],
    whoFor: [
      "Newborns with prolonged or severe jaundice.",
      "People with unexplained anaemia, dark urine or jaundice after taking medicines or eating fava beans.",
      "Family members of someone with G6PD deficiency, or anyone advised to test before starting specific drugs.",
    ],
    goodToKnow: [
      "G6PD deficiency is inherited on the X chromosome, so it is more common in boys and men.",
      "A recent blood transfusion or an active episode of red-cell breakdown can make results look falsely normal — tell your doctor so testing can be timed well.",
      "Most people with G6PD deficiency stay well if they avoid known triggers.",
    ],
  },

  // ── Hereditary cancer ───────────────────────────────────────────────
  "brca1-brca2-gene-analysis": {
    group: "Hereditary cancer",
    aliases: ["BRCA test", "BRCA1 BRCA2 test", "Breast cancer gene test", "Hereditary breast and ovarian cancer test"],
    collection: "home",
    whyDone: [
      "Looks for harmful changes in the BRCA1 and BRCA2 genes, which raise the lifetime risk of breast and ovarian cancer — and of some other cancers, including prostate and pancreatic.",
      "Helps guide screening, preventive options and, in some cancers, treatment choices.",
      "A positive result lets blood relatives be tested too (cascade testing).",
    ],
    whoFor: [
      "People diagnosed with breast cancer at a young age, triple-negative breast cancer, or ovarian cancer.",
      "People with several close relatives who had breast, ovarian, prostate or pancreatic cancer.",
      "Men with breast cancer, and relatives of someone already found to carry a BRCA variant.",
    ],
    goodToKnow: [
      "A negative result does not remove cancer risk — it only means no BRCA1/2 variant was found; other genes and lifestyle factors still matter.",
      "Some results are 'variants of uncertain significance' and need specialist interpretation rather than immediate action.",
      "Counselling with a geneticist before and after testing is strongly recommended, because the result can affect the whole family.",
    ],
  },
  "hereditary-cancer-gene-panel": {
    group: "Hereditary cancer",
    aliases: ["Hereditary cancer panel", "Multi-gene cancer panel", "Cancer risk gene test", "Lynch syndrome test"],
    collection: "home",
    whyDone: [
      "Checks 30+ genes linked to inherited cancer risk in a single test, including BRCA1 and BRCA2.",
      "Panels like this typically also cover genes associated with conditions such as Lynch syndrome.",
      "Gives a broader answer than BRCA-only testing when the family pattern is unclear.",
    ],
    whoFor: [
      "People diagnosed with cancer at an unusually young age, or with more than one primary cancer.",
      "Families with several relatives affected by the same or related cancers (for example breast, ovarian, colorectal, endometrial).",
      "Anyone whose doctor suspects an inherited cancer syndrome.",
    ],
    goodToKnow: [
      "Testing more genes raises the chance of 'uncertain' results — a geneticist helps interpret them.",
      "A positive result can change screening plans and affect relatives' health decisions.",
      "A negative result lowers but does not remove hereditary cancer risk.",
    ],
  },

  // ── Exome, genome & chromosome tests ────────────────────────────────
  "whole-exome-sequencing": {
    group: "Exome, genome & chromosome tests",
    aliases: ["WES", "Whole exome sequencing test", "Exome test", "Exome sequencing", "Genetic test for undiagnosed disease"],
    collection: "home",
    whyDone: [
      "Reads the protein-coding regions (the exome) of about 20,000 genes in a single test — where most known disease-causing variants are found.",
      "Used to look for a genetic cause when a child or adult has symptoms but no single gene is clearly suspected.",
      "Can end a long series of inconclusive tests and give a family a name for the condition, with implications for treatment, outlook and family planning.",
    ],
    whoFor: [
      "Children with developmental delay, intellectual disability, or epilepsy of unknown cause.",
      "People with multiple birth defects or a suspected rare genetic condition that has no clear diagnosis.",
      "Families where earlier genetic tests, such as a karyotype or microarray, were normal.",
      "Seriously unwell babies and children where a genetic cause is suspected.",
    ],
    goodToKnow: [
      "A cause is found in a substantial minority of cases — often around a quarter to a third in published studies — so 'no cause found' does not rule out a genetic condition.",
      "Testing the child together with both parents (a 'trio') often makes interpretation easier.",
      "It can miss some kinds of change (such as repeat expansions and variants in non-coding DNA) and may reveal uncertain or unrelated findings — counselling before and after is important.",
    ],
  },
  "clinical-exome-sequencing": {
    group: "Exome, genome & chromosome tests",
    aliases: ["CES", "Clinical exome test", "Clinical exome sequencing test", "Mendeliome", "Targeted exome"],
    collection: "home",
    whyDone: [
      "Analyses about 5,000 genes with established links to inherited disease — a focused alternative to whole exome sequencing.",
      "Covers the genes most likely to explain a suspected genetic condition, which keeps interpretation faster and the cost lower.",
      "A common first-line test for unexplained neurological, developmental or metabolic symptoms.",
    ],
    whoFor: [
      "Children with developmental delay, seizures or multiple congenital anomalies.",
      "People with a suspected inherited condition that affects several body systems.",
      "Families who want something broader than single-gene testing but not a full exome.",
    ],
    goodToKnow: [
      "It covers fewer genes than a whole exome; if no cause is found, your geneticist may suggest extending to whole exome or genome.",
      "Like any sequencing test, it can report variants of uncertain significance that need specialist interpretation.",
      "It works best when ordered after a clinical assessment, so the right test is chosen for the symptoms.",
    ],
  },
  "whole-genome-sequencing": {
    group: "Exome, genome & chromosome tests",
    aliases: ["WGS", "Whole genome sequencing test", "Genome sequencing", "Complete genome test"],
    collection: "home",
    whyDone: [
      "Reads essentially all of your DNA — coding and non-coding — and can detect many kinds of variant, including structural changes.",
      "The most comprehensive genetic test available; used when a genetic cause is strongly suspected but exome sequencing found nothing.",
      "Produces a lasting dataset that can be re-analysed as scientific knowledge grows.",
    ],
    whoFor: [
      "Patients whose exome or panel test was negative but clinical suspicion remains high.",
      "Complex or rare presentations where a broad search is clinically justified.",
      "Families and clinicians seeking the widest possible genetic evaluation.",
    ],
    goodToKnow: [
      "It generates a very large amount of data, so interpretation takes longer — typically three weeks or more.",
      "It is the most expensive option and not always necessary; a geneticist can advise whether an exome is enough.",
      "It may produce incidental or uncertain findings, so decide beforehand what you want to be told.",
    ],
  },
  "karyotyping-blood": {
    group: "Exome, genome & chromosome tests",
    aliases: ["Karyotype test", "Karyotyping", "Chromosome analysis", "Chromosome test", "Cytogenetics test"],
    collection: "home",
    whyDone: [
      "Examines the number and overall structure of all 46 chromosomes under the microscope (G-banding).",
      "Detects conditions caused by extra, missing or rearranged chromosomes — such as Down syndrome, Turner syndrome and Klinefelter syndrome.",
      "Identifies balanced chromosome rearrangements in couples with repeated miscarriages.",
    ],
    whoFor: [
      "Couples with recurrent miscarriages or unexplained infertility.",
      "People with delayed puberty, primary amenorrhoea, or suspected Turner or Klinefelter syndrome.",
      "Children with features of a chromosomal condition, and parents of a child with a chromosome rearrangement.",
    ],
    goodToKnow: [
      "It cannot see very small deletions or duplications — a chromosomal microarray or sequencing test covers those.",
      "It needs living blood cells, so the sample must reach the lab promptly after collection.",
      "It takes longer than most blood tests because the cells have to be grown in culture before analysis.",
    ],
  },

  // ── Carrier screening & single-gene tests ───────────────────────────
  "carrier-screening-focused": {
    group: "Carrier screening & thalassemia",
    aliases: ["Carrier screening", "Carrier test", "Genetic carrier screening", "Pre-pregnancy genetic test", "Recessive disease panel"],
    collection: "home",
    whyDone: [
      "Checks whether you carry a changed copy of a gene linked to a serious recessive condition — usually without having any symptoms yourself.",
      "When both partners carry a change in the same gene, each pregnancy has a 1-in-4 chance of a child with that condition.",
      "Lets couples plan ahead — with prenatal testing, PGT or other options — before or early in pregnancy.",
    ],
    whoFor: [
      "Couples planning a pregnancy or in early pregnancy.",
      "Couples who are blood relatives (consanguineous marriage).",
      "People with a family history of a genetic condition.",
    ],
    goodToKnow: [
      "Being a carrier does not mean you are, or will become, unwell.",
      "It is best done for both partners — one partner's result alone cannot give the couple's full picture.",
      "A negative result lowers but does not completely remove the chance of being a carrier, because no panel covers every variant.",
    ],
  },
  "carrier-screening-expanded": {
    group: "Carrier screening & thalassemia",
    aliases: ["Expanded carrier screening", "NGS carrier panel", "500 gene carrier test", "Comprehensive carrier screening"],
    collection: "home",
    whyDone: [
      "Screens 500+ genes by next-generation sequencing for recessive conditions, including SMA and CAH (CYP21A2).",
      "Gives couples the broadest picture of their shared genetic risk before or early in pregnancy.",
      "Supports informed choices such as prenatal testing or PGT when both partners carry the same condition.",
    ],
    whoFor: [
      "Couples planning a pregnancy who want the most comprehensive carrier screen.",
      "Couples who are blood relatives, or who have a family history of a genetic condition.",
      "People who have already had a child with a genetic condition and want to understand the cause.",
    ],
    goodToKnow: [
      "Broader panels find more carriers, so counselling matters — being a carrier is common and usually harmless on its own.",
      "Both partners should ideally be tested to understand the couple's real risk.",
      "No panel can exclude every genetic condition; a negative result lowers risk but does not eliminate it.",
    ],
  },
  "alpha-thalassemia-mutation-analysis": {
    group: "Carrier screening & thalassemia",
    aliases: ["Alpha thalassemia test", "HBA1 HBA2 gene test", "Alpha thal mutation analysis", "Thalassemia carrier test"],
    collection: "home",
    whyDone: [
      "Looks for deletions and mutations in the HBA1 and HBA2 genes that cause alpha thalassemia.",
      "Confirms the cause of unexplained small, pale red cells (microcytic anaemia) when iron levels are normal.",
      "Identifies carriers, so couples understand the risk of severe forms such as HbH disease and Hb Bart's hydrops fetalis.",
    ],
    whoFor: [
      "People with low MCV/MCH on a blood count and normal iron studies.",
      "Couples planning pregnancy where one or both may be carriers, and pregnancies where prenatal diagnosis is planned.",
      "Relatives of someone with alpha thalassemia.",
    ],
    goodToKnow: [
      "Alpha thalassemia carriers are often healthy but may have mild anaemia.",
      "Routine haemoglobin tests such as HPLC often cannot detect alpha thalassemia carriers — gene testing is needed.",
      "If both partners carry alpha thalassemia changes, a baby can be severely affected; counselling before pregnancy helps.",
    ],
  },
  "beta-thalassemia-mutation-analysis": {
    group: "Carrier screening & thalassemia",
    aliases: ["Beta thalassemia test", "HBB gene test", "Thalassemia mutation analysis", "Thalassemia prenatal diagnosis"],
    collection: "home",
    whyDone: [
      "Identifies the exact HBB gene mutation behind beta thalassemia.",
      "Confirms carrier status when a screening test, such as HPLC showing a raised HbA2, suggests it.",
      "Essential for planning prenatal diagnosis or PGT-M when both partners are carriers.",
    ],
    whoFor: [
      "Couples where both partners are thalassemia carriers.",
      "People with an abnormal HPLC or haemoglobin result.",
      "Families with a child who has thalassemia major or intermedia, and pregnant women found to be carriers whose partner needs testing.",
    ],
    goodToKnow: [
      "Beta thalassemia carrier status is common in India, and carriers are usually healthy.",
      "If both parents are carriers, each pregnancy has a 1-in-4 chance of a baby with thalassemia major — prenatal diagnosis is available.",
      "The panel covers the common mutations; rare ones may need extended testing.",
    ],
  },
  "fragile-x-syndrome-testing": {
    group: "Gene panels & single-gene tests",
    aliases: ["Fragile X test", "FMR1 gene test", "Fragile X syndrome test", "CGG repeat test"],
    collection: "home",
    whyDone: [
      "Measures the number of CGG repeats in the FMR1 gene to diagnose Fragile X syndrome — the most common inherited cause of intellectual disability.",
      "Identifies 'premutation' carriers, who can have children with Fragile X and may themselves develop conditions such as FXPOI or FXTAS.",
      "Provides a clear answer for families with developmental delay or autism features.",
    ],
    whoFor: [
      "Children with developmental delay, intellectual disability or autism spectrum features.",
      "Families with a history of Fragile X or unexplained intellectual disability.",
      "Women with premature ovarian insufficiency, and adults with unexplained tremor or ataxia, where a family link is suspected.",
    ],
    goodToKnow: [
      "Fragile X is X-linked: boys are usually more severely affected, though girls can be too.",
      "Premutation carriers are often well in childhood but can pass an expanded gene on to their children.",
      "After a diagnosis, testing relatives (cascade testing) is common and should be guided by a geneticist.",
    ],
  },
  "spinal-muscular-atrophy-testing": {
    group: "Gene panels & single-gene tests",
    aliases: ["SMA test", "SMN1 gene test", "Spinal muscular atrophy test", "SMA carrier test"],
    collection: "home",
    whyDone: [
      "Detects missing copies of the SMN1 gene — the cause of most spinal muscular atrophy.",
      "Confirms the diagnosis in infants and children with muscle weakness, or identifies carriers before pregnancy.",
      "Early diagnosis matters because disease-modifying treatments work best when started early.",
    ],
    whoFor: [
      "Infants and children with floppiness, delayed motor milestones or progressive weakness.",
      "Couples planning a pregnancy, or in early pregnancy (carrier screening).",
      "Families with a history of SMA.",
    ],
    goodToKnow: [
      "SMA is recessive: both parents must be carriers for a child to be affected.",
      "SMN1 copy-number testing cannot find every carrier, so a negative carrier result lowers but does not remove the risk.",
      "A positive result should be discussed promptly with a paediatric neurologist and a geneticist, because treatment is time-sensitive.",
    ],
  },
  "cystic-fibrosis-cftr-testing": {
    group: "Gene panels & single-gene tests",
    aliases: ["Cystic fibrosis test", "CFTR gene test", "CFTR mutation analysis", "Cystic fibrosis carrier test"],
    collection: "home",
    whyDone: [
      "Looks for disease-causing variants in the CFTR gene, which cause cystic fibrosis.",
      "Confirms the diagnosis after an abnormal sweat test or newborn screening result.",
      "Used in couples' carrier screening, and in men with absent vas deferens (CBAVD) and infertility.",
    ],
    whoFor: [
      "People with recurrent chest infections, poor weight gain or fatty stools suggestive of CF.",
      "Men with obstructive azoospermia or congenital absence of the vas deferens.",
      "Couples who are carriers or have a family history of CF, and relatives of someone with CF.",
    ],
    goodToKnow: [
      "The panel tests common variants rather than every possible one, so a normal result reduces but does not rule out carrier status.",
      "Both parents must carry a CFTR variant for a child to be affected.",
      "Cystic fibrosis is less common in India than in some other populations, but it does occur.",
    ],
  },
  "congenital-adrenal-hyperplasia-gene-analysis": {
    group: "Gene panels & single-gene tests",
    aliases: ["CAH gene test", "CYP21A2 gene test", "21-hydroxylase deficiency test", "Congenital adrenal hyperplasia test"],
    collection: "home",
    whyDone: [
      "Analyses the CYP21A2 gene, which causes most cases of congenital adrenal hyperplasia (21-hydroxylase deficiency).",
      "Confirms the diagnosis after an abnormal newborn screen or a raised 17-OHP level.",
      "Allows carrier testing and prenatal planning in affected families.",
    ],
    whoFor: [
      "Babies and children whose doctor suspects CAH — for example with salt-loss episodes or ambiguous genitalia.",
      "Children and adults with raised 17-OHP or suspected non-classic CAH.",
      "Couples with a family history of CAH, or who are known carriers.",
    ],
    goodToKnow: [
      "CYP21A2 sits beside a very similar 'pseudogene', which makes this test technically complex and best interpreted by a genetics specialist.",
      "CAH is recessive: when a child is affected, both parents are carriers.",
      "Early diagnosis and treatment prevent dangerous salt-loss crises.",
    ],
  },
};

export const GENETICS_SLUGS = Object.keys(GENETICS_CONTENT);

export function geneticsContentFor(slug: string): GeneticTestContent | null {
  return GENETICS_CONTENT[slug] ?? null;
}

export type TestContent = GeneticTestContent & { hub: "genetic" | "oncology" };

function hubOf(group: string): "genetic" | "oncology" {
  const g = groupByName(group);
  return g && g.hubs.includes("genetic") ? "genetic" : "oncology";
}

/**
 * Landing-page content for any catalog product that is a genetic or oncology
 * test, or null for a routine test. Hand-written copy (above) wins; every
 * other test falls back to the rule-based knowledge in test-knowledge.ts.
 */
export function contentForProduct(p: { slug: string; name: string; prices?: { testCode: string | null }[] }): TestContent | null {
  const curated = GENETICS_CONTENT[p.slug];
  if (curated) return { ...curated, hub: hubOf(curated.group) };
  const k = knowledgeFor(
    p.name,
    (p.prices ?? []).map((x) => x.testCode ?? "")
  );
  if (!k) return null;
  return {
    group: k.group,
    aliases: k.aliases,
    collection: k.collection,
    whyDone: k.whyDone,
    whoFor: k.whoFor,
    goodToKnow: k.goodToKnow,
    hub: hubOf(k.group),
  };
}
