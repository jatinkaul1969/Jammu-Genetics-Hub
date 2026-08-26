import { OwnerPasswordForm } from "@/components/OwnerPasswordForm";

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="mb-4 font-display text-lg font-semibold text-ink">Settings</h1>
      <OwnerPasswordForm />
    </div>
  );
}
