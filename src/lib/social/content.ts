// Hand-written bilingual (English / Hindi) content for the social-media posters.
//
// Everything here states only widely accepted, textbook-level medical
// information, phrased as general awareness (never as a promise or advice).
// Even so: have your genetic counsellor / doctor read each item once before you
// publish it — and never add statistics without a source, or claims such as
// "100% accurate", "best", or "guaranteed" (ASCI's rules treat those as
// misleading for healthcare advertising).

export type Bi = { en: string; hi: string };

// ── Interface labels used inside posters ─────────────────────────────────
export const UI = {
  startingPrice: { en: "Starting price", hi: "शुरुआती कीमत" },
  from: { en: "from", hi: "से शुरू" },
  sample: { en: "Sample", hi: "सैंपल" },
  report: { en: "Report", hi: "रिपोर्ट" },
  homeCollection: { en: "Home sample collection", hi: "घर बैठे सैंपल कलेक्शन" },
  arranged: { en: "Sample collection arranged by our team", hi: "सैंपल की व्यवस्था हमारी टीम करेगी" },
  bookWhatsApp: { en: "Book on WhatsApp", hi: "WhatsApp पर बुक करें" },
  askWhatsApp: { en: "Ask on WhatsApp", hi: "WhatsApp पर पूछें" },
  scan: { en: "Scan to book", hi: "बुक करने के लिए स्कैन करें" },
  whoFor: { en: "Who may be advised this test?", hi: "यह जाँच किनके लिए?" },
  why: { en: "Why is this test done?", hi: "यह जाँच क्यों की जाती है?" },
  faq: { en: "Quick answers", hi: "ज़रूरी बातें" },
  qCost: { en: "How much?", hi: "कितना खर्च?" },
  qReport: { en: "When is the report?", hi: "रिपोर्ट कब?" },
  qSample: { en: "Sample needed", hi: "कौन-सा सैंपल?" },
  qFast: { en: "Fasting?", hi: "खाली पेट?" },
  fastYes: { en: "Required", hi: "ज़रूरी" },
  fastNo: { en: "Not required", hi: "ज़रूरी नहीं" },
  myth: { en: "MYTH", hi: "मिथक" },
  fact: { en: "FACT", hi: "सच्चाई" },
  mythVsFact: { en: "Myth vs Fact", hi: "मिथक बनाम सच्चाई" },
  didYouKnow: { en: "Did you know?", hi: "क्या आप जानते हैं?" },
  disclaimer: {
    en: "General information, not medical advice. Please consult your doctor.",
    hi: "यह सामान्य जानकारी है, चिकित्सकीय सलाह नहीं। कृपया अपने डॉक्टर से परामर्श करें।",
  },
  cities: { en: "Jammu · Mumbai", hi: "जम्मू · मुंबई" },
  perVisit: { en: "₹49 per visit", hi: "₹49 प्रति विज़िट" },
  homeTitle: { en: "Sample collection at home", hi: "सैंपल कलेक्शन अब घर बैठे" },
  homeSub: { en: "Genetic and diagnostic tests — without the queue.", hi: "जेनेटिक व डायग्नोस्टिक जाँच — बिना लाइन में लगे।" },
  step1: { en: "Book on WhatsApp or our website", hi: "WhatsApp या वेबसाइट पर बुक करें" },
  step2: { en: "A trained collector visits your home", hi: "प्रशिक्षित सैंपल कलेक्टर आपके घर आएगा" },
  step3: { en: "Get your report online", hi: "रिपोर्ट ऑनलाइन पाएँ" },
  newCustomer: { en: "New customers", hi: "नए ग्राहकों के लिए" },
  couponCode: { en: "Code", hi: "कोड" },
  doctorsTitle: { en: "For doctors & clinics", hi: "डॉक्टरों व क्लिनिक के लिए" },
  talkToUs: { en: "Talk to a genetic counselling expert", hi: "जेनेटिक काउंसलिंग के लिए बात करें" },
  timelineTitle: { en: "Pregnancy screening: when, and which?", hi: "गर्भावस्था में जाँच: कब, कौन-सी?" },
  timelineNote: {
    en: "Which test is right depends on your pregnancy — ask your doctor.",
    hi: "कौन-सी जाँच सही है, यह आपकी गर्भावस्था पर निर्भर है — अपने डॉक्टर से पूछें।",
  },
  oneStop: { en: "One stop for every genetic test in Jammu", hi: "जम्मू में हर जेनेटिक जाँच, एक ही जगह" },
} satisfies Record<string, Bi>;

// ── Test-group names in Hindi (for the eyebrow label on posters) ─────────
export const GROUP_HI: Record<string, string> = {
  "Pregnancy screening": "गर्भावस्था स्क्रीनिंग",
  "Prenatal diagnosis & IVF": "प्रीनेटल डायग्नोसिस व आईवीएफ",
  "Pregnancy loss & fertility genetics": "गर्भपात व प्रजनन आनुवंशिकी",
  "Newborn & child health": "नवजात व बाल स्वास्थ्य",
  "Exome, genome & chromosome tests": "एक्सोम, जीनोम व क्रोमोसोम जाँच",
  "Gene panels & single-gene tests": "जीन पैनल व सिंगल-जीन जाँच",
  "Carrier screening & thalassemia": "कैरियर स्क्रीनिंग व थैलेसीमिया",
  "Hereditary cancer": "वंशानुगत कैंसर",
  Leukemia: "ल्यूकेमिया",
  Lymphoma: "लिम्फोमा",
  "Multiple myeloma": "मल्टीपल मायलोमा",
  "MDS & myeloproliferative neoplasms": "एमडीएस व एमपीएन",
  "Lung cancer": "फेफड़ों का कैंसर",
  "Breast & ovarian cancer": "स्तन व अंडाशय कैंसर",
  "Colorectal & GI cancer": "कोलोरेक्टल व जीआई कैंसर",
  "Brain, thyroid & other solid tumors": "मस्तिष्क, थायरॉइड व अन्य ठोस ट्यूमर",
  "Sarcoma & childhood tumors": "सार्कोमा व बाल ट्यूमर",
  "Comprehensive tumor profiling": "व्यापक ट्यूमर प्रोफाइलिंग",
  "Pathology, cytology & IHC": "पैथोलॉजी, साइटोलॉजी व IHC",
  "Tumor markers": "ट्यूमर मार्कर",
  "Cytogenetics & flow cytometry": "साइटोजेनेटिक्स व फ्लो साइटोमेट्री",
  "Stem cell transplant monitoring": "स्टेम सेल ट्रांसप्लांट निगरानी",
};

// ── Hindi descriptions for the main tests ────────────────────────────────
export type HiTest = { name: string; tagline: string; who?: string[]; why?: string[] };

export const HI_TESTS: Record<string, HiTest> = {
  "nipt-non-invasive-prenatal-testing": {
    name: "NIPT (नॉन-इनवेसिव प्रीनेटल टेस्ट)",
    tagline: "माँ के खून के सैंपल से डाउन सिंड्रोम जैसी क्रोमोसोम संबंधी स्थितियों का जोखिम जानने की जाँच — गर्भ को कोई खतरा नहीं।",
    who: [
      "लगभग 10 सप्ताह के बाद की गर्भवती महिलाएँ जो अधिक सटीक और सुरक्षित स्क्रीनिंग चाहती हैं।",
      "जिनका डबल/ट्रिपल मार्कर या अल्ट्रासाउंड में जोखिम ज़्यादा आया हो।",
      "35 वर्ष या उससे अधिक उम्र की माताएँ, या पहले किसी गर्भ में क्रोमोसोम संबंधी समस्या रही हो।",
      "आईवीएफ से हुई गर्भावस्था।",
    ],
    why: [
      "डाउन सिंड्रोम (ट्राइसोमी 21), एडवर्ड्स (18) और पटाऊ (13) सिंड्रोम का जोखिम बताती है।",
      "मार्कर टेस्ट के मुकाबले अधिक सटीक, और गर्भ को कोई जोखिम नहीं।",
      "यह स्क्रीनिंग है, पक्की जाँच नहीं — ज़्यादा जोखिम आने पर डॉक्टर अगली जाँच बताएँगे।",
    ],
  },
  "nipt-expanded-microdeletions": {
    name: "विस्तृत NIPT (सभी क्रोमोसोम + माइक्रोडिलीशन)",
    tagline: "एक ही ब्लड सैंपल से सभी क्रोमोसोम और सामान्य माइक्रोडिलीशन सिंड्रोम की स्क्रीनिंग।",
  },
  "double-marker-test": {
    name: "डबल मार्कर टेस्ट",
    tagline: "गर्भावस्था के पहले तिमाही (11 से 13 सप्ताह 6 दिन) में खून की जाँच, जो डाउन सिंड्रोम व एडवर्ड्स सिंड्रोम का जोखिम बताती है।",
    who: [
      "11 सप्ताह से 13 सप्ताह 6 दिन की गर्भवती महिलाएँ।",
      "जो NT स्कैन के साथ पहले तिमाही का जोखिम आकलन चाहती हों।",
      "जो कम खर्च वाली स्क्रीनिंग पसंद करती हों।",
    ],
    why: [
      "दो मार्कर (फ्री β-hCG और PAPP-A) और NT स्कैन से जोखिम का अनुमान।",
      "यह निदान नहीं, केवल जोखिम का आकलन है।",
      "ज़्यादा जोखिम आने पर NIPT या पक्की जाँच की सलाह दी जा सकती है।",
    ],
  },
  "triple-marker-test": {
    name: "ट्रिपल मार्कर टेस्ट",
    tagline: "दूसरे तिमाही (15–20 सप्ताह) की खून की जाँच — डाउन सिंड्रोम, एडवर्ड्स सिंड्रोम और न्यूरल ट्यूब दोष के जोखिम के लिए।",
  },
  "quadruple-marker-test": {
    name: "क्वाड्रपल मार्कर टेस्ट",
    tagline: "चार मार्कर (AFP, hCG, एस्ट्रिऑल, इन्हिबिन-A) से दूसरे तिमाही में जोखिम का आकलन।",
  },
  "newborn-screening-panel": {
    name: "नवजात स्क्रीनिंग पैनल",
    tagline: "बच्चे की एड़ी से खून की कुछ बूँदें लेकर जन्मजात थायरॉइड, CAH, G6PD, गैलेक्टोसीमिया, PKU जैसी इलाज-योग्य स्थितियों की शुरुआती जाँच।",
  },
  "g6pd-deficiency-screening": {
    name: "G6PD जाँच",
    tagline: "लाल रक्त कोशिकाओं की रक्षा करने वाले एंजाइम G6PD की कमी की जाँच।",
  },
  "whole-exome-sequencing": {
    name: "होल एक्सोम सीक्वेंसिंग (WES)",
    tagline: "लगभग 20,000 जीन के प्रोटीन-कोडिंग हिस्से को एक साथ पढ़ने वाली जाँच — जब किसी बच्चे या व्यक्ति में अनजान आनुवंशिक रोग का शक हो।",
  },
  "clinical-exome-sequencing": {
    name: "क्लिनिकल एक्सोम सीक्वेंसिंग",
    tagline: "रोगों से जुड़े लगभग 5,000 जीन की जाँच — पूरे एक्सोम की तुलना में आमतौर पर अधिक किफ़ायती।",
  },
  "brca1-brca2-gene-analysis": {
    name: "BRCA1 व BRCA2 जीन जाँच",
    tagline: "स्तन व अंडाशय (और कुछ अन्य) कैंसर का जोखिम बढ़ाने वाले जीन बदलावों की जाँच।",
    who: [
      "कम उम्र में स्तन कैंसर, ट्रिपल-नेगेटिव स्तन कैंसर या अंडाशय कैंसर वाले मरीज़।",
      "परिवार में स्तन, अंडाशय, प्रोस्टेट या पैंक्रियास के कई कैंसर।",
      "जिनके किसी रिश्तेदार में BRCA बदलाव मिला हो।",
    ],
    why: [
      "यह बताती है कि परिवार में कैंसर का संबंध किसी वंशानुगत जीन बदलाव से है या नहीं।",
      "स्क्रीनिंग, बचाव और इलाज के फ़ैसलों में मदद मिल सकती है।",
      "पॉज़िटिव नतीजा आने पर रिश्तेदार भी जाँच करा सकते हैं।",
    ],
  },
  "hereditary-cancer-gene-panel": {
    name: "वंशानुगत कैंसर जीन पैनल",
    tagline: "एक ही जाँच में 30 से अधिक वंशानुगत कैंसर-जोखिम जीन (BRCA1 व BRCA2 सहित)।",
  },
  "carrier-screening-expanded": {
    name: "एक्सपेंडेड कैरियर स्क्रीनिंग",
    tagline: "गर्भधारण से पहले (या शुरुआत में) जाँच कि कहीं आप किसी आनुवंशिक रोग के वाहक तो नहीं।",
  },
  "carrier-screening-focused": {
    name: "कैरियर स्क्रीनिंग (फोकस्ड पैनल)",
    tagline: "लगभग 100 जीन की जाँच — गंभीर रिसेसिव आनुवंशिक रोगों के वाहक होने का पता लगाने के लिए।",
  },
  "beta-thalassemia-mutation-analysis": {
    name: "बीटा थैलेसीमिया म्यूटेशन जाँच",
    tagline: "HPLC में गड़बड़ी आने या दोनों साथी वाहक होने पर सटीक जीन बदलाव की पहचान।",
  },
  "alpha-thalassemia-mutation-analysis": {
    name: "अल्फा थैलेसीमिया म्यूटेशन जाँच",
    tagline: "HBA1 व HBA2 जीन में बदलाव की जाँच — आयरन सामान्य होने पर भी छोटे लाल रक्त कण (माइक्रोसाइटिक एनीमिया) का कारण जानने के लिए।",
  },
  "karyotyping-blood": {
    name: "कैरियोटाइपिंग (क्रोमोसोम जाँच)",
    tagline: "सभी 46 क्रोमोसोम की संख्या और बनावट की जाँच — बार-बार गर्भपात या बांझपन में उपयोगी।",
  },
  "spinal-muscular-atrophy-testing": {
    name: "स्पाइनल मस्कुलर एट्रोफी (SMA) जाँच",
    tagline: "SMN1 जीन की जाँच — बच्चों में मांसपेशियों की कमज़ोरी के कारण का पता लगाने या वाहक की पहचान के लिए।",
  },
  "fragile-x-syndrome-testing": {
    name: "फ्रैजाइल-X सिंड्रोम जाँच",
    tagline: "FMR1 जीन की जाँच — बौद्धिक विकास में देरी या ऑटिज़्म के लक्षणों के कारण का पता लगाने के लिए।",
  },
};

// ── Myth vs Fact ─────────────────────────────────────────────────────────
export type Myth = { id: string; topic: Bi; myth: Bi; fact: Bi; slug?: string };

export const MYTHS: Myth[] = [
  {
    id: "nipt-screening",
    slug: "nipt-non-invasive-prenatal-testing",
    topic: { en: "NIPT", hi: "NIPT" },
    myth: { en: "NIPT can diagnose Down syndrome for sure.", hi: "NIPT से डाउन सिंड्रोम की पक्की पुष्टि हो जाती है।" },
    fact: {
      en: "NIPT is a screening test. A high-risk result is confirmed with a diagnostic test such as amniocentesis.",
      hi: "NIPT एक स्क्रीनिंग टेस्ट है। ज़्यादा जोखिम आने पर एमनियोसेंटेसिस जैसी पक्की जाँच से पुष्टि की जाती है।",
    },
  },
  {
    id: "nipt-safe",
    slug: "nipt-non-invasive-prenatal-testing",
    topic: { en: "NIPT safety", hi: "NIPT की सुरक्षा" },
    myth: { en: "NIPT is risky for the baby.", hi: "NIPT से बच्चे को खतरा हो सकता है।" },
    fact: {
      en: "NIPT needs only a blood sample from the mother. It carries no risk to the pregnancy.",
      hi: "NIPT में सिर्फ़ माँ का ब्लड सैंपल लिया जाता है। इससे गर्भ को कोई खतरा नहीं होता।",
    },
  },
  {
    id: "double-marker-risk",
    slug: "double-marker-test",
    topic: { en: "Double marker", hi: "डबल मार्कर" },
    myth: { en: "A high-risk double marker result means the baby has Down syndrome.", hi: "डबल मार्कर में हाई-रिस्क आने का मतलब है कि बच्चे को डाउन सिंड्रोम है।" },
    fact: {
      en: "It means the chance is higher — not that the baby is affected. Your doctor will advise on NIPT or a diagnostic test.",
      hi: "इसका मतलब सिर्फ़ जोखिम ज़्यादा है, बच्चा प्रभावित है यह नहीं। डॉक्टर NIPT या पक्की जाँच की सलाह देंगे।",
    },
  },
  {
    id: "carrier-history",
    slug: "carrier-screening-expanded",
    topic: { en: "Carrier screening", hi: "कैरियर स्क्रीनिंग" },
    myth: { en: "If nobody in my family has a genetic condition, I can't be a carrier.", hi: "हमारे परिवार में किसी को बीमारी नहीं है, तो हम वाहक (कैरियर) नहीं हो सकते।" },
    fact: {
      en: "Most carriers have no symptoms and no family history. Carrier screening checks this before or early in pregnancy.",
      hi: "ज़्यादातर वाहकों में न लक्षण होते हैं, न परिवार में इतिहास। कैरियर स्क्रीनिंग से गर्भधारण से पहले या शुरुआत में यह पता चल सकता है।",
    },
  },
  {
    id: "thal-carrier",
    slug: "beta-thalassemia-mutation-analysis",
    topic: { en: "Thalassemia", hi: "थैलेसीमिया" },
    myth: { en: "A thalassemia carrier will fall sick.", hi: "थैलेसीमिया वाहक व्यक्ति बीमार पड़ेगा।" },
    fact: {
      en: "Carriers are usually healthy. The concern is when both parents are carriers — each pregnancy then has a 1 in 4 chance of an affected child.",
      hi: "वाहक आमतौर पर स्वस्थ रहते हैं। चिंता तब होती है जब दोनों माता-पिता वाहक हों — तब हर गर्भ में बच्चे के प्रभावित होने की संभावना 4 में से 1 होती है।",
    },
  },
  {
    id: "newborn",
    slug: "newborn-screening-panel",
    topic: { en: "Newborn screening", hi: "नवजात स्क्रीनिंग" },
    myth: { en: "My baby looks healthy, so screening isn't needed.", hi: "बच्चा स्वस्थ दिख रहा है, तो स्क्रीनिंग की ज़रूरत नहीं।" },
    fact: {
      en: "Many treatable conditions show no signs at birth. A few drops of blood can find them early.",
      hi: "कई इलाज-योग्य स्थितियाँ जन्म के समय दिखाई नहीं देतीं। खून की कुछ बूँदों से इनका जल्दी पता चल सकता है।",
    },
  },
  {
    id: "cancer-genes",
    slug: "brca1-brca2-gene-analysis",
    topic: { en: "Cancer genes", hi: "कैंसर जीन" },
    myth: { en: "Genetic testing for cancer is only for people who already have cancer.", hi: "कैंसर की जेनेटिक जाँच सिर्फ़ उन्हीं के लिए है जिन्हें कैंसर हो चुका है।" },
    fact: {
      en: "It can also be advised for healthy people with a strong family history. A doctor or genetic counsellor can say who should be tested.",
      hi: "परिवार में कैंसर का मज़बूत इतिहास होने पर स्वस्थ लोगों को भी यह सलाह दी जा सकती है। किसे करवानी चाहिए, यह डॉक्टर या काउंसलर बता सकते हैं।",
    },
  },
  {
    id: "exome-answer",
    slug: "whole-exome-sequencing",
    topic: { en: "Exome sequencing", hi: "एक्सोम सीक्वेंसिंग" },
    myth: { en: "A genetic test always gives a clear answer.", hi: "जेनेटिक जाँच से हर बार साफ़ जवाब मिलता है।" },
    fact: {
      en: "A cause is found in only some people, and some results are uncertain. Counselling helps you understand what a result means.",
      hi: "सिर्फ़ कुछ मामलों में कारण मिल पाता है और कुछ नतीजे अनिश्चित होते हैं। काउंसलिंग से रिपोर्ट का मतलब समझने में मदद मिलती है।",
    },
  },
  {
    id: "counselling-decide",
    topic: { en: "Genetic counselling", hi: "जेनेटिक काउंसलिंग" },
    myth: { en: "A genetic counsellor tells you what to decide.", hi: "जेनेटिक काउंसलर बताता है कि आपको क्या फ़ैसला लेना है।" },
    fact: {
      en: "Counselling gives you clear information and support. The decision always stays with you and your family.",
      hi: "काउंसलिंग में आपको साफ़ जानकारी और सहारा मिलता है। फ़ैसला हमेशा आपका और आपके परिवार का होता है।",
    },
  },
];

// ── "Did you know?" facts ────────────────────────────────────────────────
export type Fact = { id: string; text: Bi; slug?: string };

export const FACTS: Fact[] = [
  { id: "nipt-weeks", slug: "nipt-non-invasive-prenatal-testing", text: { en: "NIPT can be done from about 10 weeks of pregnancy.", hi: "NIPT गर्भावस्था के लगभग 10 सप्ताह से कराई जा सकती है।" } },
  { id: "dm-window", slug: "double-marker-test", text: { en: "The double marker test is done between 11 weeks and 13 weeks 6 days of pregnancy.", hi: "डबल मार्कर टेस्ट गर्भावस्था के 11 सप्ताह से 13 सप्ताह 6 दिन के बीच किया जाता है।" } },
  { id: "recessive", slug: "carrier-screening-expanded", text: { en: "For a recessive condition, a child is affected only when both parents carry a change in the same gene — a 1 in 4 chance in each pregnancy.", hi: "रिसेसिव आनुवंशिक रोग में बच्चा तभी प्रभावित होता है जब दोनों माता-पिता उसी जीन में बदलाव के वाहक हों — हर गर्भ में 4 में से 1 संभावना।" } },
  { id: "newborn-drops", slug: "newborn-screening-panel", text: { en: "Newborn screening needs only a few drops of blood, usually taken in the first days of life.", hi: "नवजात स्क्रीनिंग में सिर्फ़ खून की कुछ बूँदें लगती हैं, जो आमतौर पर जन्म के शुरुआती दिनों में ली जाती हैं।" } },
  { id: "thal-common", slug: "beta-thalassemia-mutation-analysis", text: { en: "Thalassemia carriers are not rare in India — a simple blood test (HPLC) can check for it.", hi: "भारत में थैलेसीमिया के वाहक कम नहीं हैं — एक साधारण ब्लड टेस्ट (HPLC) से जाँच हो सकती है।" } },
  { id: "screen-vs-dx", text: { en: "A screening test estimates a chance. A diagnostic test confirms.", hi: "स्क्रीनिंग जाँच सिर्फ़ संभावना बताती है, डायग्नोस्टिक जाँच पुष्टि करती है।" } },
  { id: "exome-1pct", slug: "whole-exome-sequencing", text: { en: "Whole exome sequencing reads the protein-coding part of your genes — about 1–2% of your DNA.", hi: "होल एक्सोम सीक्वेंसिंग जीन के प्रोटीन बनाने वाले हिस्से को पढ़ती है — आपके DNA का लगभग 1–2%।" } },
  { id: "cancer-family", slug: "brca1-brca2-gene-analysis", text: { en: "Several cancers in close relatives, or cancer at a young age, are reasons to ask a doctor about genetic testing.", hi: "करीबी रिश्तेदारों में कई कैंसर, या कम उम्र में कैंसर — ऐसे में जेनेटिक जाँच के बारे में डॉक्टर से पूछना चाहिए।" } },
  { id: "karyotype-46", slug: "karyotyping-blood", text: { en: "A karyotype looks at the number and structure of all 46 chromosomes.", hi: "कैरियोटाइप में सभी 46 क्रोमोसोम की संख्या और बनावट देखी जाती है।" } },
  { id: "folic", text: { en: "Folic acid taken before and in early pregnancy helps prevent neural tube defects — ask your doctor about the right dose.", hi: "गर्भधारण से पहले और शुरुआती गर्भावस्था में फोलिक एसिड लेने से न्यूरल ट्यूब दोष का जोखिम घटता है — सही मात्रा के लिए डॉक्टर से पूछें।" } },
  { id: "family-matters", text: { en: "A genetic result can matter for the whole family, not just one person.", hi: "किसी एक व्यक्ति की जेनेटिक रिपोर्ट पूरे परिवार के लिए मायने रख सकती है।" } },
];

// ── Pregnancy screening timeline ─────────────────────────────────────────
export const TIMELINE: { when: Bi; what: Bi }[] = [
  { when: { en: "From about 10 weeks", hi: "लगभग 10 सप्ताह से" }, what: { en: "NIPT — blood test (screening)", hi: "NIPT — माँ के खून की जाँच (स्क्रीनिंग)" } },
  { when: { en: "11 weeks to 13 weeks 6 days", hi: "11 सप्ताह से 13 सप्ताह 6 दिन" }, what: { en: "Double Marker test + NT scan", hi: "डबल मार्कर टेस्ट + NT स्कैन" } },
  { when: { en: "15 to 20 weeks", hi: "15 से 20 सप्ताह" }, what: { en: "Triple / Quadruple Marker test", hi: "ट्रिपल / क्वाड्रपल मार्कर टेस्ट" } },
  { when: { en: "18 to 22 weeks", hi: "18 से 22 सप्ताह" }, what: { en: "Detailed (Level II) ultrasound — as advised by your doctor", hi: "विस्तृत (लेवल-II) अल्ट्रासाउंड — डॉक्टर की सलाह से" } },
];

export function hiTat(hours: number) {
  if (hours < 24) return `${hours} घंटे`;
  return `${Math.round(hours / 24)} दिन`;
}

const SAMPLE_HI: Record<string, string> = {
  Blood: "ब्लड सैंपल",
  "Blood (maternal)": "माँ का ब्लड सैंपल",
  "Blood (Maternal)": "माँ का ब्लड सैंपल",
  "Blood / Saliva": "ब्लड / लार",
  "Blood (Heel Prick)": "ब्लड (एड़ी से)",
  "Blood (EDTA)": "ब्लड सैंपल",
  "Blood (serum)": "ब्लड (सीरम)",
  "Dried blood spot / Blood": "ब्लड (ड्राई ब्लड स्पॉट)",
  "Embryo Biopsy": "भ्रूण बायोप्सी",
  "Amniotic Fluid / CVS": "एम्नियोटिक फ्लूइड / CVS",
};
export function hiSample(sample: string) {
  return SAMPLE_HI[sample] ?? sample;
}
