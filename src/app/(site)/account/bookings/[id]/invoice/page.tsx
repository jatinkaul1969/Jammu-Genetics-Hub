import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { InvoicePrintButton } from "@/components/InvoicePrintButton";

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-ink-soft">Log in to see this invoice.</p>
      </div>
    );
  }

  const booking = await prisma.booking.findFirst({
    where: { id, userId: user.id },
    include: { items: true },
  });
  if (!booking) notFound();

  const lab = await prisma.lab.findUnique({ where: { id: booking.labId } });
  const subtotal = booking.items.reduce((s, i) => s + i.price, 0);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="no-print mb-4 flex items-center justify-between">
        <Link href={`/account/bookings/${booking.id}`} className="text-sm text-ink-soft hover:text-brand">
          ← Back to booking
        </Link>
        <InvoicePrintButton />
      </div>

      <div className="rounded-xl border border-border bg-surface p-6 sm:p-8">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
          <div>
            <p className="font-display text-lg font-semibold text-ink">Jammu Genetics Hub</p>
            <p className="text-xs text-ink-faint">genetics.jammu@gmail.com · +91 9086567018</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-faint">Invoice / Booking ID</p>
            <p className="font-mono text-sm font-semibold text-ink">{booking.bookingCode}</p>
            <p className="mt-1 text-xs text-ink-faint">
              Issued {booking.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <div className="mb-6 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Billed to</p>
            <p className="text-sm text-ink">{booking.patientName} ({booking.patientAge} yrs)</p>
            <p className="text-sm text-ink-soft">+91 {booking.phone}</p>
            <p className="text-sm text-ink-soft">{booking.addressLine}, {booking.city} – {booking.pincode}</p>
          </div>
          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">Sample collection</p>
            <p className="text-sm text-ink">
              {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
            </p>
            <p className="text-sm text-ink-soft">{booking.scheduledSlot}</p>
            <p className="text-sm text-ink-soft">Lab: {lab?.name ?? "—"}</p>
          </div>
        </div>

        <table className="mb-6 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-ink-faint">
              <th className="pb-2 font-medium">Test / Package</th>
              <th className="pb-2 text-right font-medium">MRP</th>
              <th className="pb-2 text-right font-medium">Amount</th>
            </tr>
          </thead>
          <tbody>
            {booking.items.map((item) => (
              <tr key={item.id} className="border-b border-border">
                <td className="py-2 text-ink-soft">{item.productName}</td>
                <td className="py-2 text-right font-mono text-ink-faint line-through">{formatInr(item.mrp)}</td>
                <td className="py-2 text-right font-mono text-ink">{formatInr(item.price)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="ml-auto max-w-[260px] space-y-1.5 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-ink-soft">Subtotal</span>
            <span className="font-mono text-ink">{formatInr(subtotal)}</span>
          </div>
          {booking.discountAmount > 0 && (
            <div className="flex items-center justify-between text-success">
              <span>{booking.discountKind === "MEMBERSHIP" ? "Membership discount" : `Coupon (${booking.couponCode})`}</span>
              <span className="font-mono">−{formatInr(booking.discountAmount)}</span>
            </div>
          )}
          {booking.diagnosticFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Diagnostic fee</span>
              <span className="font-mono text-ink">{formatInr(booking.diagnosticFee)}</span>
            </div>
          )}
          {booking.expressFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Express fee (same-day)</span>
              <span className="font-mono text-ink">{formatInr(booking.expressFee)}</span>
            </div>
          )}
          {booking.hardCopyFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Hard copy reports</span>
              <span className="font-mono text-ink">{formatInr(booking.hardCopyFee)}</span>
            </div>
          )}
          {booking.membershipFee > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-ink-soft">Membership</span>
              <span className="font-mono text-ink">{formatInr(booking.membershipFee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between border-t border-border pt-1.5 text-base font-semibold">
            <span className="text-ink">Total paid</span>
            <span className="font-mono text-brand-dark">{formatInr(booking.totalAmount)}</span>
          </div>
          <p className="pt-1 text-right text-xs text-ink-faint">
            {booking.paymentStatus === "PAID"
              ? `Paid online${booking.paymentMethod ? ` (${booking.paymentMethod})` : ""}`
              : "Payable on collection"}
          </p>
        </div>

        <p className="mt-8 border-t border-border pt-4 text-center text-[11px] text-ink-faint">
          This is a system-generated invoice from Jammu Genetics Hub for booking {booking.bookingCode}. Prices shown
          are for the lab selected at booking; report turnaround and terms follow that lab&apos;s own policy.
        </p>
      </div>
    </div>
  );
}
