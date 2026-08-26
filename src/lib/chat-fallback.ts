import { formatInr } from "@/lib/format";
import { CONTACT_EMAIL, CONTACT_PHONES } from "@/lib/contact";
import type { findRelevantProducts } from "@/lib/chat-context";

type Products = Awaited<ReturnType<typeof findRelevantProducts>>;

// A small keyword-matched responder used only when ANTHROPIC_API_KEY isn't
// configured, so the chat widget is still useful out of the box. Once a key
// is set, /api/chat switches to real Claude-powered answers automatically.
export function fallbackReply(message: string, products: Products): string {
  const lower = message.toLowerCase();

  if (products.length > 0) {
    const p = products[0];
    const lowest = p.prices[0];
    const own = p.prices.find((pr) => pr.lab.isOwn);
    const lines = [
      `**${p.name}** — ${p.parameters} parameter${p.parameters > 1 ? "s" : ""}, report in about ${p.reportHours} hours.`,
      own ? `At Jammu Genetics Hub: ${formatInr(own.price)}.` : "",
      lowest && (!own || lowest.labId !== own.labId) ? `Lowest price: ${formatInr(lowest.price)} at ${lowest.lab.name}.` : "",
      `Search "${p.name}" on the site to compare all 5 labs and book.`,
    ].filter(Boolean);
    return lines.join(" ");
  }

  if (/\b(hi|hello|hey|namaste)\b/.test(lower)) {
    return "Hi! I can help with test prices, how home collection works, booking, and report downloads. What do you need?";
  }
  if (/(home collect|phlebotomist|sample collect|visit)/.test(lower)) {
    return "A trained phlebotomist visits your address at the time slot you pick during checkout — free with every booking, from whichever lab you choose.";
  }
  if (/(login|otp|log in|sign in|account)/.test(lower)) {
    return "Login is phone-number based: enter your mobile number, we send a 6-digit OTP, and you verify it — no password needed. New numbers are asked for name and age to create an account.";
  }
  if (/(report|download|pdf|result)/.test(lower)) {
    return "Once your sample is processed, your report shows up as a download in \"My Bookings\" (top-right menu after logging in) — you'll see a \"Download report\" button once it's ready.";
  }
  if (/(cancel|reschedule|change.*(date|slot))/.test(lower)) {
    return `I can't cancel or reschedule a booking myself — please reach our team on WhatsApp/call ${CONTACT_PHONES.join(" or ")}, or email ${CONTACT_EMAIL}, with your booking ID and they'll sort it out.`;
  }
  if (/(pay|payment|cash|online)/.test(lower)) {
    return "You can pay cash to the phlebotomist at the time of collection, or online — the exact options are shown on your booking confirmation.";
  }
  if (/(book|booking|order|checkout|cart)/.test(lower)) {
    return "To book: search for a test, compare prices across labs on its page, add it to your cart from whichever lab you want, then check out — you'll log in with OTP, add the patient's details and address, and pick a collection slot.";
  }
  if (/(thank|thanks|bye)/.test(lower)) {
    return "You're welcome! Let me know if anything else comes up.";
  }

  return "I'm not sure I have an answer for that yet — try the search bar above for a specific test, or ask me about pricing, home collection, booking, OTP login, or report downloads.";
}
