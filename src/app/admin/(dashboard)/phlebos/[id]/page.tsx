import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PhleboEditForm } from "@/components/PhleboEditForm";

export default async function AdminPhleboEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const phlebo = await prisma.phlebo.findUnique({ where: { id } });
  if (!phlebo) notFound();

  return (
    <div>
      <Link href="/admin/phlebos" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> Back to phlebotomists
      </Link>
      <PhleboEditForm
        phleboId={phlebo.id}
        initial={{ name: phlebo.name, username: phlebo.username, phone: phlebo.phone, enabled: phlebo.enabled }}
      />
    </div>
  );
}
