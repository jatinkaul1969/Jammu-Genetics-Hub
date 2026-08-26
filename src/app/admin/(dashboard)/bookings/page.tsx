import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { BOOKING_STATUSES, STATUS_LABEL, STATUS_STYLE } from "@/lib/booking-status";

type SearchParams = { status?: string; lab?: string; q?: string };

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = params.status ?? "";
  const labSlug = params.lab ?? "";
  const q = params.q?.trim() ?? "";

  const labs = await prisma.lab.findMany({ orderBy: [{ isOwn: "desc" }, { name: "asc" }] });
  const activeLab = labs.find((l) => l.slug === labSlug);

  const bookings = await prisma.booking.findMany({
    where: {
      AND: [
        status ? { status } : {},
        activeLab ? { labId: activeLab.id } : {},
        q
          ? {
              OR: [
                { bookingCode: { contains: q, mode: "insensitive" } },
                { phone: { contains: q } },
                { patientName: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
      ],
    },
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const labMap = new Map(labs.map((l) => [l.id, l]));

  function buildHref(next: Partial<SearchParams>) {
    const merged = { status, lab: labSlug, q, ...next };
    const sp = new URLSearchParams();
    if (merged.status) sp.set("status", merged.status);
    if (merged.lab) sp.set("lab", merged.lab);
    if (merged.q) sp.set("q", merged.q);
    const qs = sp.toString();
    return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-ink">Bookings ({bookings.length})</h2>
        <form action="/admin/bookings" method="get" className="flex items-center gap-2">
          {status && <input type="hidden" name="status" value={status} />}
          {labSlug && <input type="hidden" name="lab" value={labSlug} />}
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search booking ID, phone, or patient name"
            className="w-72 max-w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark">
            Search
          </button>
        </form>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Link
          href={buildHref({ status: "" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            !status ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:border-brand"
          }`}
        >
          All statuses
        </Link>
        {BOOKING_STATUSES.map((s) => (
          <Link
            key={s}
            href={buildHref({ status: s })}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              status === s ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:border-brand"
            }`}
          >
            {STATUS_LABEL[s]}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href={buildHref({ lab: "" })}
          className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
            !labSlug ? "border-brand text-brand" : "border-border text-ink-faint hover:border-brand"
          }`}
        >
          All labs
        </Link>
        {labs.map((l) => (
          <Link
            key={l.slug}
            href={buildHref({ lab: l.slug })}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
              labSlug === l.slug ? "border-brand text-brand" : "border-border text-ink-faint hover:border-brand"
            }`}
          >
            {l.shortName}
          </Link>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[1fr_1.4fr_1fr_1fr_1fr_0.8fr] gap-3 border-b border-border bg-surface-muted px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint sm:grid">
          <span>Booking</span>
          <span>Patient</span>
          <span>Lab</span>
          <span>Scheduled</span>
          <span>Status</span>
          <span className="text-right">Amount</span>
        </div>
        {bookings.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-soft">No bookings match these filters.</p>
        ) : (
          bookings.map((b) => {
            const lab = labMap.get(b.labId);
            return (
              <Link
                key={b.id}
                href={`/admin/bookings/${b.id}`}
                className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg sm:grid-cols-[1fr_1.4fr_1fr_1fr_1fr_0.8fr] sm:items-center"
              >
                <span className="font-mono text-xs text-ink">{b.bookingCode}</span>
                <span className="truncate text-ink-soft">
                  {b.patientName} <span className="text-ink-faint">({b.patientAge})</span>
                </span>
                <span className="text-ink-soft">{lab?.shortName ?? "—"}</span>
                <span className="text-xs text-ink-soft">
                  {new Date(b.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {b.scheduledSlot.split(" ")[0]}
                </span>
                <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[b.status] ?? ""}`}>
                  {STATUS_LABEL[b.status] ?? b.status}
                </span>
                <span className="text-right font-mono text-ink sm:text-right">{formatInr(b.totalAmount)}</span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
