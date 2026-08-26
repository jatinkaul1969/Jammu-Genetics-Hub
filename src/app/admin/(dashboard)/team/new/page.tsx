import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewStaffForm } from "@/components/NewStaffForm";

export default function AdminNewStaffPage() {
  return (
    <div>
      <Link href="/admin/team" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> Back to team
      </Link>
      <NewStaffForm />
    </div>
  );
}
