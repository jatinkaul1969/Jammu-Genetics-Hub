// Where did this visitor come from? Remembered in the browser (never sent
// anywhere until the visitor submits a form or taps WhatsApp), so a request can
// be traced back to the post, ad or search that brought it in.
//
//  • A link with ?utm_source=… (every link from the Social Studio has one) always
//    wins — that is the specific post the visitor clicked.
//  • Otherwise the first outside site they arrived from (Google, Instagram…) is
//    kept for 30 days.
// Client-side only: call from effects and event handlers.

const KEY = "jgh_attr";
const TTL_MS = 30 * 24 * 60 * 60 * 1000;

export type Attribution = { src: string; med?: string; camp?: string; at: number };

const clean = (v: string | null | undefined) => (v ? v.replace(/[^\w .\-/]/g, "").slice(0, 60) : undefined);

function referrerSource(): string | null {
  try {
    if (!document.referrer) return null;
    const host = new URL(document.referrer).hostname.replace(/^www\./, "");
    if (!host || host === location.hostname) return null;
    if (/(^|\.)google\./.test(host)) return "google";
    if (/(^|\.)bing\.com$/.test(host)) return "bing";
    if (/instagram\.com$/.test(host)) return "instagram";
    if (/(facebook\.com|fb\.com|fb\.me)$/.test(host)) return "facebook";
    if (/(^|\.)youtube\.com$|youtu\.be$/.test(host)) return "youtube";
    if (/whatsapp\.com$/.test(host)) return "whatsapp";
    if (/(^|\.)(t\.co|twitter\.com|x\.com)$/.test(host)) return "x";
    return clean(host) ?? null;
  } catch {
    return null;
  }
}

export function getAttribution(): Attribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const a = JSON.parse(raw) as Attribution;
    if (!a?.src || Date.now() - a.at > TTL_MS) return null;
    return a;
  } catch {
    return null;
  }
}

export function captureAttribution() {
  try {
    const p = new URLSearchParams(location.search);
    const utm = clean(p.get("utm_source"));
    let next: Attribution | null = null;
    if (utm) next = { src: utm, med: clean(p.get("utm_medium")), camp: clean(p.get("utm_campaign")), at: Date.now() };
    else if (!getAttribution()) {
      if (p.get("gclid")) next = { src: "google", med: "cpc", at: Date.now() };
      else if (p.get("fbclid")) next = { src: "facebook", med: "social", at: Date.now() };
      else {
        const ref = referrerSource();
        if (ref) next = { src: ref, med: "referral", at: Date.now() };
      }
    }
    if (next) localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage blocked — attribution is a nice-to-have
  }
}

/** "instagram / social / 202611-spotlight-double-marker-test" */
export function attributionText(a: Attribution) {
  return [a.src, a.med, a.camp].filter(Boolean).join(" / ");
}

/** The short tag added to a WhatsApp message so the chat shows which post it came from. */
export function attributionRef(a: Attribution) {
  return [a.src, a.camp].filter(Boolean).join("/").slice(0, 70);
}
