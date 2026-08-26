import Link from "next/link";
import { ShieldCheck, Home, Clock, Award, Mail, Phone } from "lucide-react";
import { CONTACT_EMAIL, CONTACT_PHONES } from "@/lib/contact";
import { getLabs } from "@/lib/catalog";

export async function Footer() {
  const labs = await getLabs();
  const partnerLabs = labs.filter((l) => !l.isOwn);

  return (
    <footer className="mt-16 border-t border-border bg-surface">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-4">
        <div className="grid grid-cols-2 gap-4 md:col-span-2 md:grid-cols-4">
          <FooterStat icon={<ShieldCheck size={18} />} label="NABL Accredited Labs" color="teal" />
          <FooterStat icon={<Home size={18} />} label="Free Home Collection" color="blue" />
          <FooterStat icon={<Clock size={18} />} label="Reports in 12–24 hrs" color="coral" />
          <FooterStat icon={<Award size={18} />} label={`Affiliated with ${labs.length} Trusted Labs`} color="purple" />
        </div>

        <div>
          <p className="mb-3 font-display text-sm font-semibold text-ink">Company</p>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li><Link href="/" className="hover:text-brand">About Jammu Genetics Hub</Link></li>
            <li><Link href="/search" className="hover:text-brand">All Tests &amp; Packages</Link></li>
            <li><Link href="/account/bookings" className="hover:text-brand">My Bookings</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-3 font-display text-sm font-semibold text-ink">Affiliated labs</p>
          <ul className="space-y-2 text-sm text-ink-soft">
            {partnerLabs.map((lab) => (
              <li key={lab.id}>{lab.name}</li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-3 font-display text-sm font-semibold text-ink">Contact us</p>
          <ul className="space-y-2 text-sm text-ink-soft">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-1.5 hover:text-brand">
                <Mail size={14} className="shrink-0 text-cat-blue" /> {CONTACT_EMAIL}
              </a>
            </li>
            {CONTACT_PHONES.map((phone) => (
              <li key={phone}>
                <a href={`tel:+91${phone}`} className="flex items-center gap-1.5 hover:text-brand">
                  <Phone size={14} className="shrink-0 text-cat-teal" /> +91 {phone}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-border px-4 py-4 text-center text-xs text-ink-faint sm:px-6">
        © {new Date().getFullYear()} Jammu Genetics Hub. Test prices from other labs are shown for comparison
        only and may vary from the listed lab&apos;s own website.
      </div>
    </footer>
  );
}

const FOOTER_COLORS = {
  teal: "text-cat-teal",
  blue: "text-cat-blue",
  coral: "text-cat-coral",
  purple: "text-cat-purple",
} as const;

function FooterStat({
  icon,
  label,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  color: keyof typeof FOOTER_COLORS;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className={FOOTER_COLORS[color]}>{icon}</span>
      <span className="text-xs text-ink-soft">{label}</span>
    </div>
  );
}
