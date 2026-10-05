import { prisma } from "@/lib/prisma";
import { contentForProduct, GENETICS_SLUGS } from "@/lib/genetics-content";
import { getProductsBySlugs } from "@/lib/catalog";
import { TEST_GROUPS, groupsForHub, type HubKey } from "@/lib/test-knowledge";

// An in-memory index of which catalog products are genetic / oncology tests
// and which group each belongs to. Groups are worked out from the test name
// (see test-knowledge.ts), not stored in the DB, so the index is built once
// per server instance from a light "slug + name + codes" query instead of
// being recomputed per page. Rebuilt every 10 minutes so products added in
// the admin show up without a redeploy.

export type IndexEntry = { slug: string; name: string; group: string; hub: HubKey };

type Index = { entries: IndexEntry[]; byGroup: Map<string, IndexEntry[]> };

const TTL_MS = 10 * 60 * 1000;
let memo: { at: number; value: Promise<Index> } | null = null;

const curated = new Set(GENETICS_SLUGS);

async function build(): Promise<Index> {
  const products = await prisma.product.findMany({
    select: { slug: true, name: true, prices: { select: { testCode: true } } },
  });
  const entries: IndexEntry[] = [];
  for (const p of products) {
    const c = contentForProduct(p);
    if (!c) continue;
    entries.push({ slug: p.slug, name: p.name, group: c.group, hub: c.hub });
  }
  // Hand-written (curated) tests first, then A–Z — so the best-known tests
  // lead every list.
  entries.sort((a, b) => Number(curated.has(b.slug)) - Number(curated.has(a.slug)) || a.name.localeCompare(b.name));
  const byGroup = new Map<string, IndexEntry[]>();
  for (const e of entries) {
    const list = byGroup.get(e.group) ?? [];
    list.push(e);
    byGroup.set(e.group, list);
  }
  return { entries, byGroup };
}

export function getTestIndex(): Promise<Index> {
  if (!memo || Date.now() - memo.at > TTL_MS) {
    memo = { at: Date.now(), value: build() };
    memo.value.catch(() => {
      memo = null;
    });
  }
  return memo.value;
}

export async function groupCounts(hub: HubKey) {
  const { byGroup } = await getTestIndex();
  return groupsForHub(hub).map((g) => ({ group: g, count: byGroup.get(g.name)?.length ?? 0 }));
}

/** Slugs in a group, curated-first then A–Z. */
export async function slugsInGroup(groupName: string) {
  const { byGroup } = await getTestIndex();
  return (byGroup.get(groupName) ?? []).map((e) => e.slug);
}

/** Products (with lowest price) for every test in a hub's groups, keyed by group name. */
export async function hubProductsByGroup(hub: HubKey, perGroup?: number) {
  const { byGroup } = await getTestIndex();
  const groups = groupsForHub(hub);
  const wanted = groups.flatMap((g) => (byGroup.get(g.name) ?? []).slice(0, perGroup ?? Infinity).map((e) => e.slug));
  const products = await getProductsBySlugs(wanted);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  return groups.map((group) => {
    const all = byGroup.get(group.name) ?? [];
    const shown = (perGroup ? all.slice(0, perGroup) : all)
      .map((e) => bySlug.get(e.slug))
      .filter((p): p is NonNullable<typeof p> => !!p && p.lowestPrice > 0);
    return { group, total: all.length, products: shown };
  });
}

export function groupForHubSlug(hub: HubKey, slug: string) {
  return TEST_GROUPS.find((g) => g.slug === slug && g.hubs[0] === hub);
}
