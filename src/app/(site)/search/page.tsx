import Link from "next/link";
import type { Metadata } from "next";
import { searchProducts, getCategories } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { SearchBox } from "@/components/SearchBox";

type SearchParams = { q?: string; category?: string; type?: string };

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q
    ? `${q} — Compare Prices Across Labs in Jammu`
    : "Search Diagnostic Tests & Packages in Jammu";
  const description = q
    ? `Compare "${q}" test prices in Jammu across Jammu Genetics Hub, Thyrocare, Redcliffe Labs, Dr Lal PathLabs and Metropolis. Book free home sample collection.`
    : "Browse and compare 70+ diagnostic tests and health packages across 5 labs in Jammu — Jammu Genetics Hub, Thyrocare, Redcliffe Labs, Dr Lal PathLabs and Metropolis. Free home sample collection.";
  return { title, description };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const q = params.q ?? "";
  const category = params.category ?? "";
  const type = params.type ?? "";

  const [products, categories] = await Promise.all([
    searchProducts(q, category || undefined, type || undefined),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  // If a category (and/or type) filter is zeroing out an otherwise-real
  // match, say so explicitly — a blank "no results" reads as broken search
  // when really it's just filtered to a category the match doesn't belong to.
  const unfilteredCount =
    products.length === 0 && q && (category || type)
      ? (await searchProducts(q)).length
      : 0;

  function buildHref(next: Partial<SearchParams>) {
    const merged = { q, category, type, ...next };
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.category) sp.set("category", merged.category);
    if (merged.type) sp.set("type", merged.type);
    const qs = sp.toString();
    return qs ? `/search?${qs}` : "/search";
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-6 max-w-xl">
        <SearchBox initialValue={q} />
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link
          href={buildHref({ category: "" })}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
            !category ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:border-brand"
          }`}
        >
          All categories
        </Link>
        {categories.map((c) => (
          <Link
            key={c.slug}
            href={buildHref({ category: c.slug })}
            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
              category === c.slug
                ? "border-brand bg-brand-soft text-brand-dark"
                : "border-border text-ink-soft hover:border-brand"
            }`}
          >
            {c.name}
          </Link>
        ))}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {[
          { label: "All types", value: "" },
          { label: "Single Tests", value: "TEST" },
          { label: "Packages", value: "PACKAGE" },
        ].map((t) => (
          <Link
            key={t.value}
            href={buildHref({ type: t.value })}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium ${
              type === t.value ? "border-brand text-brand" : "border-border text-ink-faint hover:border-brand"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <p className="mb-4 text-sm text-ink-soft">
        {products.length} result{products.length !== 1 ? "s" : ""}
        {q && <> for &ldquo;{q}&rdquo;</>}
        {activeCategory && <> in {activeCategory.name}</>}
      </p>

      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          {unfilteredCount > 0 ? (
            <>
              &ldquo;{q}&rdquo; doesn&apos;t have a match
              {activeCategory && <> in {activeCategory.name}</>}
              {type && <> under {type === "PACKAGE" ? "Packages" : "Single Tests"}</>} — but it does exist.{" "}
              <Link href={buildHref({ category: "", type: "" })} className="font-medium text-brand hover:underline">
                Clear filters to see {unfilteredCount} result{unfilteredCount !== 1 ? "s" : ""}.
              </Link>
            </>
          ) : (
            "No tests or packages matched your search. Try a different term or clear the filters."
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
