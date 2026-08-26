import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentStaff } from "@/lib/staff-session";
import { parsePermissions } from "@/lib/permissions";
import { AdminLogoutButton } from "@/components/AdminLogoutButton";
import { StaffOnlineToggle } from "@/components/StaffOnlineToggle";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const staff = await getCurrentStaff();
  if (!staff) redirect("/admin/staff-login");

  const permissions = parsePermissions(staff.permissionsJson);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-brand">Jammu Genetics Hub</p>
          <h1 className="font-display text-xl font-semibold text-ink">{staff.name}</h1>
        </div>
        <nav className="flex flex-wrap items-center gap-4 text-sm">
          {permissions.includes("leads") && (
            <Link href="/admin/staff/leads" className="text-ink-soft hover:text-brand">
              My Callback Requests
            </Link>
          )}
          {permissions.includes("whatsapp") && (
            <Link href="/admin/staff/whatsapp" className="text-ink-soft hover:text-brand">
              WhatsApp Chats
            </Link>
          )}
          {permissions.includes("bookings") && (
            <Link href="/admin/staff/bookings" className="text-ink-soft hover:text-brand">
              Bookings
            </Link>
          )}
          {permissions.includes("pickups") && (
            <Link href="/admin/staff/pickups" className="text-ink-soft hover:text-brand">
              Pickups
            </Link>
          )}
          {permissions.includes("sales") && (
            <Link href="/admin/staff/book-for-customer" className="text-ink-soft hover:text-brand">
              Book for Customer
            </Link>
          )}
          <StaffOnlineToggle initialOnline={staff.online} />
          <AdminLogoutButton logoutUrl="/api/staff/logout" redirectUrl="/admin/staff-login" />
        </nav>
      </div>
      {permissions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface p-10 text-center text-sm text-ink-soft">
          Your account doesn&apos;t have any areas enabled yet — ask an admin to grant access from Team.
        </div>
      ) : (
        children
      )}
    </div>
  );
}
