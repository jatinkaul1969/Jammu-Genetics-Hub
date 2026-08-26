import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PICKUP_STATUS_LABEL as STATUS_LABEL, PICKUP_STATUS_STYLE as STATUS_STYLE } from "@/lib/pickup-status";

export default async function AdminPickupsPage() {
  const labs = await prisma.lab.findMany({ where: { isOwn: true } });
  const labIds = labs.map((l) => l.id);

  const pickups = await prisma.booking.findMany({
    where: { labId: { in: labIds }, status: { notIn: ["CANCELLED"] } },
    include: { phlebo: { select: { name: true } } },
    orderBy: [{ scheduledDate: "asc" }],
    take: 150,
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">Phlebo Pickups</h2>
        <p className="text-sm text-ink-soft">
          Live status for every Jammu Genetics Hub pickup — open one to see the exact live location and to
          reassign if needed.
        </p>
      </div>

      {pickups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No pickups yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {pickups.map((b) => (
            <Link
              key={b.id}
              href={`/admin/pickups/${b.id}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg"
            >
              <div>
                <p className="text-ink">
                  {b.patientName} <span className="text-ink-faint">· {b.bookingCode}</span>
                </p>
                <p className="text-xs text-ink-faint">
                  {new Date(b.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {b.scheduledSlot} ·{" "}
                  {b.phlebo?.name ?? "No phlebo assigned"}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[b.phleboStatus] ?? ""}`}>
                {STATUS_LABEL[b.phleboStatus] ?? b.phleboStatus}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
