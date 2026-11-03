// The public address of the site, used for canonical URLs, the sitemap and
// structured data. It is a constant (not read from the request's Host header)
// on purpose: reading request headers makes a page "dynamic", which stops it
// being cached — and every landing page here should be served from cache.
// Set NEXT_PUBLIC_SITE_URL in Vercel when a custom domain goes live.
const DEFAULT_SITE_URL = "https://jammu-genetics-hub.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || DEFAULT_SITE_URL).replace(/\/+$/, "");

export async function getBaseUrl() {
  return SITE_URL;
}
