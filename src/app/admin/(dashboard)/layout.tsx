import { redirect } from "next/navigation";
import Link from "next/link";
import { isAdminAuthenticated } from "@/lib/admin-session";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const authed = await isAdminAuthenticated();
  if (!authed) redirect("/admin/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-brand">Jammu Genetics Hub</p>
          <h1 className="font-display text-xl font-semibold text-ink">Admin</h1>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/admin/bookings" className="text-ink-soft hover:text-brand">
            Bookings
          </Link>
          <Link href="/admin/catalog" className="text-ink-soft hover:text-brand">
            Catalog
          </Link>
          <Link href="/admin/abandoned-carts" className="text-ink-soft hover:text-brand">
            Abandoned Carts
          </Link>
          <Link href="/admin/leads" className="text-ink-soft hover:text-brand">
            Callback Requests
          </Link>
          <Link href="/admin/whatsapp" className="text-ink-soft hover:text-brand">
            WhatsApp Chats
          </Link>
          <Link href="/admin/pickups" className="text-ink-soft hover:text-brand">
            Pickups
          </Link>
          <Link href="/admin/phlebos" className="text-ink-soft hover:text-brand">
            Phlebotomists
          </Link>
          <Link href="/admin/book-for-customer" className="text-ink-soft hover:text-brand">
            Book for Customer
          </Link>
          <Link href="/admin/team" className="text-ink-soft hover:text-brand">
            Team
          </Link>
          <Link href="/admin/coupons" className="text-ink-soft hover:text-brand">
            Coupons
          </Link>
          <Link href="/admin/settings" className="text-ink-soft hover:text-brand">
            Settings
          </Link>
          <Link href="/" className="text-ink-soft hover:text-brand">
            View site
          </Link>
          <AdminLogoutButton />
        </nav>
      </div>
      {children}
    </div>
  );
}
