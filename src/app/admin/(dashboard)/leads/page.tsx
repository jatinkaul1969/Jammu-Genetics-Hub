import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LEAD_STATUS_LABEL as STATUS_LABEL, LEAD_STATUS_STYLE as STATUS_STYLE } from "@/lib/lead-status";

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { assignedTo: { select: { name: true } } },
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">Callback Requests</h2>
        <p className="text-sm text-ink-soft">
          Leads captured from the &ldquo;Request a callback&rdquo; widget, auto-assigned round-robin to online
          support staff — see <Link href="/admin/team" className="text-brand hover:underline">Team</Link> to manage
          who&apos;s eligible.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No callback requests yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_auto] gap-3 border-b border-border bg-surface-muted px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint sm:grid">
            <span>Name</span>
            <span>City / Area</span>
            <span>Status</span>
            <span>Assigned to</span>
            <span className="text-right">Requested</span>
          </div>
          {leads.map((l) => (
            <Link
              key={l.id}
              href={`/admin/leads/${l.id}`}
              className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg sm:grid-cols-[1fr_1fr_1fr_1fr_auto] sm:items-center"
            >
              <span className="text-ink">
                {l.name} <span className="text-ink-faint">· +91 {l.phone}</span>
              </span>
              <span className="text-ink-soft">
                {l.area}, {l.city}
              </span>
              <span className={`w-fit rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[l.status] ?? ""}`}>
                {STATUS_LABEL[l.status] ?? l.status}
              </span>
              <span className="text-ink-soft">{l.assignedTo?.name ?? "Unassigned"}</span>
              <span className="text-right text-xs text-ink-faint">
                {l.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                {l.createdAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
