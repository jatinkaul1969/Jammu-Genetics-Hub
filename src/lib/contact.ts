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
