import Link from "next/link";
import { Download } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { ownerAlertChannels } from "@/lib/notify-owner";
import { whatsappCloudConfigured } from "@/lib/whatsapp-cloud";

const DAY = 24 * 60 * 60 * 1000;
const SOURCE_LABEL: Record<string, string> = {
  search_widget: "Callback request",
  geneticist_request: "Geneticist request",
  doctor_partner: "Doctor / clinic enquiry",
};

function mondayOf(d: Date) {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return x;
}
const weekLabel = (d: Date) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Stat({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">{label}</p>
      <p className="mt-1 font-display text-2xl font-semibold text-ink">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-soft">{sub}</p>}
    </div>
  );
}

export default async function GrowthPage() {
  const now = new Date();
  const since30 = new Date(now.getTime() - 30 * DAY);
  const since56 = new Date(now.getTime() - 56 * DAY);

  const [leads, bookings, chats, customers, fromNotes] = await Promise.all([
    prisma.lead.findMany({ where: { createdAt: { gte: since56 } }, select: { createdAt: true, source: true, status: true } }),
    prisma.booking.findMany({ where: { createdAt: { gte: since56 }, status: { not: "CANCELLED" } }, select: { createdAt: true, totalAmount: true } }),
    prisma.whatsAppConversation.count({ where: { createdAt: { gte: since30 } } }),
    prisma.user.count({ where: { createdAt: { gte: since30 } } }),
    prisma.leadNote.findMany({ where: { body: { startsWith: "Came from: " }, createdAt: { gte: since30 } }, select: { body: true } }),
  ]);

  const leads30 = leads.filter((l) => l.createdAt >= since30);
  const bookings30 = bookings.filter((b) => b.createdAt >= since30);
  const revenue30 = bookings30.reduce((n, b) => n + b.totalAmount, 0);
  const converted30 = leads30.filter((l) => l.status === "CONVERTED").length;

  // Enquiries by type
  const byType = new Map<string, number>();
  for (const l of leads30) byType.set(l.source, (byType.get(l.source) ?? 0) + 1);

  // Enquiries by where the visitor came from ("instagram / social / 202611-spotlight-…")
  const byFrom = new Map<string, number>();
  for (const n of fromNotes) {
    const key = n.body.slice("Came from: ".length).split(" / ")[0];
    byFrom.set(key, (byFrom.get(key) ?? 0) + 1);
  }
  const byCampaign = new Map<string, number>();
  for (const n of fromNotes) {
    const t = n.body.slice("Came from: ".length);
    byCampaign.set(t, (byCampaign.get(t) ?? 0) + 1);
  }
  const attributed = fromNotes.length;

  // Eight weeks of enquiries and bookings
  const weeks: { start: Date; leads: number; bookings: number }[] = [];
  const thisMonday = mondayOf(now);
  for (let i = 7; i >= 0; i--) weeks.push({ start: new Date(thisMonday.getTime() - i * 7 * DAY), leads: 0, bookings: 0 });
  const slot = (d: Date) => weeks.find((w) => d >= w.start && d < new Date(w.start.getTime() + 7 * DAY));
  for (const l of leads) {
    const w = slot(l.createdAt);
    if (w) w.leads++;
  }
  for (const b of bookings) {
    const w = slot(b.createdAt);
    if (w) w.bookings++;
  }
  const maxWeek = Math.max(1, ...weeks.map((w) => Math.max(w.leads, w.bookings)));
  const alerts = ownerAlertChannels();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-lg font-semibold text-ink">Growth</h2>
        <p className="text-sm text-ink-soft">What came in over the last 30 days, and where it came from.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        <Stat label="Enquiries" value={leads30.length} sub={converted30 ? `${converted30} became customers` : undefined} />
        <Stat label="Bookings" value={bookings30.length} />
        <Stat label="Booking value" value={formatInr(revenue30)} />
        <Stat label="WhatsApp chats" value={chats} sub="new conversations" />
        <Stat label="New sign-ups" value={customers} />
      </div>

      <section>
        <h3 className="mb-3 font-display text-base font-semibold text-ink">Last 8 weeks</h3>
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-end gap-3">
            {weeks.map((w) => (
              <div key={w.start.toISOString()} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-28 w-full items-end justify-center gap-1">
                  <div className="w-1/2 rounded-t bg-brand" style={{ height: `${(w.leads / maxWeek) * 100}%`, minHeight: w.leads ? 4 : 0 }} title={`${w.leads} enquiries`} />
                  <div className="w-1/2 rounded-t bg-accent" style={{ height: `${(w.bookings / maxWeek) * 100}%`, minHeight: w.bookings ? 4 : 0 }} title={`${w.bookings} bookings`} />
                </div>
                <p className="text-[10px] text-ink-faint">{weekLabel(w.start)}</p>
                <p className="text-[11px] text-ink-soft">
                  {w.leads} · {w.bookings}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 flex gap-4 text-xs text-ink-soft">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-brand" /> Enquiries</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-accent" /> Bookings</span>
            <span className="text-ink-faint">Week starting Monday</span>
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 font-display text-base font-semibold text-ink">Enquiries by type</h3>
          {byType.size === 0 ? (
            <p className="text-sm text-ink-faint">None yet.</p>
          ) : (
            <ul className="space-y-1.5 text-sm">
              {[...byType.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                <li key={k} className="flex justify-between">
                  <span className="text-ink-soft">{SOURCE_LABEL[k] ?? k}</span>
                  <span className="font-medium text-ink">{n}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 font-display text-base font-semibold text-ink">Where enquiries came from</h3>
          {attributed === 0 ? (
            <p className="text-sm text-ink-faint">
              Nothing tagged yet. Enquiries are tagged when someone arrives through a Social Studio link, a Google search or another site —
              most posts will start showing up here within a few days.
            </p>
          ) : (
            <>
              <ul className="space-y-1.5 text-sm">
                {[...byFrom.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => (
                  <li key={k} className="flex justify-between">
                    <span className="capitalize text-ink-soft">{k}</span>
                    <span className="font-medium text-ink">{n}</span>
                  </li>
                ))}
              </ul>
              <p className="mb-1 mt-4 text-xs font-semibold uppercase tracking-wide text-ink-faint">By post or campaign</p>
              <ul className="space-y-1 text-xs">
                {[...byCampaign.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n]) => (
                  <li key={k} className="flex justify-between gap-3">
                    <span className="break-all text-ink-soft">{k}</span>
                    <span className="font-medium text-ink">{n}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 font-display text-base font-semibold text-ink">Download a spreadsheet</h3>
          <div className="flex flex-wrap gap-2">
            {/* A file download, not a page: a plain link, so Next does not try to prefetch or route to it. */}
            <a href="/api/admin/export?kind=leads" download className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand">
              <Download size={14} /> All enquiries
            </a>
            {/* A file download, not a page: a plain link, so Next does not try to prefetch or route to it. */}
            <a href="/api/admin/export?kind=customers" download className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand">
              <Download size={14} /> All customers
            </a>
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-faint">
            Message only people who have agreed to hear from you, and use WhatsApp templates for anything promotional. Do not upload lists of
            people who took a health test to Facebook or Instagram as ad audiences — Meta does not allow health information to be used for targeting.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-4">
          <h3 className="mb-2 font-display text-base font-semibold text-ink">Automations</h3>
          <ul className="space-y-1.5 text-sm">
            <Row ok={alerts.telegram} label="Telegram alerts for new enquiries, bookings and chats" />
            <Row ok={alerts.email} label="Email alerts" />
            <Row ok={whatsappCloudConfigured} label="WhatsApp Cloud API (chatbot, reminders)" />
            <Row ok={Boolean(process.env.WHATSAPP_LEAD_TEMPLATE_NAME)} label="Automatic WhatsApp thank-you to new enquiries" />
            <Row ok={Boolean(process.env.NEXT_PUBLIC_GA_ID)} label="Google Analytics" />
            <Row ok={Boolean(process.env.CRON_SECRET)} label="Morning summary (needs the scheduler secret)" />
          </ul>
          <p className="mt-3 text-xs text-ink-faint">
            Switch any of these on from the settings in Vercel — see <Link href="/admin/social?tab=google" className="underline">the checklist</Link> and the README.
          </p>
        </div>
      </section>
    </div>
  );
}

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-start gap-2">
      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${ok ? "bg-success" : "bg-border"}`} />
      <span className={ok ? "text-ink" : "text-ink-soft"}>
        {label} <span className="text-xs text-ink-faint">· {ok ? "on" : "off"}</span>
      </span>
    </li>
  );
}
