export const LEAD_STATUSES = ["NEW", "CONTACTED", "FOLLOW_UP", "CONVERTED", "CLOSED"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABEL: Record<string, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  FOLLOW_UP: "Follow-up",
  CONVERTED: "Converted",
  CLOSED: "Closed",
};

export const LEAD_STATUS_STYLE: Record<string, string> = {
  NEW: "bg-cat-blue-soft text-cat-blue",
  CONTACTED: "bg-cat-amber-soft text-cat-amber",
  FOLLOW_UP: "bg-accent-soft text-accent",
  CONVERTED: "bg-success-soft text-success",
  CLOSED: "bg-surface-muted text-ink-faint",
};
