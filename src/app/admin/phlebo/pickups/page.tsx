import { redirect } from "next/navigation";
import Link from "next/link";
import { Navigation } from "lucide-react";
import { getCurrentPhlebo } from "@/lib/phlebo-session";
import { prisma } from "@/lib/prisma";

const STATUS_LABEL: Record<string, string> = {
  ASSIGNED: "New — needs your response",
  ACCEPTED: "Accepted",
  EN_ROUTE: "On the way",
  ARRIVED: "Arrived",
  COLLECTED: "Collected",
};
const STATUS_STYLE: Record<string, string> = {
  ASSIGNED: "bg-accent-soft text-accent",
  ACCEPTED: "bg-cat-blue-soft text-cat-blue",
  EN_ROUTE: "bg-cat-amber-soft text-cat-amber",
  ARRIVED: "bg-success-soft text-success",
  COLLECTED: "bg-surface-muted text-ink-faint",
};
const OPEN_STATUSES = ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED"];

export default async function PhleboPickupsPage() {
  const phlebo = await getCurrentPhlebo();
  if (!phlebo) redirect("/admin/phlebo-login");

  const pickups = await prisma.booking.findMany({
    where: { phleboId: phlebo.id },
    orderBy: [{ scheduledDate: "asc" }],
    take: 100,
  });
  const open = pickups.filter((p) => OPEN_STATUSES.includes(p.phleboStatus));
  const done = pickups.filter((p) => !OPEN_STATUSES.includes(p.phleboStatus));

  return (
    <div>
      <h2 className="mb-1 font-display text-lg font-semibold text-ink">My Pickups</h2>
      <p className="mb-5 text-sm text-ink-soft">{open.length} open — respond to new assignments and track progress.</p>

      {pickups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No pickups assigned yet. Go online to start receiving them.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {[...open, ...done].map((b) => (
            <Link
              key={b.id}
              href={`/admin/phlebo/pickups/${b.id}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg"
            >
              <div>
                <p className="text-ink">
                  {b.patientName} <span className="text-ink-faint">· {b.bookingCode}</span>
                </p>
                <p className="flex items-center gap-1 text-xs text-ink-faint">
                  <Navigation size={11} /> {b.city} ·{" "}
                  {new Date(b.scheduledDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} · {b.scheduledSlot}
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
