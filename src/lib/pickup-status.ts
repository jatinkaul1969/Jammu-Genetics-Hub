export const PICKUP_STATUS_LABEL: Record<string, string> = {
  UNASSIGNED: "Unassigned",
  ASSIGNED: "Assigned",
  ACCEPTED: "Accepted",
  EN_ROUTE: "On the way",
  ARRIVED: "Arrived",
  COLLECTED: "Collected",
  CANCELLED_BY_PHLEBO: "Reassigning",
};

export const PICKUP_STATUS_STYLE: Record<string, string> = {
  UNASSIGNED: "bg-surface-muted text-ink-faint",
  ASSIGNED: "bg-accent-soft text-accent",
  ACCEPTED: "bg-cat-blue-soft text-cat-blue",
  EN_ROUTE: "bg-cat-amber-soft text-cat-amber",
  ARRIVED: "bg-success-soft text-success",
  COLLECTED: "bg-success-soft text-success",
  CANCELLED_BY_PHLEBO: "bg-accent-soft text-accent",
};
