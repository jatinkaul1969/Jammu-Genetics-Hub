// Single source of truth for the business's real contact details, so they
// don't drift out of sync across the footer, chatbot, and WhatsApp links.
export const CONTACT_EMAIL = "genetics.jammu@gmail.com";
export const CONTACT_PHONES = ["9086567018", "9596630303"];
// The number WhatsApp chat routes to — your own WhatsApp Business chatbot
// picks this up, with you following up personally where it can't help.
export const WHATSAPP_NUMBER = CONTACT_PHONES[0];

export function buildWhatsAppLink(message: string) {
  return `https://wa.me/91${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

// Shared default greeting for every "chat on WhatsApp" entry point (chat
// widget, footer, contact links) — one string instead of each place
// re-typing a slightly different opener.
export const WHATSAPP_GREETING = "Hi Jammu Genetics Hub! I have a question about a test/booking.";

// Optional: the short "Share profile" link from the Google Business Profile
// (e.g. https://maps.app.goo.gl/...). When set, it is added to the site's
// structured data as the same business and shown as a "Review us on Google"
// link. Set NEXT_PUBLIC_GOOGLE_BUSINESS_URL in Vercel — no code change needed.
export const GOOGLE_BUSINESS_URL =
  process.env.NEXT_PUBLIC_GOOGLE_BUSINESS_URL || "https://share.google/qitcemOsTeMlJzUQt";

// Optional: the direct "write a review" link for the Google profile (Business
// Profile → "Ask for reviews" → copy the link). When set, every "Review us"
// link opens the review box itself instead of the profile — more people finish
// a review that is one tap away. Set NEXT_PUBLIC_GOOGLE_REVIEW_URL.
export const GOOGLE_REVIEW_URL = process.env.NEXT_PUBLIC_GOOGLE_REVIEW_URL || "";

// Optional social profiles — each shows in the footer (and in the structured
// data, so Google ties the accounts to the business) once its setting exists:
// NEXT_PUBLIC_INSTAGRAM_URL, NEXT_PUBLIC_FACEBOOK_URL, NEXT_PUBLIC_YOUTUBE_URL.
export const SOCIAL_LINKS = [
  { id: "instagram", label: "Instagram", url: process.env.NEXT_PUBLIC_INSTAGRAM_URL || "" },
  { id: "facebook", label: "Facebook", url: process.env.NEXT_PUBLIC_FACEBOOK_URL || "" },
  { id: "youtube", label: "YouTube", url: process.env.NEXT_PUBLIC_YOUTUBE_URL || "" },
].filter((s) => s.url.startsWith("https://"));
