import { AdminBookingForm } from "@/components/AdminBookingForm";

export default function AdminBookForCustomerPage() {
  return (
    <div className="max-w-xl">
      <div className="mb-6">
        <h2 className="font-display text-lg font-semibold text-ink">Book for a Customer</h2>
        <p className="text-sm text-ink-soft">
          For phone-in bookings — the booking is created under the customer&apos;s own account and shows up in
          their app exactly like a self-service booking.
        </p>
      </div>
      <AdminBookingForm />
    </div>
  );
}
