import { getCurrentUser } from "@/lib/session";
import { getPatientsForCheckout, getLastAddressIdsByPatient } from "@/lib/patients";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "@/components/CheckoutForm";

export default async function CheckoutPage() {
  const user = await getCurrentUser();

  const [patients, addresses] = user
    ? await Promise.all([
        getPatientsForCheckout(user),
        prisma.address.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } }),
      ])
    : [[], []];

  const lastAddressByPatient = user
    ? await getLastAddressIdsByPatient(user.id, patients.map((p) => p.id))
    : new Map<string, string>();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 font-display text-2xl font-semibold text-ink">Checkout</h1>
      <CheckoutForm
        savedPatients={patients.map((p) => ({
          id: p.id,
          name: p.name,
          age: p.age,
          gender: p.gender,
          relationship: p.relationship,
          lastAddressId: lastAddressByPatient.get(p.id) ?? null,
        }))}
        savedAddresses={addresses.map((a) => ({
          id: a.id,
          label: a.label,
          addressLine: a.addressLine,
          city: a.city,
          pincode: a.pincode,
          isDefault: a.isDefault,
        }))}
      />
    </div>
  );
}
