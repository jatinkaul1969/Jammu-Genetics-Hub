import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminActor, actorHasPermission } from "@/lib/admin-access";

export async function GET(req: Request) {
  const actor = await getAdminActor();
  if (!actor || !actorHasPermission(actor, "sales")) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const phone = new URL(req.url).searchParams.get("phone")?.trim() ?? "";
  if (!/^[6-9]\d{9}$/.test(phone)) {
    return NextResponse.json({ error: "Enter a valid 10-digit phone number." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    include: {
      patients: { orderBy: { createdAt: "asc" } },
      addresses: { orderBy: { isDefault: "desc" } },
    },
  });

  if (!user) return NextResponse.json({ found: false });

  return NextResponse.json({
    found: true,
    user: { id: user.id, name: user.name, age: user.age, phone: user.phone },
    patients: user.patients.map((p) => ({ id: p.id, name: p.name, age: p.age, relationship: p.relationship })),
    addresses: user.addresses.map((a) => ({
      id: a.id,
      label: a.label,
      addressLine: a.addressLine,
      city: a.city,
      pincode: a.pincode,
      latitude: a.latitude,
      longitude: a.longitude,
    })),
  });
}
