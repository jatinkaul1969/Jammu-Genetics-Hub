import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { Banknote, ClipboardCheck, FlaskConical, HeartHandshake, MessageCircle, Phone, ShieldCheck, Stethoscope, Truck } from "lucide-react";
import { inheritedShareImages } from "@/lib/seo";
import { CONTACT_PHONES, buildWhatsAppLink } from "@/lib/contact";
import { GENETICIST_CREDENTIAL } from "@/lib/genetics-content";
import { SERVICEABLE_CITIES } from "@/lib/serviceable-areas";
import { DoctorPartnerForm } from "@/components/DoctorPartnerForm";

// Served from cache and refreshed hourly, like every other landing page.
export const revalidate = 3600;

export async function generateMetadata(_: unknown, parent: ResolvingMetadata): Promise<Metadata> {
  const title = "For Doctors & Clinics in Jammu: Genetic and Oncology Test Support";
  const description =
    "Advise the test, we handle the rest: clear prices and turnaround across partner labs, sample collection from your clinic or the patient's home, and genetic counselling support for your patients in Jammu.";
  const shareImages = await inheritedShareImages(parent);
  return {
    title,
    description,
    keywords: ["genetic test partner for doctors Jammu", "NIPT sample collection Jammu clinic", "genetic testing for gynaecologists Jammu", "oncology test sample collection Jammu"],
    alternates: { canonical: "/for-doctors" },
    openGraph: { title, description, type: "website", url: "/for-doctors", images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
}

const OFFERS = [
  {
    icon: Banknote,
    title: "A clear price and turnaround for every test",
    body: "Hundreds of genetic and oncology tests, compared across partner laboratories — so you can tell a patient the cost and the report time in one message.",
  },
  {
    icon: Truck,
    title: "Sample collection from your clinic or the patient's home",
    body: "Our own trained phlebotomists collect and send the sample to the partner lab. Your patient does not have to find a lab or wait in a queue.",
  },
  {
    icon: HeartHandshake,
    title: "Genetic counselling for your patients",
    body: `We connect families with ${GENETICIST_CREDENTIAL} before and after testing, so a result is explained properly and the next step is clear.`,
  },
  {
    icon: ClipboardCheck,
    title: "One point of contact",
    body: "Message or call us on WhatsApp for prices, test selection logistics, sample requirements and report status. We reply the same day.",
  },
];

const STEPS = [
  { title: "You advise the test", body: "The clinical decision stays with you and your patient. We never change a test you have advised." },
  { title: "We arrange the sample", body: "The patient, or your clinic, messages us. We confirm the price, and book a collection from the clinic or home." },
  { title: "Report and counselling", body: "The partner lab processes the sample. The report is shared with the patient, and with you when the patient agrees. Counselling is arranged where needed." },
];

export default function ForDoctorsPage() {
  const whatsappHref = buildWhatsAppLink("Hello Jammu Genetics Hub, I am a doctor and would like to know how you can help my patients with genetic / oncology tests.");

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <header className="mb-10 max-w-3xl">
        <p className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-brand">
          <Stethoscope size={14} /> For doctors &amp; clinics
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
          You advise the test. We make it easy for your patient to get it done.
        </h1>
        <p className="mt-4 text-base leading-relaxed text-ink-soft">
          Jammu Genetics Hub is a one-stop place in {SERVICEABLE_CITIES[0].label} for genetic and oncology tests: prenatal screening, newborn
          screening, carrier and hereditary-cancer tests, exome sequencing and hundreds of cancer (oncology) tests — with sample
          collection, reports and counselling support handled for you.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={whatsappHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white hover:bg-brand-dark">
            <MessageCircle size={16} /> WhatsApp us
          </a>
          <a href={`tel:+91${CONTACT_PHONES[0]}`} className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-5 py-3 text-sm font-semibold text-ink hover:border-brand hover:text-brand">
            <Phone size={16} /> +91 {CONTACT_PHONES[0]}
          </a>
        </div>
      </header>

      <section className="mb-12 grid gap-4 sm:grid-cols-2">
        {OFFERS.map((o) => (
          <div key={o.title} className="rounded-xl border border-border bg-surface p-5">
            <span className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-brand-soft text-brand">
              <o.icon size={18} />
            </span>
            <h2 className="font-display text-base font-semibold text-ink">{o.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-soft">{o.body}</p>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="mb-4 font-display text-xl font-semibold text-ink">How it works</h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((s, n) => (
            <li key={s.title} className="rounded-xl border border-border bg-surface p-5">
              <span className="mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-semibold text-white">{n + 1}</span>
              <p className="font-display text-base font-semibold text-ink">{s.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-soft">{s.body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mb-12 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <ShieldCheck size={18} className="text-brand" /> What we will never do
          </h2>
          <ul className="space-y-2 text-sm leading-relaxed text-ink-soft">
            <li>We do not pay or accept commissions, gifts or incentives for referrals. The choice of test and lab stays with you and your patient.</li>
            <li>We do not change or substitute a test you have advised.</li>
            <li>We do not contact your patients unless they, or your clinic, ask us to.</li>
          </ul>
        </div>
        <div className="rounded-xl border border-border bg-surface p-5">
          <h2 className="mb-2 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <FlaskConical size={18} className="text-brand" /> About the laboratories
          </h2>
          <p className="text-sm leading-relaxed text-ink-soft">
            Jammu Genetics Hub does not run its own laboratory. Samples are processed by accredited partner laboratories, and the
            report comes from the laboratory that ran the test. We handle booking, collection, logistics and counselling support.
          </p>
        </div>
      </section>

      <section id="talk" className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-xl font-semibold text-ink">Talk to us</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              Tell us a little about your practice and what you need — a price list for the tests you advise most, sample pick-up from your
              clinic, or counselling support for a family. We will call you back.
            </p>
            <p className="mt-4 text-sm text-ink-soft">
              Prefer to look first? See the <Link href={`/${SERVICEABLE_CITIES[0].key}/genetic-tests`} className="text-brand underline">genetic tests</Link>{" "}
              and <Link href={`/${SERVICEABLE_CITIES[0].key}/oncology-tests`} className="text-brand underline">oncology tests</Link> we handle.
            </p>
          </div>
          <DoctorPartnerForm />
        </div>
      </section>
    </div>
  );
}
