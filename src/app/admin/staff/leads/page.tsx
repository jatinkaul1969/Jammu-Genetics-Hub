import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { LEAD_STATUS_LABEL as STATUS_LABEL, LEAD_STATUS_STYLE as STATUS_STYLE } from "@/lib/lead-status";
const OPEN_STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP"];

export default async function StaffLeadsPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");
  if (!parsePermissions(staff.permissionsJson).includes("leads")) redirect("/admin/staff");

  const leads = await prisma.lead.findMany({
    where: { assignedToId: staff.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  const open = leads.filter((l) => OPEN_STATUSES.includes(l.status));
  const closed = leads.filter((l) => !OPEN_STATUSES.includes(l.status));

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">My Callback Requests</h2>
        <p className="text-sm text-ink-soft">
          {open.length} open · new requests are assigned to you automatically while you&apos;re online.
        </p>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          Nothing assigned to you yet. Go online to start receiving callback requests.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {[...open, ...closed].map((l) => (
            <Link
              key={l.id}
              href={`/admin/staff/leads/${l.id}`}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg"
            >
              <div>
                <p className="text-ink">
                  {l.name} <span className="text-ink-faint">· +91 {l.phone}</span>
                </p>
                <p className="text-xs text-ink-faint">{l.area}, {l.city}</p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLE[l.status] ?? ""}`}>
                {STATUS_LABEL[l.status] ?? l.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
