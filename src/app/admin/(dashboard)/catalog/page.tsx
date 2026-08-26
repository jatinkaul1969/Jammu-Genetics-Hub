import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { formatInr } from "@/lib/format";
import { DiagnosticsBackdrop } from "@/components/DiagnosticsBackdrop";
import { DeleteProductButton } from "@/components/DeleteProductButton";

type SearchParams = { q?: string; category?: string; type?: string };

export default async function AdminCatalogPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const categoryId = params.category ?? "";
  const type = params.type ?? "";

  const categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  const products = await prisma.product.findMany({
    where: {
      AND: [
        q ? { name: { contains: q, mode: "insensitive" } } : {},
        categoryId ? { categoryId } : {},
        type ? { type } : {},
      ],
    },
    include: { category: true, prices: { include: { lab: true } } },
    orderBy: { name: "asc" },
  });

  return (
    <div>
      <div className="relative mb-6 overflow-hidden rounded-xl border border-border bg-surface p-5">
        <DiagnosticsBackdrop className="opacity-70" />
        <div className="relative flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">Catalog &amp; Pricing</h2>
            <p className="text-sm text-ink-soft">{products.length} product{products.length !== 1 ? "s" : ""} across {categories.length} categories</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/admin/catalog/categories"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink hover:border-brand hover:text-brand"
            >
              <Tags size={15} /> Categories
            </Link>
            <Link
              href="/admin/catalog/new"
              className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              <Plus size={15} /> Add product
            </Link>
          </div>
        </div>
      </div>

      <form action="/admin/catalog" method="get" className="mb-4 flex flex-wrap items-center gap-2">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Search products"
          className="w-64 max-w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        />
        <select
          name="category"
          defaultValue={categoryId}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
        >
          <option value="">All types</option>
          <option value="TEST">Single Tests</option>
          <option value="PACKAGE">Packages</option>
        </select>
        <button type="submit" className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          Filter
        </button>
        {(q || categoryId || type) && (
          <Link href="/admin/catalog" className="text-sm text-ink-soft hover:text-brand">
            Clear
          </Link>
        )}
      </form>

      <div className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="hidden grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr_auto] gap-3 border-b border-border bg-surface-muted px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-ink-faint sm:grid">
          <span>Product</span>
          <span>Category</span>
          <span>Type</span>
          <span>JGH Price</span>
          <span>Lowest Price</span>
          <span className="text-right">Actions</span>
        </div>
        {products.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-ink-soft">No products match these filters.</p>
        ) : (
          products.map((p) => {
            const own = p.prices.find((pr) => pr.lab.isOwn);
            const lowest = p.prices.reduce(
              (min, pr) => (min === null || pr.price < min.price ? pr : min),
              null as (typeof p.prices)[number] | null
            );
            return (
              <div
                key={p.id}
                className="grid grid-cols-2 gap-2 border-b border-border px-4 py-3 text-sm last:border-b-0 sm:grid-cols-[1.6fr_1fr_0.8fr_1fr_1fr_auto] sm:items-center"
              >
                <Link href={`/admin/catalog/${p.id}`} className="truncate font-medium text-ink hover:text-brand">
                  {p.name}
                </Link>
                <span className="text-ink-soft">{p.category.name}</span>
                <span className="text-ink-soft">{p.type === "PACKAGE" ? "Package" : "Test"}</span>
                <span className="font-mono text-ink">{own ? formatInr(own.price) : "—"}</span>
                <span className="font-mono text-ink-soft">
                  {lowest ? `${formatInr(lowest.price)} · ${lowest.lab.shortName}` : "—"}
                </span>
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/admin/catalog/${p.id}`}
                    className="rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink hover:border-brand hover:text-brand"
                  >
                    Edit
                  </Link>
                  <DeleteProductButton productId={p.id} productName={p.name} />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
