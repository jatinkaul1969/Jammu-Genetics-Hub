import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { PickupLiveDetail } from "@/components/PickupLiveDetail";
import { PickupReassign } from "@/components/PickupReassign";

export default async function StaffPickupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");
  if (!parsePermissions(staff.permissionsJson).includes("pickups")) redirect("/admin/staff");

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) notFound();

  return (
    <div>
      <Link href="/admin/staff/pickups" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
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
        <PickupReassign bookingId={booking.id} phleboId={booking.phleboId} phlebos={[]} canPickManually={false} />
      </div>
    </div>
  );
}
