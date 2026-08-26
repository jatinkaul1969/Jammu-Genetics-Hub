import { redirect } from "next/navigation";
import { getCurrentStaff } from "@/lib/staff-session";
import { StaffLoginForm } from "@/components/StaffLoginForm";

export default async function StaffLoginPage() {
  const staff = await getCurrentStaff();
  if (staff) redirect("/admin/staff");

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 sm:px-6">
      <StaffLoginForm />
    </div>
  );
}
