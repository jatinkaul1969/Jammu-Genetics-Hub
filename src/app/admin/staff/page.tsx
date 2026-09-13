import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";

export default async function StaffHomePage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");

  const permissions = parsePermissions(staff.permissionsJson);
  if (permissions.includes("leads")) redirect("/admin/staff/leads");
  if (permissions.includes("whatsapp")) redirect("/admin/staff/whatsapp");
  if (permissions.includes("bookings")) redirect("/admin/staff/bookings");
  if (permissions.includes("pickups")) redirect("/admin/staff/pickups");
  if (permissions.includes("sales")) redirect("/admin/staff/book-for-customer");

  return (
    <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
      Your account doesn&apos;t have any areas enabled yet — ask an admin to grant access from Team. You can
      still change your password from <span className="font-medium text-ink">My account</span>.
    </div>
  );
}
