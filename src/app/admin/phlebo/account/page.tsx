import { redirect } from "next/navigation";
import { getCurrentPhlebo } from "@/lib/phlebo-session";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export default async function PhleboAccountPage() {
  const phlebo = await getCurrentPhlebo();
  if (!phlebo) redirect("/admin/phlebo-login");

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">My account</h2>
        <p className="text-sm text-ink-soft">
          {phlebo.name} · @{phlebo.username}
        </p>
      </div>
      <ChangePasswordForm endpoint="/api/phlebo/change-password" />
    </div>
  );
}
