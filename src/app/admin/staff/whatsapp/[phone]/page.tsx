import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { AdminWhatsAppThread } from "@/components/AdminWhatsAppThread";

export default async function StaffWhatsAppThreadPage({ params }: { params: Promise<{ phone: string }> }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");
  if (!parsePermissions(staff.permissionsJson).includes("whatsapp")) redirect("/admin/staff");

  const { phone } = await params;
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { phone },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
  if (!conversation) notFound();

  return (
    <div>
      <Link href="/admin/staff/whatsapp" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> All WhatsApp chats
      </Link>
      <AdminWhatsAppThread
        phone={conversation.phone}
        botPaused={conversation.botPaused}
        messages={conversation.messages.map((m) => ({
          id: m.id,
          direction: m.direction as "IN" | "OUT",
          sender: m.sender as "customer" | "bot" | "admin",
          body: m.body,
          createdAt: m.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
