import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// A cell that starts with = + - @ can run as a formula when the file is opened in
// Excel or Sheets, so such cells (names typed by visitors) get an apostrophe first.
function cell(v: unknown) {
  let s = v == null ? "" : v instanceof Date ? v.toISOString().slice(0, 16).replace("T", " ") : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

const toCsv = (rows: unknown[][]) => "﻿" + rows.map((r) => r.map(cell).join(",")).join("\r\n");

// GET /api/admin/export?kind=leads|customers — a spreadsheet of enquiries or
// customers for follow-up. Only people who agreed to be contacted should be
// messaged from it.
export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const kind = new URL(req.url).searchParams.get("kind");
  const day = new Date().toISOString().slice(0, 10);

  let csv: string;
  if (kind === "leads") {
    const leads = await prisma.lead.findMany({ orderBy: { createdAt: "desc" }, include: { notes: { select: { body: true }, orderBy: { createdAt: "asc" } } } });
    csv = toCsv([
      ["Date", "Name", "Phone", "City", "Area / clinic", "Type", "Status", "Came from", "Notes"],
      ...leads.map((l) => {
        const from = l.notes.find((n) => n.body.startsWith("Came from: "))?.body.slice("Came from: ".length) ?? "";
        const notes = l.notes.filter((n) => !n.body.startsWith("Came from: ")).map((n) => n.body).join(" | ");
        return [l.createdAt, l.name, l.phone, l.city, l.area, l.source, l.status, from, notes];
      }),
    ]);
  } else if (kind === "customers") {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, select: { name: true, phone: true, email: true, createdAt: true, bookings: { where: { status: { not: "CANCELLED" } }, select: { totalAmount: true, createdAt: true } } } });
    csv = toCsv([
      ["Joined", "Name", "Phone", "Email", "Bookings", "Total spent (₹)", "Last booking"],
      ...users.map((u) => {
        const last = u.bookings.reduce<Date | null>((d, b) => (!d || b.createdAt > d ? b.createdAt : d), null);
        return [u.createdAt, u.name, u.phone, u.email ?? "", u.bookings.length, u.bookings.reduce((n, b) => n + b.totalAmount, 0), last ?? ""];
      }),
    ]);
  } else {
    return NextResponse.json({ error: "kind must be leads or customers" }, { status: 400 });
  }

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="jgh-${kind}-${day}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
