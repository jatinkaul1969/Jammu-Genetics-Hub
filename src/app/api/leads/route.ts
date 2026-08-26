import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignLeadToStaff } from "@/lib/lead-assignment";

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

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (isRateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many requests — please try again shortly." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const city = typeof body?.city === "string" ? body.city.trim() : "";
  const area = typeof body?.area === "string" ? body.area.trim() : "";

  if (!name || !/^[6-9]\d{9}$/.test(phone) || !city || !area) {
    return NextResponse.json({ ok: false, error: "Please fill in all fields with a valid 10-digit phone number." }, { status: 400 });
  }

  const lead = await prisma.lead.create({ data: { name, phone, city, area } });
  await assignLeadToStaff(lead.id);

  return NextResponse.json({ ok: true });
}
