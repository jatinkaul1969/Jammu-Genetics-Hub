import { redirect } from "next/navigation";
import Link from "next/link";
import { Bot, UserRound } from "lucide-react";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function timeSince(date: Date) {
  const ms = Date.now() - date.getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

export default async function StaffWhatsAppPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");
  if (!parsePermissions(staff.permissionsJson).includes("whatsapp")) redirect("/admin/staff");

  const conversations = await prisma.whatsAppConversation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">WhatsApp Chats</h2>
        <p className="text-sm text-ink-soft">The bot answers automatically until it hands a conversation off to you.</p>
      </div>

      {conversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No WhatsApp conversations yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {conversations.map((c) => {
            const last = c.messages[0];
            return (
              <Link
                key={c.id}
                href={`/admin/staff/whatsapp/${c.phone}`}
                className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">+{c.phone}</p>
                  <p className="truncate text-xs text-ink-faint">{last ? last.body : "No messages yet"}</p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span
                    className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      c.botPaused ? "bg-accent-soft text-accent" : "bg-success-soft text-success"
                    }`}
                  >
                    {c.botPaused ? <UserRound size={11} /> : <Bot size={11} />}
                    {c.botPaused ? "Needs you" : "Bot active"}
                  </span>
                  <span className="text-xs text-ink-faint">{timeSince(c.updatedAt)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
