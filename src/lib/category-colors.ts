// A rotating palette so category cards/badges read as distinct, colorful
// identities instead of everything sharing the single brand teal. Written as
// literal class-name pairs (not template-built) so Tailwind's scanner picks
// them all up.
export const CATEGORY_COLORS = [
  { text: "text-cat-teal", bg: "bg-cat-teal-soft", border: "border-l-cat-teal" },
  { text: "text-cat-blue", bg: "bg-cat-blue-soft", border: "border-l-cat-blue" },
  { text: "text-cat-coral", bg: "bg-cat-coral-soft", border: "border-l-cat-coral" },
  { text: "text-cat-purple", bg: "bg-cat-purple-soft", border: "border-l-cat-purple" },
  { text: "text-cat-pink", bg: "bg-cat-pink-soft", border: "border-l-cat-pink" },
  { text: "text-cat-amber", bg: "bg-cat-amber-soft", border: "border-l-cat-amber" },
  { text: "text-cat-indigo", bg: "bg-cat-indigo-soft", border: "border-l-cat-indigo" },
  { text: "text-cat-cyan", bg: "bg-cat-cyan-soft", border: "border-l-cat-cyan" },
];

export function categoryColor(index: number) {
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}

// Deterministic per-category color from just the category name — lets any
// component colorize a category label without needing its position/order
// threaded through from the data layer.
export function categoryColorForName(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return categoryColor(hash);
}
