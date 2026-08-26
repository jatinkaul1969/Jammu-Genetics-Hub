import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/site-url";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const baseUrl = await getBaseUrl();
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/account", "/checkout"] }],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
