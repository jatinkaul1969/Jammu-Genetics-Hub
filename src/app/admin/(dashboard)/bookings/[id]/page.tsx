import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Navigation } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { AdminBookingDetail } from "@/components/AdminBookingDetail";

export default async function AdminBookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { items: true, user: true },
  });
  if (!booking) notFound();

  const lab = await prisma.lab.findUnique({ where: { id: booking.labId } });

  return (
    <div>
      <Link href="/admin/bookings" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={15} /> Back to bookings
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-5">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="mb-1 font-mono text-xs text-ink-faint">{booking.bookingCode}</p>
            <h2 className="mb-3 font-display text-lg font-semibold text-ink">
              {booking.patientName} <span className="text-sm font-normal text-ink-faint">({booking.patientAge} yrs)</span>
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <Field label="Lab">{lab?.name ?? "—"}</Field>
              <Field label="Phone">+91 {booking.phone}</Field>
              <Field label="Scheduled">
                {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {booking.scheduledSlot}
              </Field>
              <Field label="Booked on">{booking.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</Field>
              <Field label="Address" full>
                {booking.addressLine}, {booking.city} – {booking.pincode}
                {booking.latitude !== null && booking.longitude !== null && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-2 inline-flex items-center gap-1 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand-dark hover:bg-brand hover:text-white"
                  >
                    <Navigation size={11} /> Get precise directions
                  </a>
                )}
              </Field>
              <Field label="Account holder">
                {booking.user.name} · +91 {booking.user.phone}
              </Field>
            </dl>
          </div>

          <div className="rounded-xl border border-border bg-surface p-4">
            <h3 className="mb-3 text-sm font-semibold text-ink">Items</h3>
            {booking.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-border py-2 text-sm last:border-b-0">
                <span className="text-ink-soft">{item.productName}</span>
                <span className="font-mono text-ink">{formatInr(item.price)}</span>
              </div>
            ))}
            {booking.discountAmount > 0 && (
              <div className="flex items-center justify-between border-b border-border py-2 text-sm text-success">
                <span>Coupon ({booking.couponCode})</span>
                <span className="font-mono">−{formatInr(booking.discountAmount)}</span>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between pt-2 text-sm font-semibold">
              <span className="text-ink">Total</span>
              <span className="font-mono text-brand-dark">{formatInr(booking.totalAmount)}</span>
            </div>
          </div>
        </div>

        <AdminBookingDetail
          bookingId={booking.id}
          status={booking.status}
          adminNote={booking.adminNote ?? ""}
          reportFile={booking.reportFile}
          bookingCode={booking.bookingCode}
        />
      </div>
    </div>
  );
}

function Field({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : undefined}>
      <dt className="text-xs text-ink-faint">{label}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  );
}
