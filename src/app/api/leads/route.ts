import { after, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignLeadToStaff } from "@/lib/lead-assignment";
import { notifyOwner } from "@/lib/notify-owner";
import { sendWhatsAppTemplate } from "@/lib/whatsapp-cloud";
import { SITE_URL } from "@/lib/site-url";
import { parseAttribution } from "@/lib/parse-attribution";

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5;
const requestLog = new Map<string, number[]>();

function isRateLimited(ip: string) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT_MAX;
}

// Forms other than the plain "request a callback" widget tag their leads, so
// the team knows what the person is after. These are the accepted tags.
const SOURCES = {
  geneticist_request: { label: "geneticist request", note: "Wants to speak to a geneticist about" },
  doctor_partner: { label: "doctor / clinic enquiry", note: "Doctor / clinic enquiry" },
} as const;
type SourceKey = keyof typeof SOURCES;

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests — please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 100) : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim().slice(0, 60) : "";
  // Tagged leads (geneticist request, doctor enquiry) have no "area" to ask for,
  // and the person's topic is saved as a note so whoever calls back knows what
  // they want to talk about.
  const source: SourceKey | undefined = typeof body?.source === "string" && Object.hasOwn(SOURCES, body.source) ? (body.source as SourceKey) : undefined;
  const topic = typeof body?.topic === "string" ? body.topic.trim().slice(0, 400) : "";
  const area = typeof body?.area === "string" && body.area.trim() ? body.area.trim().slice(0, 120) : source ? "—" : "";
  const from = parseAttribution(body?.attribution);

  if (!name || !/^[6-9]\d{9}$/.test(phone) || !city || !area) {
    return NextResponse.json({ ok: false, error: "Please fill in all fields with a valid 10-digit phone number." }, { status: 400 });
  }

  const lead = await prisma.lead.create({ data: { name, phone, city, area, ...(source ? { source } : {}) } });
  const notes: string[] = [];
  if (source && topic) notes.push(`${SOURCES[source].note}: ${topic}`);
  if (from) notes.push(`Came from: ${from}`);
  for (const text of notes) await prisma.leadNote.create({ data: { leadId: lead.id, body: text } });
  await assignLeadToStaff(lead.id);

  // After the response is sent: ping the owner, and (only if a template is set
  // up — see README) acknowledge the person on WhatsApp.
  after(async () => {
    await notifyOwner({
      title: `🔔 New ${source ? SOURCES[source].label : "callback request"}`,
      lines: [
        `${name} — +91 ${phone}`,
        `WhatsApp: https://wa.me/91${phone}`,
        `${city}${area !== "—" ? `, ${area}` : ""}`,
        topic && `About: ${topic}`,
        from && `Came from: ${from}`,
        `Open: ${SITE_URL}/admin/leads/${lead.id}`,
      ],
    });
    const template = process.env.WHATSAPP_LEAD_TEMPLATE_NAME;
    if (template && source !== "doctor_partner") await sendWhatsAppTemplate(`91${phone}`, template, [name.split(/\s+/)[0]]);
  });

  return NextResponse.json({ ok: true });
}
