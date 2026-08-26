import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";

const STORAGE_DIR = path.join(process.cwd(), "storage", "reports");

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const booking = await prisma.booking.findUnique({ where: { bookingCode: code } });

  if (!booking || !booking.reportFile) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const [user, actor] = await Promise.all([getCurrentUser(), getAdminActor()]);
  const isOwner = user && user.id === booking.userId;
  const isAdmin = actorHasPermission(actor, "bookings");
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Not authorized." }, { status: 403 });
  }

  const buffer = await readFile(path.join(STORAGE_DIR, booking.reportFile)).catch(() => null);
  if (!buffer) {
    return NextResponse.json({ error: "Report file is missing." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${booking.bookingCode}-report.pdf"`,
    },
  });
}
