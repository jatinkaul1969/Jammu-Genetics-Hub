// The fixed catalog of delegable admin areas. The owner (single shared
// ADMIN_PASSWORD login) picks a subset of these per staff member — there are
// no fixed "roles", just per-person permission sets. Catalog/pricing/coupons
// and staff management itself are deliberately NOT in this list — they stay
// owner-only, never delegable, regardless of what's granted here.
export const PERMISSIONS = [
  {
    key: "leads",
    label: "Callback requests",
    description: "Work the assigned-to-them callback request queue — update status, log call notes.",
  },
  {
    key: "whatsapp",
    label: "WhatsApp chats",
    description: "View and reply to WhatsApp conversations, take over from the bot.",
  },
  {
    key: "bookings",
    label: "Bookings",
    description: "View bookings, update status, upload reports.",
  },
  {
    key: "pickups",
    label: "Phlebo pickups",
    description: "Track live phlebotomist pickup status and location — for helping customers on a call.",
  },
  {
    key: "sales",
    label: "Book for customer",
    description: "Create a booking on behalf of a customer over a call — appears in their account exactly like a self-service booking.",
  },
] as const;

export type PermissionKey = (typeof PERMISSIONS)[number]["key"];

// Purely organizational grouping shown on the Team page — doesn't grant
// access by itself (permissionsJson does that); just makes it faster to set
// up a new hire by pre-checking the permissions typical for that team, and
// groups the staff list so a busy roster stays readable.
export const STAFF_TEAMS = [
  { key: "support", label: "Support", defaultPermissions: ["leads", "whatsapp"] as PermissionKey[] },
  { key: "sales", label: "Sales", defaultPermissions: ["sales", "bookings"] as PermissionKey[] },
  { key: "operations", label: "Operations", defaultPermissions: ["bookings", "pickups"] as PermissionKey[] },
] as const;
export type StaffTeamKey = (typeof STAFF_TEAMS)[number]["key"];

export function parsePermissions(json: string): PermissionKey[] {
  try {
    const parsed = JSON.parse(json);
    if (!Array.isArray(parsed)) return [];
    const valid = new Set(PERMISSIONS.map((p) => p.key));
    return parsed.filter((k): k is PermissionKey => typeof k === "string" && valid.has(k as PermissionKey));
  } catch {
    return [];
  }
}

export function serializePermissions(keys: string[]): string {
  const valid = new Set(PERMISSIONS.map((p) => p.key));
  return JSON.stringify(keys.filter((k) => valid.has(k as PermissionKey)));
}
