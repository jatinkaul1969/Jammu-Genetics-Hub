import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAuthorizedCronRequest } from "@/lib/cron-auth";
import { notifyOwner, ownerAlertChannels } from "@/lib/notify-owner";
import { SITE_URL } from "@/lib/site-url";
import { buildPlan, studioPath } from "@/lib/social/calendar";
import { TEMPLATES } from "@/lib/social/templates";

export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;
const inr = (n: number) => `₹${new Intl.NumberFormat("en-IN").format(n)}`;

// A short morning summary for the owner: what came in yesterday, who is still
// waiting for a first call, which carts were left open — and today's post idea,
// linked straight into the Social Studio. Run once a day by a scheduler (see
// .github/workflows/scheduled-jobs.yml and the README).
//
// Unlike the other cron routes this one sends a message each time it runs, so
// in production it refuses to run unless CRON_SECRET is set.
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production" && !process.env.CRON_SECRET) {
    return NextResponse.json({ ok: false, error: "Set CRON_SECRET first." }, { status: 503 });
  }
  if (!isAuthorizedCronRequest(req)) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const now = Date.now();
  const since = new Date(now - 24 * HOUR);
  const [leadGroups, waiting, bookings, chats, carts] = await Promise.all([
    prisma.lead.groupBy({ by: ["source"], where: { createdAt: { gte: since } }, _count: { _all: true } }),
    prisma.lead.count({ where: { status: "NEW", createdAt: { lt: new Date(now - 4 * HOUR) } } }),
    prisma.booking.findMany({ where: { createdAt: { gte: since }, status: { not: "CANCELLED" } }, select: { totalAmount: true } }),
    prisma.whatsAppConversation.count({ where: { createdAt: { gte: since } } }),
    prisma.cartSnapshot.count({ where: { updatedAt: { gte: new Date(now - 72 * HOUR), lt: new Date(now - 2 * HOUR) } } }),
  ]);

  const leadCount = leadGroups.reduce((n, g) => n + g._count._all, 0);
  const by = (s: string) => leadGroups.find((g) => g.source === s)?._count._all ?? 0;
  const revenue = bookings.reduce((n, b) => n + b.totalAmount, 0);

  // Today's post, by India time (the digest runs at about 8 am IST).
  const ist = new Date(now + 5.5 * HOUR);
  const todayStart = new Date(ist.getUTCFullYear(), ist.getUTCMonth(), ist.getUTCDate());
  const iso = `${ist.getUTCFullYear()}-${String(ist.getUTCMonth() + 1).padStart(2, "0")}-${String(ist.getUTCDate()).padStart(2, "0")}`;
  const post = buildPlan(todayStart, 1).find((p) => p.date === iso);

  await notifyOwner({
    title: `📊 Jammu Genetics Hub — yesterday`,
    lines: [
      `New enquiries: ${leadCount}${leadCount ? ` (callback ${by("search_widget")}, geneticist ${by("geneticist_request")}, doctors ${by("doctor_partner")})` : ""}`,
      `New bookings: ${bookings.length}${bookings.length ? ` (${inr(revenue)})` : ""}`,
      `New WhatsApp chats: ${chats}`,
      waiting > 0 && `⏰ ${waiting} enquiries still waiting for a first call: ${SITE_URL}/admin/leads`,
      carts > 0 && `🛒 ${carts} carts left open: ${SITE_URL}/admin/abandoned-carts`,
      "",
      post
        ? `📝 Today's post: ${TEMPLATES.find((t) => t.id === post.template)?.label ?? post.template}${post.awareness ? ` (${post.awareness})` : ""}\n${SITE_URL}${studioPath(post)}`
        : "📝 Today is a rest day for posting.",
    ],
  });

  return NextResponse.json({ ok: true, leads: leadCount, bookings: bookings.length, chats, waiting, carts, delivered: ownerAlertChannels() });
}
