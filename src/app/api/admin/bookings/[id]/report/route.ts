import { NextResponse } from "next/server";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";
import { prisma } from "@/lib/prisma";

const STORAGE_DIR = path.join(process.cwd(), "storage", "reports");
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "bookings")) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "No file uploaded." }, { status: 400 });
  }
  if (file.type !== "application/pdf") {
    return NextResponse.json({ ok: false, error: "Reports must be a PDF file." }, { status: 400 });
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ ok: false, error: "File is too large (max 15MB)." }, { status: 400 });
  }

  const filename = `${booking.id}.pdf`;
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(STORAGE_DIR, filename), buffer);

  await prisma.booking.update({
    where: { id },
    data: { reportFile: filename, status: "REPORT_READY" },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "bookings")) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const { id } = await params;
  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return NextResponse.json({ ok: false, error: "Booking not found." }, { status: 404 });
  }

  if (booking.reportFile) {
    await unlink(path.join(STORAGE_DIR, booking.reportFile)).catch(() => {});
  }
  await prisma.booking.update({ where: { id }, data: { reportFile: null } });

  return NextResponse.json({ ok: true });
}
