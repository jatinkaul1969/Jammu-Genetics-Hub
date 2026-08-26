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

export const metadata: Metadata = {
  title: {
    default: "Jammu Genetics Hub — Compare Lab Test Prices & Book Home Sample Collection in Jammu",
    template: "%s | Jammu Genetics Hub",
  },
  description:
    "Jammu's one-stop diagnostics platform, directly accredited with every major NABL-accredited lab — Thyrocare, Redcliffe Labs, Dr Lal PathLabs, Metropolis and specialist genetics partners. Compare test and health package prices across all of them, then book free home sample collection with your own phlebotomist. Blood test, full body checkup, thyroid test price in Jammu.",
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
