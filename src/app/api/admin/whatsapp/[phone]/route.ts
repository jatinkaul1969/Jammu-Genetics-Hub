import { prisma } from "@/lib/prisma";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";

// Toggles whether the bot is allowed to auto-reply on this conversation —
// used to resume it after an admin has finished handling something manually.
export async function PATCH(req: Request, { params }: { params: Promise<{ phone: string }> }) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "whatsapp")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { phone } = await params;
  const body = await req.json().catch(() => null);
  if (typeof body?.botPaused !== "boolean") {
    return Response.json({ error: "botPaused must be a boolean" }, { status: 400 });
  }

  const conversation = await prisma.whatsAppConversation.update({
    where: { phone },
    data: { botPaused: body.botPaused },
  });

  return Response.json({ botPaused: conversation.botPaused });
}
