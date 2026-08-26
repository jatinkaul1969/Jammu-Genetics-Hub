import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarClock, MapPin, Phone, FileDown, Receipt, CreditCard } from "lucide-react";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { STATUS_LABEL, STATUS_STYLE } from "@/lib/booking-status";
import { PickupTracker } from "@/components/PickupTracker";

export default async function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-ink-soft">Log in to see this booking.</p>
      </div>
    );
  }

  const booking = await prisma.booking.findFirst({
    where: { id, userId: user.id },
    include: { items: true },
  });
  if (!booking) notFound();

  const lab = await prisma.lab.findUnique({ where: { id: booking.labId } });

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <Link href="/account/bookings" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={15} /> All bookings
      </Link>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-surface-muted px-4 py-3">
          <div>
            <p className="font-mono text-xs text-ink-faint">Booking ID</p>
            <p className="font-mono text-sm font-semibold text-ink">{booking.bookingCode}</p>
          </div>
          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLE[booking.status] ?? ""}`}>
            {STATUS_LABEL[booking.status] ?? booking.status}
          </span>
        </div>

        <div className="space-y-3 px-4 py-4 text-sm">
          <Field icon={<Receipt size={15} />} label="Lab">
            {lab?.name ?? "—"}
          </Field>
          <Field icon={<CalendarClock size={15} />} label="Collection date &amp; time">
            {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            {" · "}
            {booking.scheduledSlot}
          </Field>
          <Field icon={<MapPin size={15} />} label="Collection address">
            {booking.addressLine}, {booking.city} – {booking.pincode}
          </Field>
          <Field icon={<Phone size={15} />} label="Patient">
            {booking.patientName} ({booking.patientAge} yrs) · +91 {booking.phone}
          </Field>
          <Field icon={<CreditCard size={15} />} label="Payment">
            {booking.paymentStatus === "PAID"
              ? `Paid online${booking.paymentMethod ? ` via ${booking.paymentMethod}` : ""}`
              : "Pay on collection (cash/UPI to the phlebotomist)"}
          </Field>
        </div>

        <div className="border-t border-border px-4 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">Items</p>
          {booking.items.map((item) => (
            <div key={item.id} className="flex items-center justify-between py-1 text-sm">
              <span className="text-ink-soft">{item.productName}</span>
              <span className="font-mono text-ink">{formatInr(item.price)}</span>
            </div>
          ))}
          {booking.discountAmount > 0 && (
            <div className="flex items-center justify-between py-1 text-sm text-success">
              <span>{booking.discountKind === "MEMBERSHIP" ? "Membership discount" : `Coupon applied (${booking.couponCode})`}</span>
              <span className="font-mono">−{formatInr(booking.discountAmount)}</span>
            </div>
          )}
          {booking.diagnosticFee > 0 && (
            <div className="flex items-center justify-between py-1 text-sm text-ink-soft">
              <span>Diagnostic fee</span>
              <span className="font-mono">{formatInr(booking.diagnosticFee)}</span>
            </div>
          )}
          {booking.expressFee > 0 && (
            <div className="flex items-center justify-between py-1 text-sm text-ink-soft">
              <span>Express fee (same-day)</span>
              <span className="font-mono">{formatInr(booking.expressFee)}</span>
            </div>
          )}
          {booking.hardCopyFee > 0 && (
            <div className="flex items-center justify-between py-1 text-sm text-ink-soft">
              <span>Hard copy reports</span>
              <span className="font-mono">{formatInr(booking.hardCopyFee)}</span>
            </div>
          )}
          {booking.membershipFee > 0 && (
            <div className="flex items-center justify-between py-1 text-sm text-ink-soft">
              <span>Membership</span>
              <span className="font-mono">{formatInr(booking.membershipFee)}</span>
            </div>
          )}
          <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
            <span className="text-ink">Amount paid</span>
            <span className="font-mono text-brand-dark">{formatInr(booking.totalAmount)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
          <Link
            href={`/account/bookings/${booking.id}/invoice`}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold text-ink hover:border-brand hover:text-brand"
          >
            <Receipt size={14} /> View invoice
          </Link>
          {booking.reportFile && (
            <a
              href={`/api/reports/${booking.bookingCode}`}
              className="flex items-center gap-1.5 rounded-lg bg-brand-soft px-3 py-2 text-xs font-semibold text-brand-dark hover:bg-brand hover:text-white"
            >
              <FileDown size={14} /> Download report
            </a>
          )}
        </div>
      </div>

      {lab?.isOwn && (booking.status === "PENDING" || booking.status === "CONFIRMED") && (
        <div className="mt-4">
          <PickupTracker bookingId={booking.id} />
        </div>
      )}
    </div>
  );
}

function Field({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 text-brand">{icon}</span>
      <div>
        <p className="text-xs text-ink-faint">{label}</p>
        <p className="text-ink">{children}</p>
      </div>
    </div>
  );
}
