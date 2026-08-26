import Link from "next/link";
import { CategoryIcon } from "@/components/CategoryIcon";
import { categoryColor } from "@/lib/category-colors";

type Category = { slug: string; name: string; icon: string };

export function CategoryRail({ categories }: { categories: Category[] }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
      {categories.map((cat, i) => {
        const color = categoryColor(i);
        return (
          <Link
            key={cat.slug}
            href={`/search?category=${cat.slug}`}
            className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 text-center transition hover:-translate-y-1 hover:shadow-md sm:shrink"
          >
            <span className={`flex h-11 w-11 items-center justify-center rounded-full ${color.bg} ${color.text}`}>
              <CategoryIcon name={cat.icon} size={19} />
            </span>
            <span className="w-20 text-xs font-medium leading-tight text-ink-soft">{cat.name}</span>
          </Link>
        );
      })}
    </div>
  );
}
