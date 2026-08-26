import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminWhatsAppThread } from "@/components/AdminWhatsAppThread";

export default async function AdminWhatsAppThreadPage({
  params,
}: {
  params: Promise<{ phone: string }>;
}) {
  const { phone } = await params;
  const conversation = await prisma.whatsAppConversation.findUnique({
    where: { phone },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) notFound();

  return (
    <div>
      <Link href="/admin/whatsapp" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
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
