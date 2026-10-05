import Link from "next/link";
import { BadgeCheck, MessageCircle, ArrowRight } from "lucide-react";
import { buildWhatsAppLink } from "@/lib/contact";
import { GENETICIST_CREDENTIAL } from "@/lib/genetics-content";

export function GeneticCounsellingBanner({
  cityKey,
  cityLabel,
  testName,
  variant = "genetic",
}: {
  cityKey: string;
  cityLabel: string;
  testName?: string;
  /** "oncology" is for cancer-test pages: the doctor-led wording, with geneticist help for inherited risk. */
  variant?: "genetic" | "oncology";
}) {
  const oncology = variant === "oncology";
  const message = testName
    ? oncology
      ? `Hi Jammu Genetics Hub! I have a question about ${testName} in ${cityLabel}.`
      : `Hi Jammu Genetics Hub! I'd like to speak with a geneticist about ${testName}.`
    : oncology
      ? `Hi Jammu Genetics Hub! I have a question about an oncology test in ${cityLabel}.`
      : "Hi Jammu Genetics Hub! I'd like to speak with a geneticist about a genetic test.";

  return (
    <div className="rounded-2xl border border-brand/30 bg-brand-soft/60 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand text-white">
          <BadgeCheck size={18} />
        </span>
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">
            {oncology ? "Questions about this test? Talk to us." : "Not sure which test you need? Talk to a geneticist."}
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            {oncology ? (
              <>
                Our team can explain what a test measures, what sample is needed and how your report reaches you. For
                inherited cancer risk, Jammu Genetics Hub also helps patients in {cityLabel} connect with{" "}
                {GENETICIST_CREDENTIAL} before and after testing. Test choices for a cancer diagnosis are best made with
                your oncologist.
              </>
            ) : (
              <>
                Jammu Genetics Hub helps patients in {cityLabel} connect with {GENETICIST_CREDENTIAL} who explain your
                options, choose the right test, and walk you through your results — so you understand every report and
                what to do next.
              </>
            )}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href={buildWhatsAppLink(message)}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <MessageCircle size={15} /> {oncology ? "Ask on WhatsApp" : "Talk to a geneticist"}
            </a>
            <Link
              href={`/${cityKey}/genetic-counselling`}
              className="flex items-center gap-1 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium text-ink hover:border-brand"
            >
              How genetic counselling works <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
