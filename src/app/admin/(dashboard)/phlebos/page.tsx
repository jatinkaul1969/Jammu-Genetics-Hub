import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";

const OPEN_STATUSES = ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED"];

export default async function AdminPhlebosPage() {
  const phlebos = await prisma.phlebo.findMany({
    orderBy: { createdAt: "asc" },
    include: { bookings: { where: { phleboStatus: { in: OPEN_STATUSES } }, select: { id: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Phlebotomists</h2>
          <p className="text-sm text-ink-soft">
            Pickups for Jammu Genetics Hub bookings are auto-assigned round-robin to whoever&apos;s online with the
            fewest open pickups that day.
          </p>
        </div>
        <Link
          href="/admin/phlebos/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <Plus size={15} /> Add phlebotomist
        </Link>
      </div>

      {phlebos.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No phlebotomist accounts yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {phlebos.map((p) => (
            <Link
              key={p.id}
              href={`/admin/phlebos/${p.id}`}
              className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg"
            >
              <div>
                <p className="font-medium text-ink">{p.name}</p>
                <p className="text-xs text-ink-faint">@{p.username} · +91 {p.phone}</p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className={p.enabled ? "text-success" : "text-ink-faint"}>{p.enabled ? "Enabled" : "Disabled"}</span>
                <span className={p.online ? "text-success" : "text-ink-faint"}>{p.online ? "Online" : "Offline"}</span>
                <span className="text-ink-faint">{p.bookings.length} open pickups</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
