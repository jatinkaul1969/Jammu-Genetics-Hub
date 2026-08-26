import { prisma } from "@/lib/prisma";
import type { User } from "@/generated/prisma/client";

export async function getPatientsForCheckout(user: User) {
  const existing = await prisma.patient.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "asc" },
  });
  if (existing.length > 0) return existing;

  // Self-heal: accounts created before this feature existed have no Patient
  // row yet — create one from the account holder's own details on first use.
  const self = await prisma.patient.create({
    data: {
      userId: user.id,
      name: user.name,
      age: user.age,
      gender: user.gender,
      relationship: "self",
    },
  });
  return [self];
}

// The address used in this patient's most recent booking — lets checkout
// default to "same address as last time for this person," while still
// letting a different family member default to their own last address (or
// the account default, if they've never been booked before).
export async function getLastAddressIdsByPatient(userId: string, patientIds: string[]) {
  if (patientIds.length === 0) return new Map<string, string>();

  const bookings = await prisma.booking.findMany({
    where: { userId, patientId: { in: patientIds }, addressId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: { patientId: true, addressId: true },
  });

  const map = new Map<string, string>();
  for (const b of bookings) {
    if (b.patientId && b.addressId && !map.has(b.patientId)) {
      map.set(b.patientId, b.addressId);
    }
  }
  return map;
}
