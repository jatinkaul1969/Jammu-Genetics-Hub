import Link from "next/link";
import { CheckCircle2, MapPin, CalendarClock, Phone } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { formatInr } from "@/lib/format";
import { razorpayConfigured } from "@/lib/razorpay";
import { RazorpayPayButton } from "@/components/RazorpayPayButton";

export default async function BookingConfirmedPage({
  searchParams,
}: {
  searchParams: Promise<{ codes?: string }>;
}) {
  const { codes } = await searchParams;
  const user = await getCurrentUser();
  const codeList = codes ? codes.split(",").filter(Boolean) : [];

  const bookings = user
    ? await prisma.booking.findMany({
        where: { bookingCode: { in: codeList }, userId: user.id },
        include: { items: true },
      })
    : [];

  const labIds = [...new Set(bookings.map((b) => b.labId))];
  const labs = await prisma.lab.findMany({ where: { id: { in: labIds } } });
  const labMap = new Map(labs.map((l) => [l.id, l]));

  if (bookings.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-ink-soft">We couldn&apos;t find that booking.</p>
        <Link href="/" className="mt-4 inline-block text-sm font-medium text-brand hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="mb-8 text-center">
        <CheckCircle2 className="mx-auto mb-3 text-brand" size={44} />
        <h1 className="font-display text-2xl font-semibold text-ink">Booking confirmed</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {bookings.length > 1
            ? `Your ${bookings.length} bookings are set — separate phlebotomist visits will be scheduled per lab.`
            : "A phlebotomist will visit you at the scheduled time."}
        </p>
      </div>

      <div className="space-y-4">
        {bookings.map((b) => {
          const lab = labMap.get(b.labId);
          return (
            <div key={b.id} className="overflow-hidden rounded-xl border border-border bg-surface">
              <div className="flex items-center justify-between border-b border-border bg-surface-muted px-4 py-3">
                <div>
                  <p className="font-mono text-xs text-ink-faint">Booking ID</p>
                  <p className="font-mono text-sm font-semibold text-ink">{b.bookingCode}</p>
                </div>
                <span
                  className="rounded-lg px-2.5 py-1 text-xs font-semibold text-white"
                  style={{ backgroundColor: lab?.colorHex ?? "#0b6e5c" }}
                >
                  {lab?.name ?? "Lab"}
                </span>
              </div>

              <div className="space-y-2.5 px-4 py-4 text-sm">
                <p className="flex items-center gap-2 text-ink-soft">
                  <CalendarClock size={15} className="text-brand" />
                  {new Date(b.scheduledDate).toLocaleDateString("en-IN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  · {b.scheduledSlot}
                </p>
                <p className="flex items-center gap-2 text-ink-soft">
                  <MapPin size={15} className="text-brand" />
                  {b.addressLine}, {b.city} – {b.pincode}
                </p>
                <p className="flex items-center gap-2 text-ink-soft">
                  <Phone size={15} className="text-brand" />
                  {b.patientName} ({b.patientAge} yrs) · +91 {b.phone}
                </p>
              </div>

              <div className="border-t border-border px-4 py-3">
                {b.items.map((item) => (
                  <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                    <span className="text-ink-soft">{item.productName}</span>
                    <span className="font-mono text-ink">{formatInr(item.price)}</span>
                  </div>
                ))}
                {b.discountAmount > 0 && (
                  <div className="flex items-center justify-between py-1 text-sm text-success">
                    <span>{b.discountKind === "MEMBERSHIP" ? "Membership discount" : `Coupon (${b.couponCode})`}</span>
                    <span className="font-mono">−{formatInr(b.discountAmount)}</span>
                  </div>
                )}
                {b.diagnosticFee > 0 && (
                  <div className="flex items-center justify-between py-1 text-sm text-ink-soft">
                    <span>Diagnostic fee</span>
                    <span className="font-mono">{formatInr(b.diagnosticFee)}</span>
                  </div>
                )}
                {b.expressFee > 0 && (
                  <div className="flex items-center justify-between py-1 text-sm text-ink-soft">
                    <span>Express fee (same-day)</span>
                    <span className="font-mono">{formatInr(b.expressFee)}</span>
                  </div>
                )}
                {b.hardCopyFee > 0 && (
                  <div className="flex items-center justify-between py-1 text-sm text-ink-soft">
                    <span>Hard copy reports</span>
                    <span className="font-mono">{formatInr(b.hardCopyFee)}</span>
                  </div>
                )}
                {b.membershipFee > 0 && (
                  <div className="flex items-center justify-between py-1 text-sm text-ink-soft">
                    <span>Membership</span>
                    <span className="font-mono">{formatInr(b.membershipFee)}</span>
                  </div>
                )}
                <div className="mt-2 flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                  <span className="text-ink">Total</span>
                  <span className="font-mono text-brand-dark">{formatInr(b.totalAmount)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {razorpayConfigured && bookings.every((b) => b.paymentStatus === "UNPAID") && (
        <div className="mt-6 rounded-xl border border-border bg-surface p-4">
          <RazorpayPayButton
            bookingCodes={bookings.map((b) => b.bookingCode)}
            amount={bookings.reduce((sum, b) => sum + b.totalAmount, 0)}
          />
        </div>
      )}

      <div className="mt-8 flex justify-center gap-3">
        <Link href="/account/bookings" className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand">
          View all bookings
        </Link>
        <Link href="/search" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
          Book another test
        </Link>
      </div>
    </div>
  );
}
