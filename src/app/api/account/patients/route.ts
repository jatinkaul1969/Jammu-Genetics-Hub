import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { getPatientsForCheckout, getLastAddressIdsByPatient } from "@/lib/patients";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ patients: [] }, { status: 401 });

  const patients = await getPatientsForCheckout(user);
  const lastAddressByPatient = await getLastAddressIdsByPatient(user.id, patients.map((p) => p.id));

  return NextResponse.json({
    patients: patients.map((p) => ({ ...p, lastAddressId: lastAddressByPatient.get(p.id) ?? null })),
  });
}
