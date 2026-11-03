import { revalidatePath } from "next/cache";
import { resetTestIndex } from "@/lib/test-index";

// Landing pages are cached for an hour. Call this after any admin change to
// products, prices or categories so patients never see an old price: it marks
// every cached page stale (each is rebuilt the next time someone visits it) and
// drops the in-memory test index.
export function revalidateCatalog() {
  resetTestIndex();
  revalidatePath("/", "layout");
}
