import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";
import { AdminBookingForm } from "@/components/AdminBookingForm";

export default async function StaffBookForCustomerPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");
  if (!parsePermissions(staff.permissionsJson).includes("sales")) redirect("/admin/staff");

  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">Book for a Customer</h2>
        <p className="text-sm text-ink-soft">
          For phone-in bookings — the booking is created under the customer&apos;s own account and shows up in
          their app exactly like a self-service booking.
        </p>
      </div>
      <AdminBookingForm />
    </div>
  );
}
