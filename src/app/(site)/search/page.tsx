import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { searchProducts, getCategories } from "@/lib/catalog";
import { ProductCard } from "@/components/ProductCard";
import { SearchBox } from "@/components/SearchBox";
import { inheritedShareImages } from "@/lib/seo";

type SearchParams = { q?: string; category?: string; type?: string; page?: string };

// The catalog now holds well over a thousand tests, so results are paged —
// rendering every card at once makes /search?category=oncology enormous.
const PAGE_SIZE = 48;

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<SearchParams> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { q } = await searchParams;
  const title = q
    ? `${q} — Compare Prices Across Labs in Jammu`
    : "Search Diagnostic Tests & Packages in Jammu";
  const description = q
    ? `Compare "${q}" test prices in Jammu across Jammu Genetics Hub, Thyrocare, Redcliffe Labs, Dr Lal PathLabs and Metropolis. Book free home sample collection.`
    : "Browse 1,300+ genetic, oncology and diagnostic tests and health packages in Jammu — NIPT, exome sequencing, cancer panels, blood tests — across Jammu Genetics Hub and partner labs. Compare prices and book.";
  const shareImages = await inheritedShareImages(parent);
  return {
    title,
    description,
    // Self-canonicalize every filtered/search-query variant to the plain
    // /search page — these are UI states of one tool, not distinct content,
    // so they shouldn't compete with each other (or with the dedicated
    // /[city]/tests/[slug] pages, which are the real per-test pages) in
    // Google's index.
    alternates: { canonical: "/search" },
    openGraph: { title, description, type: "website", url: "/search", images: shareImages.openGraph },
    twitter: { card: "summary_large_image", title, description, images: shareImages.twitter },
  };
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
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const [allProducts, categories] = await Promise.all([
    searchProducts(q, category || undefined, type || undefined),
    getCategories(),
  ]);

  const totalPages = Math.max(1, Math.ceil(allProducts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const products = allProducts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const activeCategory = categories.find((c) => c.slug === category);

  // If a category (and/or type) filter is zeroing out an otherwise-real
  // match, say so explicitly — a blank "no results" reads as broken search
  // when really it's just filtered to a category the match doesn't belong to.
  const unfilteredCount =
    allProducts.length === 0 && q && (category || type)
      ? (await searchProducts(q)).length
      : 0;

  function buildHref(next: Partial<SearchParams>) {
    const merged = { q, category, type, page: "", ...next };
    const sp = new URLSearchParams();
    if (merged.q) sp.set("q", merged.q);
    if (merged.category) sp.set("category", merged.category);
    if (merged.type) sp.set("type", merged.type);
    if (merged.page && merged.page !== "1") sp.set("page", merged.page);
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
        {allProducts.length} result{allProducts.length !== 1 ? "s" : ""}
        {q && <> for &ldquo;{q}&rdquo;</>}
        {activeCategory && <> in {activeCategory.name}</>}
      </p>

      {allProducts.length === 0 ? (
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

      {totalPages > 1 && (
        <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm">
          {currentPage > 1 && (
            <Link href={buildHref({ page: String(currentPage - 1) })} rel="prev" className="rounded-md border border-border px-3 py-1.5 hover:border-brand">
              ← Previous
            </Link>
          )}
          <span className="px-2 text-ink-faint">
            Page {currentPage} of {totalPages}
          </span>
          {currentPage < totalPages && (
            <Link href={buildHref({ page: String(currentPage + 1) })} rel="next" className="rounded-md border border-border px-3 py-1.5 hover:border-brand">
              Next →
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
