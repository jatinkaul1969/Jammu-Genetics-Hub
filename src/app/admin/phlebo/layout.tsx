import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentPhlebo } from "@/lib/phlebo-session";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { StaffOnlineToggle } from "@/components/StaffOnlineToggle";

export default async function PhleboLayout({ children }: { children: React.ReactNode }) {
  const phlebo = await getCurrentPhlebo();
  if (!phlebo) redirect("/admin/phlebo-login");

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-brand">Jammu Genetics Hub</p>
          <Link href="/admin/phlebo/pickups" className="font-display text-xl font-semibold text-ink hover:text-brand">
            {phlebo.name}
          </Link>
        </div>
        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <Link href="/admin/phlebo/pickups" className="text-ink-soft hover:text-brand">
            My pickups
          </Link>
          <Link href="/admin/phlebo/book-for-customer" className="text-ink-soft hover:text-brand">
            Price check &amp; booking
          </Link>
          <StaffOnlineToggle initialOnline={phlebo.online} url="/api/phlebo/online" onLabel="Online — receiving pickups" />
          <AdminLogoutButton logoutUrl="/api/phlebo/logout" redirectUrl="/admin/phlebo-login" />
        </nav>
      </div>
      {children}
    </div>
  );
}
