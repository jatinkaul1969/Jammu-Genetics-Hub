import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";
import { createBookingsForUser, type IncomingItem } from "@/lib/create-booking";

export async function POST(req: Request) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "sales")) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const customerPhone = typeof body?.customerPhone === "string" ? body.customerPhone.trim() : "";
  const customerName = typeof body?.customerName === "string" ? body.customerName.trim() : "";
  const customerAge = Number(body?.customerAge);

  if (!/^[6-9]\d{9}$/.test(customerPhone)) {
    return NextResponse.json({ ok: false, error: "Enter a valid 10-digit customer phone number." }, { status: 400 });
  }

  let user = await prisma.user.findUnique({ where: { phone: customerPhone } });
  if (!user) {
    if (!customerName || customerName.length < 2 || !Number.isFinite(customerAge) || customerAge < 1 || customerAge > 120) {
      return NextResponse.json(
        { ok: false, error: "This is a new customer — enter their name and age to create an account." },
        { status: 400 }
      );
    }
    user = await prisma.user.create({ data: { phone: customerPhone, name: customerName, age: Math.round(customerAge) } });
  }

  const items: IncomingItem[] = Array.isArray(body?.items) ? body.items : [];
  const scheduledDate = typeof body?.scheduledDate === "string" ? body.scheduledDate : "";
  const scheduledSlot = typeof body?.scheduledSlot === "string" ? body.scheduledSlot : "";
  const couponCode = typeof body?.couponCode === "string" ? body.couponCode.trim() : "";
  const patientInput = body?.patient ?? {};
  const addressInput = body?.address ?? {};

  const result = await createBookingsForUser({
    userId: user.id,
    items,
    phone: customerPhone,
    scheduledDate,
    scheduledSlot,
    couponCode: couponCode || undefined,
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
    bookedByStaffId: actor.type === "staff" ? actor.staff.id : null,
    bookedByPhleboId: actor.type === "phlebo" ? actor.phlebo.id : null,
  });

  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
