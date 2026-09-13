import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/staff-session";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function StaffAccountPage() {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">My account</h2>
        <p className="text-sm text-ink-soft">
          {staff.name} · @{staff.username}
        </p>
      </div>
      <ChangePasswordForm endpoint="/api/staff/change-password" />
    </div>
  );
}
