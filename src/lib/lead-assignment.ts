import { prisma } from "@/lib/prisma";
import { parsePermissions } from "@/lib/permissions";

const OPEN_STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP"];

// Round-robin by current workload: among staff who are online, enabled, and
// granted the "leads" permission, assign to whoever has the fewest OPEN
// leads right now — so closing your tickets is what makes you eligible for
// the next one. Ties (e.g. everyone at 0) break on whoever was assigned
// least recently, so a fresh empty queue still rotates fairly across staff.
export async function assignLeadToStaff(leadId: string) {
  const candidates = await prisma.adminUser.findMany({
    where: { enabled: true, online: true },
    include: { assignedLeads: { where: { status: { in: OPEN_STATUSES } }, select: { id: true } } },
  });

  const eligible = candidates.filter((c) => parsePermissions(c.permissionsJson).includes("leads"));
  if (eligible.length === 0) return null;

  eligible.sort((a, b) => {
    const openDiff = a.assignedLeads.length - b.assignedLeads.length;
    if (openDiff !== 0) return openDiff;
    const aTime = a.lastAssignedAt?.getTime() ?? 0;
    const bTime = b.lastAssignedAt?.getTime() ?? 0;
    return aTime - bTime;
  });

  const chosen = eligible[0];
  await prisma.$transaction([
    prisma.lead.update({ where: { id: leadId }, data: { assignedToId: chosen.id } }),
    prisma.adminUser.update({ where: { id: chosen.id }, data: { lastAssignedAt: new Date() } }),
  ]);

  return chosen.id;
}
