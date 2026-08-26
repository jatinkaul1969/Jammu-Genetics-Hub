import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { createBookingsForUser, type IncomingItem } from "@/lib/create-booking";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ bookings: [] }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: { userId: user.id },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  const labIds = [...new Set(bookings.map((b) => b.labId))];
  const labs = await prisma.lab.findMany({ where: { id: { in: labIds } } });
  const labMap = new Map(labs.map((l) => [l.id, l]));

  return NextResponse.json({
    bookings: bookings.map((b) => ({ ...b, lab: labMap.get(b.labId) ?? null })),
  });
}

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Please log in to book." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const items: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const scheduledDate = typeof body?.scheduledDate === "string" ? body.scheduledDate : "";
  const scheduledSlot = typeof body?.scheduledSlot === "string" ? body.scheduledSlot : "";
  const couponCode = typeof body?.couponCode === "string" ? body.couponCode.trim() : "";
  const wantsHardCopy = Boolean(body?.wantsHardCopy);
  const wantsMembership = Boolean(body?.wantsMembership);

  const patientInput = body?.patient ?? {};
  const addressInput = body?.address ?? {};

  const result = await createBookingsForUser({
    userId: user.id,
    items,
    phone,
    scheduledDate,
    scheduledSlot,
    couponCode: couponCode || undefined,
    wantsHardCopy,
    wantsMembership,
    patient: {
      id: typeof patientInput.id === "string" ? patientInput.id : undefined,
      name: typeof patientInput.name === "string" ? patientInput.name.trim() : undefined,
      age: Number.isFinite(Number(patientInput.age)) ? Number(patientInput.age) : undefined,
      gender: typeof patientInput.gender === "string" ? patientInput.gender : undefined,
      relationship: typeof patientInput.relationship === "string" ? patientInput.relationship : undefined,
    },
    address: {
      id: typeof addressInput.id === "string" ? addressInput.id : undefined,
      label: typeof addressInput.label === "string" ? addressInput.label : undefined,
      addressLine: typeof addressInput.addressLine === "string" ? addressInput.addressLine.trim() : undefined,
      city: typeof addressInput.city === "string" ? addressInput.city.trim() : undefined,
      pincode: typeof addressInput.pincode === "string" ? addressInput.pincode.trim() : undefined,
      latitude: Number.isFinite(addressInput.latitude) ? Number(addressInput.latitude) : null,
      longitude: Number.isFinite(addressInput.longitude) ? Number(addressInput.longitude) : null,
    },
  });

  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
