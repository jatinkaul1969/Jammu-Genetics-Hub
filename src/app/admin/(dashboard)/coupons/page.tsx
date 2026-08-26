import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { COUPON_AUDIENCES } from "@/lib/coupon-constants";

function formatValue(c: { type: string; value: number; maxDiscount: number | null }) {
  if (c.type === "FLAT") return `₹${c.value} off`;
  return `${c.value}% off${c.maxDiscount ? `, up to ₹${c.maxDiscount}` : ""}`;
}

function isExpired(expiresAt: Date | null) {
  return expiresAt ? expiresAt.getTime() < Date.now() : false;
}

export default async function AdminCouponsPage() {
  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ink">Coupons</h2>
          <p className="text-sm text-ink-soft">
            Create a coupon for a sale or occasion (festival, anniversary, launch) — set an expiry so it switches
            off on its own, or toggle it off any time.
          </p>
        </div>
        <Link
          href="/admin/coupons/new"
          className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          <Plus size={15} /> New coupon
        </Link>
      </div>

      {coupons.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          No coupons yet — create one to run a discount for an occasion.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface">
          {coupons.map((c) => {
            const expired = isExpired(c.expiresAt);
            const live = c.active && !expired;
            return (
              <Link
                key={c.id}
                href={`/admin/coupons/${c.id}`}
                className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 hover:bg-bg"
              >
                <div>
                  <p className="flex items-center gap-2 font-mono font-semibold text-ink">
                    {c.code}
                    <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand-dark">
                      {formatValue(c)}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">{c.description}</p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  {c.audience !== "ALL" && (
                    <span className="text-ink-faint">{COUPON_AUDIENCES.find((a) => a.key === c.audience)?.label}</span>
                  )}
                  {c.expiresAt && (
                    <span className={expired ? "text-accent" : "text-ink-faint"}>
                      {expired ? "Expired" : "Until"} {c.expiresAt.toLocaleDateString("en-IN")}
                    </span>
                  )}
                  <span className={live ? "text-success" : "text-ink-faint"}>
                    {live ? "Live" : expired ? "Expired" : "Off"}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
