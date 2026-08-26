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

  return null;
}
