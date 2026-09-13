import type { ResolvingMetadata } from "next";
import { CONTACT_EMAIL, CONTACT_PHONES, WHATSAPP_GREETING, buildWhatsAppLink } from "@/lib/contact";

// A page's own `generateMetadata` returning an `openGraph`/`twitter` object
// REPLACES the parent's entirely — it doesn't deep-merge — so the
// auto-generated opengraph-image.tsx/twitter-image.tsx files (which only
// attach themselves to a segment that leaves openGraph/twitter untouched)
// silently disappear on any page that sets its own OG title/description.
// Next's documented fix: read the parent's already-resolved images back out
// and include them in your own object. See generateMetadata docs,
// "With parent metadata" / the `previousImages` example.
// Shared NAP (Name/Address/Phone) + WhatsApp business entity JSON-LD, used
// on the homepage and every /[city] hub page. Real phone/email/WhatsApp
// link (from contact.ts) and a locality-level address — no fabricated
// street address, since we don't have real ones on file per city yet.
// `telephone`/`sameAs` are what let Google tie this site to the same
// business as its Google Business Profile / WhatsApp Business listing.
export function buildBusinessJsonLd(params: {
  name: string;
  url: string;
  description: string;
  addressLocality: string;
  addressRegion: string;
  areaServed: string | { "@type": "City"; name: string };
}) {
  return {
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    name: params.name,
    url: params.url,
    description: params.description,
    telephone: `+91${CONTACT_PHONES[0]}`,
    email: CONTACT_EMAIL,
    address: {
      "@type": "PostalAddress",
      addressLocality: params.addressLocality,
      addressRegion: params.addressRegion,
      addressCountry: "IN",
    },
    areaServed: params.areaServed,
    medicalSpecialty: "Pathology",
    // WhatsApp is the primary contact channel this business actually
    // answers on — sameAs tells Google "this profile is the same entity".
    sameAs: [buildWhatsAppLink(WHATSAPP_GREETING)],
  };
}

export async function inheritedShareImages(parent: ResolvingMetadata) {
  const resolved = await parent;
  return {
    openGraph: resolved.openGraph?.images ?? [],
    twitter: resolved.twitter && "images" in resolved.twitter ? (resolved.twitter.images ?? []) : [],
  };
}
