import Link from "next/link";
import { CalendarClock, ClipboardList, FileDown, Receipt } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/booking-status";
import { PickupTracker } from "@/components/PickupTracker";

export default async function BookingsPage() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <ClipboardList className="mx-auto mb-3 text-ink-faint" size={36} />
        <h1 className="mb-2 font-display text-xl font-semibold text-ink">Log in to see your bookings</h1>
        <p className="text-sm text-ink-soft">Use the Log in button in the header to continue.</p>
      </div>
    );
  }

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  const labIds = [...new Set(bookings.map((b) => b.labId))];
  const labs = await prisma.lab.findMany({ where: { id: { in: labIds } } });
  const labMap = new Map(labs.map((l) => [l.id, l]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">My Bookings</h1>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No bookings yet.{" "}
          <Link href="/search" className="font-medium text-brand hover:underline">
            Browse tests &amp; packages
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b) => {
            const lab = labMap.get(b.labId);
            return (
              <div key={b.id} className="overflow-hidden rounded-xl border border-border bg-surface">
                <Link
                  href={`/account/bookings/${b.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted px-4 py-3 hover:bg-brand-soft/40"
                >
                  <div>
                    <p className="font-mono text-xs text-ink-faint">{b.bookingCode}</p>
                    <p className="text-sm font-medium text-ink">{lab?.name ?? "Lab"}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[b.status] ?? ""}`}>
                    {STATUS_LABEL[b.status] ?? b.status}
                  </span>
                </Link>
                <div className="px-4 py-3">
                  <p className="mb-2 flex items-center gap-2 text-xs text-ink-soft">
                    <CalendarClock size={14} className="text-brand" />
                    {new Date(b.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {b.scheduledSlot}
                  </p>
                  {b.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                      <span className="text-ink-soft">{item.productName}</span>
                      <span className="font-mono text-ink">{formatInr(item.price)}</span>
                    </div>
                  ))}
                  {b.discountAmount > 0 && (
                    <div className="flex items-center justify-between py-1 text-sm text-success">
                      <span>Coupon ({b.couponCode})</span>
                      <span className="font-mono">−{formatInr(b.discountAmount)}</span>
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                    <span className="text-ink">Total</span>
                    <span className="font-mono text-brand-dark">{formatInr(b.totalAmount)}</span>
                  </div>
                  <Link
                    href={`/account/bookings/${b.id}`}
                    className="mt-2 flex items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand"
                  >
                    <Receipt size={14} /> View details &amp; invoice
                  </Link>
                  {b.reportFile && (
                    <a
                      href={`/api/reports/${b.bookingCode}`}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-soft py-2 text-sm font-semibold text-brand-dark hover:bg-brand hover:text-white"
                    >
                      <FileDown size={15} /> Download report
                    </a>
                  )}
                  {lab?.isOwn && (b.status === "PENDING" || b.status === "CONFIRMED") && (
                    <PickupTracker bookingId={b.id} />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
