import type { Metadata } from "next";
import { Fraunces, IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import "../globals.css";
import { AuthProvider } from "@/lib/auth-context";
import { CartProvider } from "@/lib/cart-context";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { GuestLoginPrompt } from "@/components/GuestLoginPrompt";
import { ChatWidget } from "@/components/ChatWidget";
import { CallbackWidget } from "@/components/CallbackWidget";
import { getCurrentUser } from "@/lib/session";
import { isMembershipActive } from "@/lib/collection-slots";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

// Without this, every relative URL in `alternates.canonical` / `openGraph`
// across the whole site renders as a bare relative path in the <head>
// (e.g. `<link rel="canonical" href="/product/nipt">` instead of an
// absolute URL) — Google wants absolute canonicals, and social platforms
// can't resolve a relative og:image at all. Falls back to the current
// Vercel URL; set NEXT_PUBLIC_SITE_URL once a custom domain is live and
// nothing else here needs to change.
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://jammu-genetics-hub.vercel.app";

const SITE_TITLE = "Jammu Genetics Hub — Compare Lab Test Prices & Book Home Sample Collection in Jammu";
const SITE_DESCRIPTION =
  "Jammu's one-stop diagnostics platform, directly accredited with every major NABL-accredited lab — Thyrocare, Redcliffe Labs, Dr Lal PathLabs, Metropolis and specialist genetics partners. Compare test and health package prices across all of them, then book free home sample collection with your own phlebotomist. Blood test, full body checkup, thyroid test price in Jammu.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: "%s | Jammu Genetics Hub",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "diagnostic tests Jammu",
    "blood test price Jammu",
    "full body checkup Jammu",
    "home sample collection Jammu",
    "lab test booking Jammu",
    "Thyrocare Jammu",
    "Redcliffe Labs Jammu",
    "Dr Lal PathLabs Jammu",
    "Metropolis Healthcare Jammu",
    "NABL accredited lab Jammu",
    "thyroid test price",
    "vitamin D test price",
    "compare diagnostic test prices",
    "child health checkup Jammu",
    "newborn screening test Jammu",
    "pediatric lab tests Jammu",
  ],
  // Page-level metadata (product/search/city pages) overrides these — this
  // is just the fallback so every route has a correct canonical + a proper
  // social share card, even ones that don't set their own.
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Jammu Genetics Hub",
    locale: "en_IN",
    url: "/",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  // Proves ownership for Google Search Console (HTML tag method) — this is
  // meant to be public, it's not a secret. Once verified, submit
  // sitemap.xml and use URL Inspection > Request Indexing on the key pages
  // (homepage, /jammu, /mumbai, the NIPT/double-marker city pages) — Google
  // doesn't index a brand-new site on its own for weeks/months otherwise.
  verification: {
    google: "Zwgiiliq_3Bs1ApG4fXDxsYkYtSLLJtcwS36qnvkV7w",
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const user = await getCurrentUser();
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${plexSans.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-bg text-ink">
        <AuthProvider
          initialUser={
            user
              ? { name: user.name, phone: user.phone, age: user.age, membershipActive: isMembershipActive(user) }
              : null
          }
        >
          <CartProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <GuestLoginPrompt />
            <ChatWidget />
            <CallbackWidget />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
