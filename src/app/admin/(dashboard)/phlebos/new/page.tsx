import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewPhleboForm } from "@/components/NewPhleboForm";

export default function AdminNewPhleboPage() {
  return (
    <div>
      <Link href="/admin/phlebos" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> Back to phlebotomists
      </Link>
      <NewPhleboForm />
    </div>
  );
}
