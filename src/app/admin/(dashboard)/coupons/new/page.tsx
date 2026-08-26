import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { NewCouponForm } from "@/components/NewCouponForm";

export default function AdminNewCouponPage() {
  return (
    <div>
      <Link href="/admin/coupons" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> Back to coupons
      </Link>
      <NewCouponForm />
    </div>
  );
}
