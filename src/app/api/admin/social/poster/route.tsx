import { ImageResponse } from "next/og";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { FORMATS } from "@/lib/social/formats";
import { THEMES } from "@/lib/social/brand";
import { activeNewCustomerCoupon, loadProduct } from "@/lib/social/data";
import { buildLink } from "@/lib/social/copy";
import { customLogoUri } from "@/lib/social/logo";
import { qrDataUri } from "@/lib/social/qr";
import { parseParams } from "@/lib/social/params";
import { TEMPLATES, renderPoster } from "@/lib/social/templates";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!(await isAdminAuthenticated())) return new Response("Not authorized", { status: 401 });

  const parsed = parseParams(new URL(req.url).searchParams);
  if ("error" in parsed) return new Response(parsed.error, { status: 400 });

  const info = TEMPLATES.find((t) => t.id === parsed.template)!;
  const product = info.needsTest && parsed.slug ? await loadProduct(parsed.slug, parsed.lang) : null;
  if (info.needsTest && !product) return new Response("Test not found.", { status: 404 });

  const fmt = FORMATS[parsed.format];
  const coupon = parsed.template === "price" ? await activeNewCustomerCoupon() : null;
  const link = buildLink({ template: parsed.template, slug: product?.slug ?? null, source: "print" });
  const qrUri = parsed.showQr ? await qrDataUri(link, THEMES[parsed.theme].id === "warm" ? "#7d2c14" : "#063f34") : null;

  try {
    const element = renderPoster({
      template: parsed.template,
      fmt,
      lang: parsed.lang,
      theme: THEMES[parsed.theme],
      product,
      coupon,
      headline: parsed.headline,
      body: parsed.body,
      eyebrow: parsed.eyebrow,
      date: parsed.date,
      place: parsed.place,
      mythId: parsed.mythId,
      factId: parsed.factId,
      showQr: parsed.showQr,
      showPrice: parsed.showPrice,
      qrUri,
      logoUri: customLogoUri(),
    });
    const filename = `jgh-${parsed.template}${product ? "-" + product.slug : ""}-${parsed.format}-${parsed.lang}.png`;
    return new ImageResponse(element, {
      width: fmt.w,
      height: fmt.h,
      headers: {
        "Cache-Control": "no-store",
        ...(parsed.download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
      },
    });
  } catch (e) {
    console.error("poster render failed", e);
    return new Response("Could not render this poster.", { status: 500 });
  }
}
