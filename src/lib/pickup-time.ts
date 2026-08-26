// Parses a booking's scheduledDate ("yyyy-mm-dd") + scheduledSlot (e.g.
// "06:00 AM – 08:00 AM") into a Date for the slot's START time — used to
// enforce the "cancel up to 1 hour before" rule and the T-30-min reminder.
export function parseSlotStart(scheduledDate: string, scheduledSlot: string): Date | null {
  const startPart = scheduledSlot.split(/[-–—]/)[0]?.trim();
  if (!startPart) return null;

  const match = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const meridiem = match[3].toUpperCase();
  if (meridiem === "PM" && hours !== 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;

  const [y, m, d] = scheduledDate.split("-").map(Number);
  if (!y || !m || !d) return null;

  return new Date(y, m - 1, d, hours, minutes, 0, 0);
}

// Kept out of component bodies deliberately — calling Date.now() directly
// inside a component/render function trips the react-hooks purity lint
// rule, even in a server component that isn't re-rendered like a client one.
export function isPickupCancellable(scheduledDate: string, scheduledSlot: string, cutoffMs: number): boolean {
  const slotStart = parseSlotStart(scheduledDate, scheduledSlot);
  return !slotStart || slotStart.getTime() - Date.now() >= cutoffMs;
}
