export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "COLLECTED", "REPORT_READY", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];

export const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  COLLECTED: "Sample Collected",
  REPORT_READY: "Report Ready",
  CANCELLED: "Cancelled",
};

export const STATUS_STYLE: Record<string, string> = {
  PENDING: "bg-gold-soft text-gold",
  CONFIRMED: "bg-brand-soft text-brand-dark",
  COLLECTED: "bg-brand-soft text-brand-dark",
  REPORT_READY: "bg-success-soft text-success",
  CANCELLED: "bg-accent-soft text-accent",
};
