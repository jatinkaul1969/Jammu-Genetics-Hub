import { AdminBookingForm } from "@/components/AdminBookingForm";

export default function PhleboBookForCustomerPage() {
  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">Price check &amp; on-the-spot booking</h2>
        <p className="text-sm text-ink-soft">
          Look up a test and compare rates across labs while you&apos;re with the patient — the ★ tag marks the
          best rate you can offer. Book it right here and it&apos;s created under their own account, same as if
          they&apos;d booked it themselves.
        </p>
      </div>
      <AdminBookingForm />
    </div>
  );
}
