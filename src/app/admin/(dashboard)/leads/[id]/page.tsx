import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { LeadDetail } from "@/components/LeadDetail";
import { LeadReassign } from "@/components/LeadReassign";

export default async function AdminLeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [lead, staff] = await Promise.all([
    prisma.lead.findUnique({
      where: { id },
      include: {
        assignedTo: { select: { name: true } },
        notes: { orderBy: { createdAt: "asc" }, include: { admin: { select: { name: true } } } },
      },
    }),
    prisma.adminUser.findMany({ where: { enabled: true }, orderBy: { name: "asc" } }),
  ]);
  if (!lead) notFound();

  return (
    <div>
      <Link href="/admin/leads" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> All callback requests
      </Link>

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <LeadDetail
          leadId={lead.id}
          name={lead.name}
          phone={lead.phone}
          city={lead.city}
          area={lead.area}
          status={lead.status}
          assignedToName={lead.assignedTo?.name ?? null}
          notes={lead.notes.map((n) => ({
            id: n.id,
            body: n.body,
            createdAt: n.createdAt.toISOString(),
            adminName: n.admin?.name ?? null,
          }))}
        />

        <LeadReassign
          leadId={lead.id}
          assignedToId={lead.assignedToId}
          staff={staff.map((s) => ({ id: s.id, name: s.name, online: s.online }))}
        />
      </div>
    </div>
  );
}
