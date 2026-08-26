import { formatInr } from "@/lib/format";

type SnapshotItem = { productName: string; productSlug: string; labName: string; price: number };

// Builds a click-to-chat wa.me link with a pre-filled message — no WhatsApp
// Business API / credentials required. Whoever clicks it (currently: an
// admin, from the abandoned-carts page) still has to hit Send inside
// WhatsApp; this isn't unattended auto-sending. See the README for how to
// wire real automated sending via the WhatsApp Cloud API later.
export function buildAbandonedCartWhatsAppLink(params: {
  patientName: string;
  phone: string;
  items: SnapshotItem[];
  baseUrl: string;
}) {
  const { patientName, phone, items, baseUrl } = params;
  const first = items[0];
  const extra = items.length - 1;
  const productLine = extra > 0 ? `*${first.productName}* (+${extra} more)` : `*${first.productName}*`;
  const link = `${baseUrl}/product/${first.productSlug}`;

  const message = `Hi ${patientName}! 👋

We noticed you were checking out ${productLine} on Jammu Genetics Hub but didn't finish booking it.

No worries — it's still saved for you at ${formatInr(first.price)}.

✅ NABL-accredited labs, compared side by side
✅ Free home sample collection
✅ Reports in 12–24 hrs

Pick up where you left off: ${link}

Reply here if you have any questions — happy to help!

— Jammu Genetics Hub`;

  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}
