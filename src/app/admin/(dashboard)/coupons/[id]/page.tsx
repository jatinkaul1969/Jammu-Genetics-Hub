import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { CouponEditForm } from "@/components/CouponEditForm";
import { COUPON_AUDIENCES, type CouponAudienceKey } from "@/lib/coupon-constants";

export default async function AdminCouponEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) notFound();

  return (
    <div>
      <Link href="/admin/coupons" className="mb-4 flex items-center gap-1.5 text-sm text-ink-soft hover:text-brand">
        <ArrowLeft size={14} /> Back to coupons
      </Link>
      <CouponEditForm
        couponId={coupon.id}
        initial={{
          code: coupon.code,
          description: coupon.description,
          type: coupon.type === "FLAT" ? "FLAT" : "PERCENT",
          value: coupon.value,
          maxDiscount: coupon.maxDiscount,
          minOrderAmount: coupon.minOrderAmount,
          audience: COUPON_AUDIENCES.some((a) => a.key === coupon.audience)
            ? (coupon.audience as CouponAudienceKey)
            : "ALL",
          active: coupon.active,
          expiresAt: coupon.expiresAt ? coupon.expiresAt.toISOString().slice(0, 10) : null,
        }}
      />
    </div>
  );
}
