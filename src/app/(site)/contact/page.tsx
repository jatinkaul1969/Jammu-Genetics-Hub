import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { MapPin, Phone, Mail, MessageCircle, Navigation, Star } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONES, GOOGLE_BUSINESS_URL, WHATSAPP_GREETING, buildWhatsAppLink } from "@/lib/contact";
import { SERVICEABLE_CITIES, formattedAddress, mapsUrl } from "@/lib/serviceable-areas";
import { getBaseUrl } from "@/lib/site-url";
import { buildBusinessJsonLd, inheritedShareImages } from "@/lib/seo";

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  const title = "Contact Jammu Genetics Hub — Address, Phone & Directions in Jammu";
  const description =
    "Contact Jammu Genetics Hub in Jammu: call or WhatsApp +91 9086567018, get directions to our Sarwal, Jammu office, or request a call from a geneticist.";
  const shareImages = await inheritedShareImages(parent);
  return {
    title,
    description,
    alternates: { canonical: "/contact" },
    openGraph: { title, description, type: "website", url: "/contact", images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

export default async function ContactPage() {
  const jammu = SERVICEABLE_CITIES[0];
  const address = formattedAddress(jammu)!;
  const directions = mapsUrl(jammu)!;
  const baseUrl = await getBaseUrl();
  const embed = `https://www.google.com/maps?q=${encodeURIComponent(`Jammu Genetics Hub, ${address}`)}&output=embed`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Jammu Genetics Hub",
    url: `${baseUrl}/contact`,
    mainEntity: buildBusinessJsonLd({
      name: "Jammu Genetics Hub",
      url: baseUrl,
      description:
        "One-stop genetic testing and diagnostics platform in Jammu, with guidance from BGCI-certified geneticists.",
      addressLocality: jammu.label,
      addressRegion: jammu.state,
      streetAddress: jammu.address?.streetAddress,
      postalCode: jammu.address?.postalCode,
      hasMap: directions,
      areaServed: SERVICEABLE_CITIES.map((c) => c.label).join(", "),
    }),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <nav className="mb-4 text-xs text-ink-faint">
          <Link href="/" className="hover:text-brand">Home</Link> / <span className="text-ink-soft">Contact</span>
        </nav>
        <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">Contact Jammu Genetics Hub</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
          Questions about a genetic or oncology test, a booking, or speaking with a geneticist? Reach us any of these
          ways — we&apos;re based in Jammu and serve Jammu and Mumbai.
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-3">
            <a
              href={buildWhatsAppLink(WHATSAPP_GREETING)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-brand"
            >
              <MessageCircle className="shrink-0 text-success" size={20} />
              <span>
                <span className="block text-sm font-semibold text-ink">Chat on WhatsApp</span>
                <span className="text-xs text-ink-soft">+91 {CONTACT_PHONES[0]} — fastest way to reach us</span>
              </span>
            </a>
            {CONTACT_PHONES.map((phone) => (
              <a key={phone} href={`tel:+91${phone}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-brand">
                <Phone className="shrink-0 text-cat-teal" size={20} />
                <span>
                  <span className="block text-sm font-semibold text-ink">Call +91 {phone}</span>
                  <span className="text-xs text-ink-soft">Tap to call</span>
                </span>
              </a>
            ))}
            <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 hover:border-brand">
              <Mail className="shrink-0 text-cat-blue" size={20} />
              <span>
                <span className="block text-sm font-semibold text-ink">Email</span>
                <span className="text-xs text-ink-soft">{CONTACT_EMAIL}</span>
              </span>
            </a>
            <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
              <MapPin className="mt-0.5 shrink-0 text-cat-coral" size={20} />
              <span>
                <span className="block text-sm font-semibold text-ink">Jammu Genetics Hub</span>
                <span className="text-sm text-ink-soft">{address}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <a
                href={directions}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
              >
                <Navigation size={15} /> Get directions
              </a>
              {GOOGLE_BUSINESS_URL && (
                <a
                  href={GOOGLE_BUSINESS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-brand"
                >
                  <Star size={14} className="text-gold" /> View &amp; review us on Google
                </a>
              )}
            </div>
            <p className="text-xs text-ink-faint">
              Prefer a call back? <Link href="/jammu/genetic-counselling#talk-to-a-geneticist" className="font-medium text-brand hover:underline">Request a call from a geneticist</Link>.
            </p>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-surface">
            <iframe
              title="Jammu Genetics Hub on Google Maps"
              src={embed}
              className="h-80 w-full lg:h-full lg:min-h-[420px]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </>
  );
}
