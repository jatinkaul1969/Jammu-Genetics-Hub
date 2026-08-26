import { isAdminAuthenticated } from "@/lib/admin-session";
import { getCurrentStaff } from "@/lib/staff-session";
import { getCurrentPhlebo } from "@/lib/phlebo-session";
import { parsePermissions, type PermissionKey } from "@/lib/permissions";
import type { AdminUser, Phlebo } from "@/generated/prisma/client";

export type AdminActor =
  | { type: "owner" }
  | { type: "staff"; staff: AdminUser; permissions: PermissionKey[] }
  | { type: "phlebo"; phlebo: Phlebo };

// Resolves whichever admin-adjacent session is present — the owner's
// shared-password session takes priority, then staff, then a phlebo. Owner
// implicitly has every permission; staff only what's been granted to them
// individually; a phlebo only ever gets "sales" (see actorHasPermission) —
// enough to book an on-the-spot test for a patient they're already visiting,
// nothing else in the admin surface.
export async function getAdminActor(): Promise<AdminActor | null> {
  if (await isAdminAuthenticated()) return { type: "owner" };

  const staff = await getCurrentStaff();
  if (staff) return { type: "staff", staff, permissions: parsePermissions(staff.permissionsJson) };

  const phlebo = await getCurrentPhlebo();
  if (phlebo) return { type: "phlebo", phlebo };

  return null;
}

export function actorHasPermission(actor: AdminActor | null, key: PermissionKey): boolean {
  if (!actor) return false;
  if (actor.type === "owner") return true;
  if (actor.type === "phlebo") return key === "sales";
  return actor.permissions.includes(key);
}
