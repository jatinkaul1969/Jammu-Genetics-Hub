import type { Metadata } from "next";
import { CONTACT_EMAIL, CONTACT_PHONES } from "@/lib/contact";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Jammu Genetics Hub collects, uses and protects your personal and health-related information.",
  alternates: { canonical: "/privacy" },
  robots: { index: true, follow: true },
};

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: "What we collect",
    body: [
      "When you book a test, ask for a callback or contact us, we collect the details you give us: your name, mobile number, city and address, the name and age of the person being tested, and the tests you choose.",
      "When a test is done we also handle the sample details and the report, which are health information. We keep these only to provide the service you asked for.",
      "Like most websites we also see basic technical information (pages visited, device type, and — if you arrived from a link or post — which one). If analytics tools are switched on, they use cookies or similar technology to count visits.",
    ],
  },
  {
    title: "Why we use it",
    body: [
      "To book and carry out sample collection, to send the sample to the laboratory, to deliver your report, and to arrange counselling when you ask for it.",
      "To contact you about your booking or request by phone, SMS or WhatsApp. We do not send promotional messages unless you have agreed to receive them.",
      "To run, secure and improve the website and our service.",
    ],
  },
  {
    title: "Who we share it with",
    body: [
      "The partner laboratory that processes your sample, our sample-collection staff, and service providers that help us run the service (website hosting and database, payments, messaging and analytics). They may process data only to provide their service to us.",
      "Some of these providers keep data outside India (for example, our database is hosted in Singapore).",
      "We do not sell your personal information, and we do not share it with advertisers.",
    ],
  },
  {
    title: "How long we keep it",
    body: ["We keep booking and report records for as long as needed to provide the service, to answer questions about it, and to meet legal obligations. You can ask us to delete your information (see below)."],
  },
  {
    title: "Your choices",
    body: [
      "You can ask us what information we hold about you, ask us to correct it, ask us to delete it, or withdraw your consent to be contacted — by writing to us at the email below or calling the number below.",
      "If you have a concern we have not resolved, you can also approach the Data Protection Board of India once it is operational.",
    ],
  },
  {
    title: "Not medical advice",
    body: ["Information on this website is general and is not a substitute for advice from your doctor. Please discuss any test or result with your doctor or a qualified genetic counsellor."],
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="font-display text-3xl font-semibold text-ink">Privacy Policy</h1>
      <p className="mt-2 text-sm text-ink-faint">Jammu Genetics Hub · last updated November 2026</p>
      <p className="mt-5 text-base leading-relaxed text-ink-soft">
        We handle personal and health-related information, and we take that seriously. This page explains in plain language what we collect,
        why, and what choices you have.
      </p>
      {SECTIONS.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">{s.title}</h2>
          <div className="mt-2 space-y-3 text-sm leading-relaxed text-ink-soft">
            {s.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </section>
      ))}
      <section className="mt-8 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold text-ink">Contact us about your information</h2>
        <p className="mt-2 text-sm text-ink-soft">
          Email <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand underline">{CONTACT_EMAIL}</a> or call{" "}
          {CONTACT_PHONES.map((p, i) => (
            <span key={p}>
              {i > 0 && " / "}
              <a href={`tel:+91${p}`} className="text-brand underline">+91 {p}</a>
            </span>
          ))}
          .
        </p>
      </section>
    </div>
  );
}
