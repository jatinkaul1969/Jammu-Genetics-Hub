import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Navigation, Phone } from "lucide-react";
import { getCurrentPhlebo } from "@/lib/phlebo-session";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { isPickupCancellable } from "@/lib/pickup-time";
import { PhleboPickupActions } from "@/components/PhleboPickupActions";

const CANCEL_CUTOFF_MS = 60 * 60 * 1000;

export default async function PhleboPickupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const phlebo = await getCurrentPhlebo();
  if (!phlebo) redirect("/admin/phlebo-login");

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id }, include: { items: true } });
  if (!booking || booking.phleboId !== phlebo.id) notFound();

  const cancellable = isPickupCancellable(booking.scheduledDate, booking.scheduledSlot, CANCEL_CUTOFF_MS);

  return (
    <div>
      <Link href="/admin/phlebo/pickups" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> My pickups
      </Link>

      <div className="space-y-4">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="mb-1 font-mono text-xs text-ink-faint">{booking.bookingCode}</p>
          <h2 className="mb-3 font-display text-lg font-semibold text-ink">
            {booking.patientName} <span className="text-sm font-normal text-ink-faint">({booking.patientAge} yrs)</span>
          </h2>

          <div className="mb-3 space-y-2 text-sm">
            <p className="text-ink-soft">
              {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
              {booking.scheduledSlot}
            </p>
            <p className="text-ink-soft">
              {booking.addressLine}, {booking.city} – {booking.pincode}
            </p>
            <a href={`tel:+91${booking.phone}`} className="flex items-center gap-1.5 text-brand hover:underline">
              <Phone size={13} /> +91 {booking.phone}
            </a>
            {booking.latitude !== null && booking.longitude !== null && (
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${booking.latitude},${booking.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-fit items-center gap-1.5 rounded-full bg-brand-soft px-2.5 py-1 text-xs font-medium text-brand-dark hover:bg-brand hover:text-white"
              >
                <Navigation size={12} /> Get directions
              </a>
            )}
          </div>

          <div className="border-t border-border pt-2">
            {booking.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1 text-sm">
                <span className="text-ink-soft">{item.productName}</span>
                <span className="font-mono text-ink">{formatInr(item.price)}</span>
              </div>
            ))}
          </div>
        </div>

        <PhleboPickupActions bookingId={booking.id} status={booking.phleboStatus} cancellable={cancellable} />
      </div>
    </div>
  );
}
