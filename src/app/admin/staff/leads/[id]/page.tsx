import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { LeadDetail } from "@/components/LeadDetail";

export default async function StaffLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");
  if (!parsePermissions(staff.permissionsJson).includes("leads")) redirect("/admin/staff");

  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: { id },
    include: { notes: { orderBy: { createdAt: "asc" }, include: { admin: { select: { name: true } } } } },
  });
  if (!lead || lead.assignedToId !== staff.id) notFound();

  return (
    <div>
      <Link href="/admin/staff/leads" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> My callback requests
      </Link>

      <div className="max-w-2xl">
        <LeadDetail
          leadId={lead.id}
          name={lead.name}
          phone={lead.phone}
          city={lead.city}
          area={lead.area}
          status={lead.status}
          assignedToName={null}
          notes={lead.notes.map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.createdAt.toISOString(),
            adminName: n.admin?.name ?? null,
          }))}
        />
      </div>
    </div>
  );
}
