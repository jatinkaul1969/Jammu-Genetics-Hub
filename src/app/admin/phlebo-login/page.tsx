import { redirect } from "next/navigation";
import { getCurrentPhlebo } from "@/lib/phlebo-session";
import { PhleboLoginForm } from "@/components/PhleboLoginForm";

export default async function PhleboLoginPage() {
  const phlebo = await getCurrentPhlebo();
  if (phlebo) redirect("/admin/phlebo");

  return (
    <div className="mx-auto min-h-screen max-w-7xl px-4 sm:px-6">
      <PhleboLoginForm />
    </div>
  );
}
