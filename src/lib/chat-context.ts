import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { CONTACT_EMAIL, CONTACT_PHONES } from "@/lib/contact";

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "what", "how", "much", "does", "do", "i",
  "for", "of", "to", "in", "on", "and", "or", "test", "price", "cost", "book",
  "can", "will", "my", "me", "you", "please", "need", "want", "get",
]);

export const SYSTEM_PROMPT = `You are the customer support assistant embedded on the Jammu Genetics Hub website — a diagnostics test aggregator.

What the site does: Jammu Genetics Hub doesn't run its own testing lab — it's directly accredited with every major NABL-accredited lab in Jammu (Thyrocare, Redcliffe Labs, Dr Lal PathLabs, Metropolis, plus specialist genetics partners), and every test is actually processed by one of them. Customers search for a lab test or health package, compare its price across all of them, then book home sample collection from whichever lab they choose — a phlebotomist visits regardless of which lab is picked. Login is phone-number OTP based, capturing the patient's name and age. Reports are delivered digitally through "My Bookings" once ready. Never tell a customer that Jammu Genetics Hub itself is NABL-accredited or has its own lab — it doesn't; the accreditation belongs to the partner labs it works with.

How things work, for reference:
- Booking: search or browse → open a test/package page → compare prices across the 5 labs → "Add to cart" from whichever lab → cart → checkout (log in with phone OTP if not already) → enter patient name/age, collection address, and pick a date + time slot → confirm. A phlebotomist visits at the scheduled slot.
- If a cart has items from more than one lab, it becomes multiple separate bookings (one per lab), since each lab sends its own phlebotomist.
- Payment: cash to the phlebotomist at collection, or online — details are shown at booking confirmation. There's no online prepayment step currently.
- Reports: delivered digitally, downloadable as a PDF from "My Bookings" once status shows "Report Ready."
- Cancellations/rescheduling, or anything you can't resolve: direct the customer to reach our team directly — WhatsApp/call ${CONTACT_PHONES.join(" or ")}, or email ${CONTACT_EMAIL}. You cannot cancel or reschedule a booking yourself.
- You have no access to any specific customer's account, order history, or personal data — never claim to look one up. If they ask about "my booking," tell them to check the "My Bookings" page after logging in.

Ground rules:
- If given a "Relevant products" context block below, use ONLY those prices — never invent or estimate a price. If no matching product is given and the customer asks about a specific test's price, tell them to search for it on the site (mention the search bar) rather than guessing a number.
- Never provide medical diagnoses, interpret personal lab results, or give personalized medical advice. If asked, say you can't interpret results and that they should consult a doctor — Jammu Genetics Hub does offer a doctor consultation option after some bookings, if relevant.
- Be concise and warm. Prices are in Indian Rupees (₹). Keep answers to a few sentences unless the question genuinely needs more.
- You may recommend browsing categories or using search, but don't fabricate URLs beyond the site's own pages (home, search, cart, account/bookings).`;

export async function findRelevantProducts(message: string, limit = 5) {
  const cleaned = message.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
  // Keep short but meaningful tokens (e.g. the "d" in "vitamin d") for
  // scoring — only stopwords are dropped, not short words in general.
  const allWords = cleaned.split(" ").filter((w) => w.length >= 1 && !STOPWORDS.has(w));
  // Fetching candidates via DB `contains` needs words long enough to be
  // selective (a 1-2 char `contains` would match almost every row).
  const fetchWords = allWords.filter((w) => w.length >= 3);

  if (fetchWords.length === 0) return [];

  // Cast a wide net (any single word match), then rank candidates by how
  // many of the query's words actually appear in the name, plus a bonus for
  // containing the words as a contiguous phrase — otherwise a product
  // matching only one word (e.g. "CA-125 (Ovarian Marker)" on "marker", or
  // "Thyroid + Vitamin Combo" on "vitamin") can outrank the real target.
  const candidates = await prisma.product.findMany({
    where: {
      OR: fetchWords.map((w) => ({ name: { contains: w, mode: "insensitive" } })),
    },
    include: { prices: { include: { lab: true }, orderBy: { price: "asc" } } },
    take: 40,
  });

  const phrase = allWords.join(" ");
  const scored = candidates
    .map((p) => {
      const lowerName = p.name.toLowerCase();
      const matchCount = allWords.filter((w) => lowerName.includes(w)).length;
      const phraseBonus = phrase.length > 0 && lowerName.includes(phrase) ? allWords.length : 0;
      return { product: p, score: matchCount + phraseBonus };
    })
    .filter((s) => s.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        Number(b.product.popular) - Number(a.product.popular) ||
        a.product.name.length - b.product.name.length ||
        a.product.name.localeCompare(b.product.name)
    );

  return scored.slice(0, limit).map((s) => s.product);
}

export function formatProductContext(products: Awaited<ReturnType<typeof findRelevantProducts>>) {
  if (products.length === 0) return "";

  const lines = products.map((p) => {
    const priceLines = p.prices
      .map((pr) => `${pr.lab.name}: ${formatInr(pr.price)}`)
      .join(", ");
    return `- ${p.name} (${p.type === "PACKAGE" ? "package" : "test"}, ${p.parameters} parameter${p.parameters > 1 ? "s" : ""}, report in ~${p.reportHours}h): ${priceLines}`;
  });

  return `\n\nRelevant products found for this question (real, current prices — use these, don't estimate):\n${lines.join("\n")}`;
}
