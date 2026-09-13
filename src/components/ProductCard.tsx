import Link from "next/link";
import { Clock, FlaskConical, ArrowRight } from "lucide-react";
import { formatInr, formatTat, percentOff } from "@/lib/format";
import { categoryColorForName } from "@/lib/category-colors";

export type ProductCardData = {
  slug: string;
  name: string;
  type: string;
  parameters: number;
  reportHours: number;
  badge: string | null;
  category: { name: string };
  ownPrice: number;
  ownMrp: number;
  lowestPrice: number;
  lowestLabName: string;
  labCount: number;
};

// hrefBase lets city landing pages (/[city]) point the card at the
// city-scoped test page (/[city]/tests/[slug]) instead of the generic
// /product/[slug] page — same card, different internal-link target.
export function ProductCard({ product, hrefBase = "/product" }: { product: ProductCardData; hrefBase?: string }) {
  const off = percentOff(product.ownMrp, product.ownPrice);
  const jghIsLowest = product.ownPrice <= product.lowestPrice;
  const catColor = categoryColorForName(product.category.name);

  return (
    <Link
      href={`${hrefBase}/${product.slug}`}
      className="group flex flex-col rounded-xl border border-border bg-surface p-4 transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className={`rounded-full px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wide ${catColor.bg} ${catColor.text}`}>
          {product.category.name}
        </span>
        {product.badge && (
          <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
            {product.badge}
          </span>
        )}
      </div>

      <h3 className="mb-2 font-display text-base font-semibold leading-snug text-ink group-hover:text-brand-dark">
        {product.name}
      </h3>

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft">
        <span className="flex items-center gap-1">
          <FlaskConical size={13} /> {product.parameters} parameters
        </span>
        <span className="flex items-center gap-1">
          <Clock size={13} /> {formatTat(product.reportHours)}
        </span>
      </div>

      <div className="mt-auto">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg font-semibold text-ink">{formatInr(product.ownPrice)}</span>
          <span className="font-mono text-xs text-ink-faint line-through">{formatInr(product.ownMrp)}</span>
          {off > 0 && <span className="text-xs font-medium text-success">{off}% off</span>}
        </div>
        <p className="mt-1 text-xs text-ink-faint">at Jammu Genetics Hub</p>

        <div className="mt-3 flex items-center justify-between border-t border-border pt-3 text-xs">
          <span className="text-ink-soft">
            {jghIsLowest ? (
              <span className="font-medium text-brand">We&apos;re the lowest price</span>
            ) : (
              <>
                From <strong className="text-ink">{formatInr(product.lowestPrice)}</strong> at {product.lowestLabName}
              </>
            )}
          </span>
          <span className="flex items-center gap-0.5 font-medium text-brand opacity-0 transition group-hover:opacity-100">
            Compare <ArrowRight size={12} />
          </span>
        </div>
      </div>
    </Link>
  );
}
