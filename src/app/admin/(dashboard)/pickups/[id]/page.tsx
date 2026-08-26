import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PickupLiveDetail } from "@/components/PickupLiveDetail";
import { PickupReassign } from "@/components/PickupReassign";

export default async function AdminPickupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [booking, phlebos] = await Promise.all([
    prisma.booking.findUnique({ where: { id } }),
    prisma.phlebo.findMany({ where: { enabled: true }, orderBy: { name: "asc" } }),
  ]);
  if (!booking) notFound();

  return (
    <div>
      <Link href="/admin/pickups" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> All pickups
      </Link>

      <div className="mb-4 rounded-xl border border-border bg-surface p-4">
        <p className="font-mono text-xs text-ink-faint">{booking.bookingCode}</p>
        <h2 className="mb-1 font-display text-lg font-semibold text-ink">
          {booking.patientName} <span className="text-sm font-normal text-ink-faint">({booking.patientAge} yrs)</span>
        </h2>
        <p className="text-sm text-ink-soft">
          {new Date(booking.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
          {booking.scheduledSlot} · {booking.addressLine}, {booking.city}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <PickupLiveDetail bookingId={booking.id} />
        <PickupReassign
          bookingId={booking.id}
          phleboId={booking.phleboId}
          phlebos={phlebos.map((p) => ({ id: p.id, name: p.name, online: p.online }))}
          canPickManually
        />
      </div>
    </div>
  );
}
