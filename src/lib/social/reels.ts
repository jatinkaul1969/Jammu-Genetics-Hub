// Short-video scripts (30–45 seconds) for Instagram Reels / YouTube Shorts /
// WhatsApp status. Doctor- or counsellor-led, to-camera videos in plain Hindi or
// Hinglish are the format Indian health audiences respond to most — so each
// script is written to be *spoken*, in short sentences, by a real person.
//
// Rules for filming:
//  • the person on camera should be the counsellor / doctor who actually does
//    this work — and should read the script once and fix anything they would
//    not say or that isn't accurate;
//  • no guarantees, no "best/cheapest", no fear;
//  • show the website/WhatsApp at the end card, say the phone number once.

export type ReelScript = {
  id: string;
  title: string;
  seconds: string;
  hook: { en: string; hi: string };
  beats: { en: string; hi: string }[];
  cta: { en: string; hi: string };
  onScreen: string;
  broll: string;
};

const CTA = {
  en: "Questions? Message us on WhatsApp — the number is on screen. Always speak to your doctor about what's right for you.",
  hi: "सवाल हैं? WhatsApp पर हमें लिखें — नंबर स्क्रीन पर है। आपके लिए क्या सही है, यह अपने डॉक्टर से ज़रूर पूछें।",
};

export const REEL_SCRIPTS: ReelScript[] = [
  {
    id: "nipt-vs-dm",
    title: "NIPT vs Double Marker — what's the difference?",
    seconds: "40",
    hook: { en: "NIPT and double marker sound similar. They're not the same test.", hi: "NIPT और डबल मार्कर सुनने में एक जैसे लगते हैं, पर एक ही जाँच नहीं हैं।" },
    beats: [
      { en: "Double marker is a blood test done at 11 to 13 weeks, usually with an NT scan. It estimates the chance of Down syndrome.", hi: "डबल मार्कर 11 से 13 सप्ताह में होने वाली खून की जाँच है, आमतौर पर NT स्कैन के साथ। यह डाउन सिंड्रोम की संभावना का अनुमान देती है।" },
      { en: "NIPT can be done from about 10 weeks. It reads baby's DNA fragments in the mother's blood and is more accurate as a screening test.", hi: "NIPT लगभग 10 सप्ताह से हो सकती है। यह माँ के खून में बच्चे के DNA के टुकड़े पढ़ती है और स्क्रीनिंग के तौर पर ज़्यादा सटीक है।" },
      { en: "Both are screening tests. If the result shows higher risk, your doctor may advise a diagnostic test like amniocentesis.", hi: "दोनों स्क्रीनिंग टेस्ट हैं। ज़्यादा जोखिम आए तो डॉक्टर एमनियोसेंटेसिस जैसी पक्की जाँच की सलाह दे सकते हैं।" },
    ],
    cta: CTA,
    onScreen: "NIPT vs Double Marker · 10 wks vs 11–13 wks · Both = screening",
    broll: "Counsellor to camera; simple two-column graphic; calendar of weeks.",
  },
  {
    id: "carrier",
    title: "What is carrier screening?",
    seconds: "35",
    hook: { en: "You can carry a genetic condition and never know it.", hi: "आप किसी आनुवंशिक रोग के वाहक हो सकते हैं और आपको पता भी न चले।" },
    beats: [
      { en: "A carrier usually has no symptoms and often no family history.", hi: "वाहक में आमतौर पर कोई लक्षण नहीं होते और अक्सर परिवार में इतिहास भी नहीं होता।" },
      { en: "If both partners carry a change in the same gene, each pregnancy has a 1 in 4 chance of an affected child.", hi: "अगर दोनों साथी एक ही जीन में बदलाव के वाहक हों, तो हर गर्भ में बच्चे के प्रभावित होने की संभावना 4 में से 1 होती है।" },
      { en: "Carrier screening checks this before — or early in — pregnancy, so families can plan with information.", hi: "कैरियर स्क्रीनिंग गर्भधारण से पहले या शुरुआत में यह जाँच लेती है, ताकि परिवार जानकारी के साथ योजना बना सके।" },
    ],
    cta: CTA,
    onScreen: "Carrier = usually healthy · Both carriers = 1 in 4 · Test before pregnancy",
    broll: "Couple graphic with two gene copies; simple 1-in-4 diagram.",
  },
  {
    id: "thal",
    title: "Thalassemia: carriers and the 1-in-4 chance",
    seconds: "35",
    hook: { en: "A thalassemia carrier is usually healthy. So why does screening matter?", hi: "थैलेसीमिया का वाहक आमतौर पर स्वस्थ होता है। तो जाँच क्यों ज़रूरी है?" },
    beats: [
      { en: "A simple blood test called HPLC can show if someone is a carrier.", hi: "HPLC नाम की एक साधारण ब्लड टेस्ट से पता चल सकता है कि कोई वाहक है या नहीं।" },
      { en: "If both parents are carriers, each pregnancy has a 1 in 4 chance of thalassemia major.", hi: "अगर दोनों माता-पिता वाहक हों, तो हर गर्भ में थैलेसीमिया मेजर की संभावना 4 में से 1 होती है।" },
      { en: "Knowing early lets families talk to a counsellor and a doctor about their options.", hi: "पहले से पता हो तो परिवार काउंसलर और डॉक्टर से अपने विकल्पों पर बात कर सकता है।" },
    ],
    cta: CTA,
    onScreen: "HPLC · Carrier ≠ patient · Both carriers = 1 in 4",
    broll: "Close-up of the blood-collection kit (no faces); counsellor to camera.",
  },
  {
    id: "newborn",
    title: "Newborn screening in 30 seconds",
    seconds: "30",
    hook: { en: "A few drops of blood in the first days of life can protect a baby's future.", hi: "जन्म के शुरुआती दिनों में खून की कुछ बूँदें बच्चे के भविष्य को सुरक्षित कर सकती हैं।" },
    beats: [
      { en: "Newborn screening looks for treatable conditions that may show no signs at birth — for example congenital hypothyroidism and G6PD deficiency.", hi: "नवजात स्क्रीनिंग उन इलाज-योग्य स्थितियों की जाँच करती है जो जन्म पर दिखाई नहीं देतीं — जैसे जन्मजात थायरॉइड और G6PD की कमी।" },
      { en: "It's done from a tiny heel-prick sample, ideally in the first days of life.", hi: "यह एड़ी से लिए गए बहुत छोटे सैंपल से होती है, आदर्श रूप से जन्म के शुरुआती दिनों में।" },
      { en: "Finding these conditions early means treatment can start early.", hi: "इन्हें जल्दी पकड़ने का मतलब है कि इलाज भी जल्दी शुरू हो सकता है।" },
    ],
    cta: CTA,
    onScreen: "Few drops of blood · Early days · Treatable conditions",
    broll: "Gentle hands-only shot of a heel prick (with consent); counsellor to camera.",
  },
  {
    id: "brca",
    title: "Cancer in the family — is genetic testing for you?",
    seconds: "40",
    hook: { en: "Several cancers in one family can be a clue — not a sentence.", hi: "एक ही परिवार में कई कैंसर एक संकेत हो सकते हैं — फ़ैसला नहीं।" },
    beats: [
      { en: "Some cancers run in families because of changes in genes like BRCA1 and BRCA2.", hi: "कुछ कैंसर BRCA1 और BRCA2 जैसे जीन में बदलाव की वजह से परिवारों में चलते हैं।" },
      { en: "Cancer at a young age, or several close relatives with breast, ovarian or related cancers, are reasons to ask a doctor about testing.", hi: "कम उम्र में कैंसर, या करीबी रिश्तेदारों में स्तन, अंडाशय जैसे कई कैंसर — ऐसे में जाँच के बारे में डॉक्टर से पूछना चाहिए।" },
      { en: "Testing is best done with counselling before and after, because the result matters for the whole family.", hi: "जाँच से पहले और बाद में काउंसलिंग के साथ करवाना सबसे अच्छा है, क्योंकि नतीजा पूरे परिवार के लिए मायने रखता है।" },
    ],
    cta: CTA,
    onScreen: "BRCA1 · BRCA2 · Family history · Counselling first",
    broll: "Counsellor to camera; family-tree graphic.",
  },
  {
    id: "exome",
    title: "What is whole exome sequencing?",
    seconds: "40",
    hook: { en: "Sometimes a child has symptoms and no one can find the cause. This test can help look.", hi: "कभी-कभी बच्चे में लक्षण होते हैं और कारण नहीं मिलता। यह जाँच खोजने में मदद कर सकती है।" },
    beats: [
      { en: "Exome sequencing reads the protein-coding part of your genes — about 1 to 2 percent of your DNA — in one test.", hi: "एक्सोम सीक्वेंसिंग एक ही जाँच में जीन के प्रोटीन बनाने वाले हिस्से को पढ़ती है — आपके DNA का लगभग 1 से 2 प्रतिशत।" },
      { en: "A cause is found in only some people, so a 'no answer' result does not rule out a genetic condition.", hi: "सिर्फ़ कुछ लोगों में कारण मिलता है, इसलिए 'जवाब नहीं मिला' का मतलब यह नहीं कि आनुवंशिक रोग नहीं है।" },
      { en: "That's why counselling before and after the test is so important.", hi: "इसीलिए जाँच से पहले और बाद में काउंसलिंग बहुत ज़रूरी है।" },
    ],
    cta: CTA,
    onScreen: "Exome = 1–2% of DNA · Not always a clear answer · Counselling matters",
    broll: "DNA helix animation (we have the style in our posters); counsellor to camera.",
  },
  {
    id: "home",
    title: "How home sample collection works",
    seconds: "30",
    hook: { en: "Get your test done without leaving home. Here's how it works.", hi: "घर से निकले बिना जाँच करवाएँ। यह ऐसे काम करता है।" },
    beats: [
      { en: "Book on WhatsApp or our website and choose a time slot.", hi: "WhatsApp या वेबसाइट पर बुक करें और समय चुनें।" },
      { en: "A trained collector comes to your home and takes the sample.", hi: "प्रशिक्षित सैंपल कलेक्टर आपके घर आकर सैंपल लेगा।" },
      { en: "Your report comes online — and our team is there if you want it explained.", hi: "रिपोर्ट ऑनलाइन आएगी — और चाहें तो हमारी टीम उसे समझाने के लिए मौजूद है।" },
    ],
    cta: CTA,
    onScreen: "Book · Collector visits · Report online",
    broll: "Collector at the door (with consent), kit, phone showing the report.",
  },
  {
    id: "counsellor",
    title: "What does a genetic counsellor actually do?",
    seconds: "35",
    hook: { en: "A genetic counsellor does not tell you what to decide. Here's what they do.", hi: "जेनेटिक काउंसलर आपको यह नहीं बताता कि क्या फ़ैसला लेना है। वह यह करता है।" },
    beats: [
      { en: "They help you decide whether a test is useful, and which one.", hi: "वे बताते हैं कि कोई जाँच काम की है या नहीं, और कौन-सी।" },
      { en: "After the test, they explain what the result does and does not mean — in plain language.", hi: "जाँच के बाद वे सरल भाषा में समझाते हैं कि नतीजे का क्या मतलब है और क्या नहीं।" },
      { en: "The decision always stays with you and your family.", hi: "फ़ैसला हमेशा आपका और आपके परिवार का रहता है।" },
    ],
    cta: CTA,
    onScreen: "Information · Support · Your decision",
    broll: "Counsellor in the counselling room; calm, warm lighting.",
  },
  {
    id: "questions-doctor",
    title: "3 questions to ask your doctor before NIPT",
    seconds: "35",
    hook: { en: "Before you book any prenatal test, ask your doctor these three questions.", hi: "कोई भी प्रीनेटल जाँच बुक करने से पहले अपने डॉक्टर से ये तीन सवाल पूछें।" },
    beats: [
      { en: "Is this a screening test or a diagnostic test — and what will I do with each result?", hi: "क्या यह स्क्रीनिंग टेस्ट है या डायग्नोस्टिक — और हर नतीजे के बाद मुझे क्या करना होगा?" },
      { en: "Is this the right week of pregnancy for it?", hi: "क्या गर्भावस्था का यह सप्ताह इस जाँच के लिए सही है?" },
      { en: "What happens if the result is inconclusive, or shows higher risk?", hi: "अगर नतीजा अनिर्णायक आए या ज़्यादा जोखिम दिखे तो आगे क्या होगा?" },
    ],
    cta: CTA,
    onScreen: "Screening or diagnostic? · Right week? · What if higher risk?",
    broll: "Text-on-screen with a calm voiceover; optional doctor cameo.",
  },
  {
    id: "myths",
    title: "3 myths about genetic testing",
    seconds: "40",
    hook: { en: "Three myths about genetic testing — and what's true.", hi: "जेनेटिक जाँच के तीन मिथक — और सच्चाई क्या है।" },
    beats: [
      { en: "Myth: it's only for people who are already ill. Fact: it can also help healthy people with a family history plan ahead.", hi: "मिथक: यह सिर्फ़ बीमार लोगों के लिए है। सच: परिवार में इतिहास होने पर स्वस्थ लोग भी इससे योजना बना सकते हैं।" },
      { en: "Myth: a test always gives a clear answer. Fact: some results are uncertain — counselling helps.", hi: "मिथक: हर जाँच से साफ़ जवाब मिलता है। सच: कुछ नतीजे अनिश्चित होते हैं — काउंसलिंग मदद करती है।" },
      { en: "Myth: if no one in my family is affected, I can't be a carrier. Fact: most carriers have no family history.", hi: "मिथक: परिवार में कोई प्रभावित नहीं तो मैं वाहक नहीं हो सकता। सच: ज़्यादातर वाहकों के परिवार में इतिहास नहीं होता।" },
    ],
    cta: CTA,
    onScreen: "Myth ❌ → Fact ✅ ×3",
    broll: "Red cross / green tick graphics; counsellor to camera.",
  },
];
