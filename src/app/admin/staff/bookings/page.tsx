import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/booking-status";

export default async function StaffBookingsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");
  if (!parsePermissions(staff.permissionsJson).includes("bookings")) redirect("/admin/staff");

  const bookings = await prisma.booking.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const labs = await prisma.lab.findMany();
  const labMap = new Map(labs.map((l) => [l.id, l]));

  return (
    <div>
      <h2 className="mb-5 font-display text-lg font-semibold text-ink">Bookings ({bookings.length})</h2>

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
          <p className="px-4 py-10 text-center text-sm text-ink-soft">No bookings yet.</p>
        ) : (
          bookings.map((b) => {
            const lab = labMap.get(b.labId);
            return (
              <Link
                key={b.id}
                href={`/admin/staff/bookings/${b.id}`}
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
