import { prisma } from "@/lib/prisma";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";
import { sendWhatsAppText } from "@/lib/whatsapp-cloud";

// A manual reply from an admin — sends it out over WhatsApp and pauses the
// bot on this conversation so it doesn't jump back in over a human.
export async function POST(req: Request, { params }: { params: Promise<{ phone: string }> }) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "whatsapp")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone } = await params;
  const body = await req.json().catch(() => null);
  const text = typeof body?.body === "string" ? body.body.trim() : "";
  if (!text || text.length > 4000) {
    return Response.json({ error: "Message must be 1-4000 characters." }, { status: 400 });
  }

  const conversation = await prisma.whatsAppConversation.upsert({
    where: { phone },
    create: { phone, botPaused: true },
    update: { botPaused: true },
  });

  await prisma.whatsAppMessage.create({
    data: { conversationId: conversation.id, direction: "OUT", sender: "admin", body: text },
  });

  await sendWhatsAppText(phone, text);

  return Response.json({ ok: true });
}
