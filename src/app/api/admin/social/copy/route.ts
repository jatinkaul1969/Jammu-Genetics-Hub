import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { activeNewCustomerCoupon, loadProduct } from "@/lib/social/data";
import { buildCopy, buildLink } from "@/lib/social/copy";
import { FACTS, MYTHS } from "@/lib/social/content";
import { parseParams } from "@/lib/social/params";
import { TEMPLATES } from "@/lib/social/templates";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  const parsed = parseParams(new URL(req.url).searchParams);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const info = TEMPLATES.find((t) => t.id === parsed.template)!;
  // Myth and fact posters carry their own related test, used only to pick relevant hashtags.
  const related =
    parsed.template === "myth" ? MYTHS.find((m) => m.id === parsed.mythId)?.slug : parsed.template === "fact" ? FACTS.find((f) => f.id === parsed.factId)?.slug : undefined;
  const slug = info.needsTest ? parsed.slug : (related ?? null);
  const product = slug ? await loadProduct(slug, parsed.lang) : null;
  if (info.needsTest && !product) return NextResponse.json({ error: "Test not found." }, { status: 404 });
  const coupon = parsed.template === "price" ? await activeNewCustomerCoupon() : null;
  const link = buildLink({ template: parsed.template, slug: info.needsTest ? (product?.slug ?? null) : null, source: parsed.source });

  const out = buildCopy({
    template: parsed.template,
    source: parsed.source,
    lang: parsed.lang,
    product,
    coupon,
    link,
    headline: parsed.headline,
    body: parsed.body,
    date: parsed.date,
    place: parsed.place,
    mythId: parsed.mythId,
    factId: parsed.factId,
    showPrice: parsed.showPrice,
  });
  const notes =
    parsed.source === "instagram"
      ? ["Instagram captions can't hold a clickable link. Put the tracked link below in a Story link sticker, or in your bio."]
      : parsed.source === "gbp"
        ? ["Google does not allow phone numbers in post text. Add a Call now or Learn more button instead, and use the tracked link below for Learn more."]
        : [];
  return NextResponse.json({ ...out, link, notes });
}
