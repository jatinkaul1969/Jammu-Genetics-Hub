import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { parsePermissions } from "@/lib/permissions";
import { StaffEditForm } from "@/components/StaffEditForm";

export default async function AdminStaffEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await prisma.adminUser.findUnique({ where: { id } });
  if (!staff) notFound();

  return (
    <div>
      <Link href="/admin/team" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> Back to team
      </Link>
      <StaffEditForm
        staffId={staff.id}
        initial={{
          name: staff.name,
          username: staff.username,
          enabled: staff.enabled,
          permissions: parsePermissions(staff.permissionsJson),
          team: staff.team,
        }}
      />
    </div>
  );
}
