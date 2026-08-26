"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search, Trash2, Check, UserRound, Phone } from "lucide-react";
import { formatInr } from "@/lib/format";
import { LocationPicker } from "@/components/LocationPicker";
import { DIAGNOSTIC_FEE } from "@/lib/collection-slots";

const SLOTS = [
  "06:00 AM – 08:00 AM",
  "08:00 AM – 10:00 AM",
  "10:00 AM – 12:00 PM",
  "04:00 PM – 06:00 PM",
  "06:00 PM – 08:00 PM",
];

function nextDays(n: number) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return d;
  });
}

type CartItem = { productId: string; productName: string; labId: string; labName: string; price: number; mrp: number };
type SearchResult = {
  id: string;
  name: string;
  type: string;
  prices: { labId: string; labName: string; labShortName: string; price: number; mrp: number }[];
};
type Patient = { id: string; name: string; age: number; relationship: string };
type Address = { id: string; label: string; addressLine: string; city: string; pincode: string; latitude: number | null; longitude: number | null };

const NEW = "__new__";

export function AdminBookingForm() {
  const router = useRouter();

  // Customer lookup
  const [customerPhone, setCustomerPhone] = useState("");
  const [looking, setLooking] = useState(false);
  const [lookedUp, setLookedUp] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerAge, setCustomerAge] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);

  // Cart
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Patient/address selection
  const [patientChoice, setPatientChoice] = useState(NEW);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientAge, setNewPatientAge] = useState("");
  const [addressChoice, setAddressChoice] = useState(NEW);
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newCity, setNewCity] = useState("Jammu");
  const [newPincode, setNewPincode] = useState("");
  const [pin, setPin] = useState<{ lat: number; lng: number } | null>(null);

  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledSlot, setScheduledSlot] = useState("");
  const [couponCode, setCouponCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string[] | null>(null);

  const days = nextDays(10);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) {
        setResults([]);
        return;
      }
      setSearching(true);
      try {
        const res = await fetch(`/api/admin/products/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setResults(data.results ?? []);
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  async function lookupCustomer() {
    setLooking(true);
    setError(null);
    setLookedUp(false);
    try {
      const res = await fetch(`/api/admin/customers/lookup?phone=${customerPhone}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not look up customer.");
      setLookedUp(true);
      if (data.found) {
        setCustomerId(data.user.id);
        setCustomerName(data.user.name);
        setCustomerAge(String(data.user.age));
        setPatients(data.patients);
        setAddresses(data.addresses);
        setPatientChoice(data.patients[0]?.id ?? NEW);
        setAddressChoice(data.addresses[0]?.id ?? NEW);
      } else {
        setCustomerId(null);
        setCustomerName("");
        setCustomerAge("");
        setPatients([]);
        setAddresses([]);
        setPatientChoice(NEW);
        setAddressChoice(NEW);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLooking(false);
    }
  }

  function addToCart(product: SearchResult, price: SearchResult["prices"][number]) {
    if (cart.some((c) => c.productId === product.id && c.labId === price.labId)) return;
    setCart((c) => [
      ...c,
      { productId: product.id, productName: product.name, labId: price.labId, labName: price.labName, price: price.price, mrp: price.mrp },
    ]);
  }

  function removeFromCart(productId: string, labId: string) {
    setCart((c) => c.filter((i) => !(i.productId === productId && i.labId === labId)));
  }

  const subtotal = cart.reduce((s, i) => s + i.price, 0);
  const labCount = new Set(cart.map((i) => i.labId)).size;
  const diagnosticFee = DIAGNOSTIC_FEE * Math.max(labCount, 1);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!/^[6-9]\d{9}$/.test(customerPhone)) {
      setError("Enter a valid 10-digit customer phone number.");
      return;
    }
    if (cart.length === 0) {
      setError("Add at least one test to the booking.");
      return;
    }
    if (!scheduledDate || !scheduledSlot) {
      setError("Pick a collection date and slot.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/bookings/create-for-customer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerPhone,
          customerName,
          customerAge: Number(customerAge),
          items: cart,
          scheduledDate,
          scheduledSlot,
          couponCode: couponCode || undefined,
          patient:
            patientChoice === NEW
              ? { name: newPatientName, age: Number(newPatientAge), relationship: customerId ? "other" : "self" }
              : { id: patientChoice },
          address:
            addressChoice === NEW
              ? { addressLine: newAddressLine, city: newCity, pincode: newPincode, latitude: pin?.lat ?? null, longitude: pin?.lng ?? null }
              : { id: addressChoice },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create the booking.");
      setSuccess(data.bookingCodes);
      setCart([]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-success bg-success-soft p-6 text-center">
        <Check className="mx-auto mb-2 text-success" size={28} />
        <p className="mb-1 font-display text-lg font-semibold text-ink">Booking created</p>
        <p className="mb-4 text-sm text-ink-soft">Booking code{success.length > 1 ? "s" : ""}: {success.join(", ")}</p>
        <button
          onClick={() => setSuccess(null)}
          className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
        >
          Book another
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">1. Customer</h3>
        <div className="flex gap-2">
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            inputMode="numeric"
            placeholder="Customer's 10-digit mobile number"
            className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
          />
          <button
            type="button"
            onClick={lookupCustomer}
            disabled={looking || !/^[6-9]\d{9}$/.test(customerPhone)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-50"
          >
            {looking ? <Loader2 size={14} className="animate-spin" /> : <Phone size={14} />} Look up
          </button>
        </div>

        {lookedUp && (
          <div className="mt-3">
            {customerId ? (
              <p className="flex items-center gap-1.5 text-sm text-success">
                <UserRound size={14} /> Existing customer — {customerName} ({customerAge} yrs)
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-ink-faint">New customer — enter their details to create an account.</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Full name"
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                  <input
                    value={customerAge}
                    onChange={(e) => setCustomerAge(e.target.value.replace(/\D/g, ""))}
                    inputMode="numeric"
                    placeholder="Age"
                    className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">2. Tests &amp; packages</h3>
        <div className="relative mb-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tests or packages…"
            className="w-full rounded-lg border border-border bg-bg py-2 pl-8 pr-3 text-sm outline-none focus:border-brand"
          />
        </div>

        {searching && <Loader2 size={14} className="animate-spin text-ink-faint" />}

        {results.length > 0 && (
          <div className="mb-3 max-h-64 space-y-2 overflow-y-auto rounded-lg border border-border p-2">
            {results.map((p) => (
              <div key={p.id} className="rounded-lg bg-bg p-2">
                <p className="mb-1 text-xs font-medium text-ink">{p.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {p.prices.map((price, i) => {
                    const added = cart.some((c) => c.productId === p.id && c.labId === price.labId);
                    const isBest = i === 0 && p.prices.length > 1;
                    return (
                      <button
                        type="button"
                        key={price.labId}
                        onClick={() => addToCart(p, price)}
                        disabled={added}
                        title={isBest ? "Best rate you can quote for this test" : undefined}
                        className={`rounded-full border px-2 py-1 text-[11px] disabled:opacity-40 ${
                          isBest
                            ? "border-success bg-success-soft text-success hover:border-success"
                            : "border-border text-ink-soft hover:border-brand hover:text-brand"
                        }`}
                      >
                        {isBest && "★ "}
                        {price.labShortName} · {formatInr(price.price)} {added && "✓"}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {cart.length === 0 ? (
          <p className="text-xs text-ink-faint">No tests added yet.</p>
        ) : (
          <div className="space-y-1.5">
            {cart.map((item) => (
              <div key={`${item.productId}-${item.labId}`} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2 text-sm">
                <span className="text-ink-soft">
                  {item.productName} <span className="text-ink-faint">· {item.labName}</span>
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-ink">{formatInr(item.price)}</span>
                  <button type="button" onClick={() => removeFromCart(item.productId, item.labId)} className="text-ink-faint hover:text-accent">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 text-sm">
              <span className="text-ink-soft">Subtotal</span>
              <span className="font-mono text-ink">{formatInr(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-ink-soft">Diagnostic fee{labCount > 1 ? ` × ${labCount} labs` : ""}</span>
              <span className="font-mono text-ink">{formatInr(diagnosticFee)}</span>
            </div>
            <p className="text-xs text-ink-faint">Not shown to the customer until a coupon is checked server-side — final total may differ if one applies.</p>
            <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
              <span className="text-ink">Total (before any coupon)</span>
              <span className="font-mono text-brand-dark">{formatInr(subtotal + diagnosticFee)}</span>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">3. Patient</h3>
        {patients.length > 0 && (
          <select value={patientChoice} onChange={(e) => setPatientChoice(e.target.value)} className="mb-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand">
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.age}, {p.relationship})
              </option>
            ))}
            <option value={NEW}>Someone else…</option>
          </select>
        )}
        {patientChoice === NEW && (
          <div className="grid grid-cols-2 gap-2">
            <input value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} placeholder="Patient name" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
            <input value={newPatientAge} onChange={(e) => setNewPatientAge(e.target.value.replace(/\D/g, ""))} inputMode="numeric" placeholder="Age" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">4. Collection address</h3>
        {addresses.length > 0 && (
          <select value={addressChoice} onChange={(e) => setAddressChoice(e.target.value)} className="mb-2 w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand">
            {addresses.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} — {a.addressLine}, {a.city}
              </option>
            ))}
            <option value={NEW}>New address…</option>
          </select>
        )}
        {addressChoice === NEW && (
          <div className="space-y-2">
            <input value={newAddressLine} onChange={(e) => setNewAddressLine(e.target.value)} placeholder="Address line" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
            <div className="grid grid-cols-2 gap-2">
              <input value={newCity} onChange={(e) => setNewCity(e.target.value)} placeholder="City" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
              <input value={newPincode} onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} inputMode="numeric" placeholder="Pincode" className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <LocationPicker value={pin} onChange={setPin} />
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border bg-surface p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">5. Slot &amp; coupon</h3>
        <div className="mb-2 flex flex-wrap gap-1.5">
          {days.map((d) => {
            const iso = d.toISOString().slice(0, 10);
            return (
              <button
                type="button"
                key={iso}
                onClick={() => setScheduledDate(iso)}
                className={`rounded-lg border px-2.5 py-1.5 text-xs ${scheduledDate === iso ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"}`}
              >
                {d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </button>
            );
          })}
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          {SLOTS.map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setScheduledSlot(s)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs ${scheduledSlot === s ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft"}`}
            >
              {s}
            </button>
          ))}
        </div>
        <input
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          placeholder="Coupon code (optional)"
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </div>

      {error && <p className="text-sm text-accent">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
      >
        {submitting && <Loader2 size={16} className="animate-spin" />}
        Create booking for customer
      </button>
    </form>
  );
}
