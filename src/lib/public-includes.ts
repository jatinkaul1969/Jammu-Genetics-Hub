// The "what's included" list shown on public pages. Any line about the baby's sex
// is left out: in India the PC-PNDT Act prohibits advertising prenatal sex
// determination and telling parents the sex, so no public page may list it as a
// feature (some partner price lists and seed data carry "Fetal sex (optional)").
// Every public page that shows the list must go through this one function.
const SEX_LINE = /fetal sex|foetal sex|baby'?s sex|gender of/i;

export function publicIncludes(product: { includesJson: string | null }): string[] {
  let list: unknown;
  try {
    list = JSON.parse(product.includesJson ?? "[]");
  } catch {
    return [];
  }
  return Array.isArray(list) ? list.filter((i): i is string => typeof i === "string" && !SEX_LINE.test(i)) : [];
}
