import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parsePermissions, PERMISSIONS, STAFF_TEAMS } from "@/lib/permissions";

const OPEN_STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP"];

export default async function AdminTeamPage() {
  const staff = await prisma.adminUser.findMany({
    orderBy: { createdAt: "asc" },
    include: { assignedLeads: { where: { status: { in: OPEN_STATUSES } }, select: { id: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Team</h2>
          <p className="text-sm text-ink-soft">
            Give support staff a limited login — pick exactly which areas each person can access. Catalog, pricing
            and team management always stay owner-only.
          </p>
        </div>
        <Link
          href="/admin/team/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <Plus size={15} /> Add staff member
        </Link>
      </div>

      {staff.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No staff accounts yet — add one to delegate callback requests, WhatsApp, or bookings.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {staff.map((s) => {
            const perms = parsePermissions(s.permissionsJson);
            return (
              <Link
                key={s.id}
                href={`/admin/team/${s.id}`}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg"
              >
                <div>
                  <p className="flex items-center gap-1.5 font-medium text-ink">
                    {s.name} <span className="font-normal text-ink-faint">@{s.username}</span>
                    <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-ink-faint">
                      {STAFF_TEAMS.find((t) => t.key === s.team)?.label ?? s.team}
                    </span>
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {perms.length === 0 ? (
                      <span className="text-xs text-ink-faint">No access granted yet</span>
                    ) : (
                      perms.map((p) => (
                        <span key={p} className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-dark">
                          {PERMISSIONS.find((x) => x.key === p)?.label ?? p}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className={s.enabled ? "text-success" : "text-ink-faint"}>{s.enabled ? "Enabled" : "Disabled"}</span>
                  <span className={s.online ? "text-success" : "text-ink-faint"}>{s.online ? "Online" : "Offline"}</span>
                  <span className="text-ink-faint">{s.assignedLeads.length} open leads</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
