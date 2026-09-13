"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, LogIn, CalendarDays, UserRound, MapPin, Plus, Check, Tag, X, Zap, Printer, Crown } from "lucide-react";
import { useAuth, type AuthUser } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { formatInr } from "@/lib/format";
import { LoginModal } from "@/components/LoginModal";
import { LocationPicker } from "@/components/LocationPicker";
import {
  SERVICEABLE_CITIES,
  COMING_SOON_NOTE,
  SERVICEABLE_AREAS_HELP,
  cityForPincode,
  cityByLabel,
} from "@/lib/serviceable-areas";
import {
  getCollectionDates,
  getSlotsForDate,
  isExpressDate,
  DIAGNOSTIC_FEE,
  EXPRESS_FEE,
  EXPRESS_WINDOW_MINUTES,
  HARD_COPY_FEE,
  MEMBERSHIP_FEE,
  MEMBERSHIP_DISCOUNT_PERCENT,
} from "@/lib/collection-slots";

type SavedPatient = {
  id: string;
  name: string;
  age: number;
  gender: string | null;
  relationship: string;
  lastAddressId: string | null;
};

type SavedAddress = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault: boolean;
};

type AppliedCoupon = { code: string; discount: number; description: string };
type VisibleCoupon = { code: string; description: string; discount: number; audience: string };

const RELATIONSHIPS = ["Spouse", "Child", "Parent", "Sibling", "Other"];

const NEW = "__new__";

function pickDefaultAddress(patient: SavedPatient | undefined, addresses: SavedAddress[]): string {
  if (patient?.lastAddressId && addresses.some((a) => a.id === patient.lastAddressId)) {
    return patient.lastAddressId;
  }
  return addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? NEW;
}

export function CheckoutForm({
  savedPatients,
  savedAddresses,
}: {
  savedPatients: SavedPatient[];
  savedAddresses: SavedAddress[];
}) {
  const router = useRouter();
  const { user, login } = useAuth();
  const { items, hydrated, totalPrice, totalMrp, clear } = useCart();
  const [showLogin, setShowLogin] = useState(false);

  const [patients, setPatients] = useState(savedPatients);
  const [addresses, setAddresses] = useState(savedAddresses);
  const [selectedPatientId, setSelectedPatientId] = useState(patients[0]?.id ?? NEW);
  const [selectedAddressId, setSelectedAddressId] = useState(() => pickDefaultAddress(patients[0], addresses));

  const [newPatientName, setNewPatientName] = useState("");
  const [newPatientAge, setNewPatientAge] = useState("");
  const [newPatientRelationship, setNewPatientRelationship] = useState(RELATIONSHIPS[0]);

  const [newAddressLabel, setNewAddressLabel] = useState("Home");
  const [newAddressLine, setNewAddressLine] = useState("");
  const [newCity, setNewCity] = useState(SERVICEABLE_CITIES[0].label);
  const [newPincode, setNewPincode] = useState("");
  const [newLocation, setNewLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [date, setDate] = useState("");
  const [slot, setSlot] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);

  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [myCoupons, setMyCoupons] = useState<VisibleCoupon[]>([]);

  const [wantsHardCopy, setWantsHardCopy] = useState(false);
  const [wantsMembership, setWantsMembership] = useState(false);

  // Default the new-address city to whatever the visitor picked in the
  // header city selector, when it's one we serve.
  useEffect(() => {
    try {
      const saved = localStorage.getItem("jgh_city");
      if (saved && SERVICEABLE_CITIES.some((c) => c.label === saved)) setNewCity(saved);
    } catch {
      // localStorage unavailable — keep the default
    }
  }, []);

  const days = useMemo(() => getCollectionDates(7), []);
  const slots = useMemo(() => (date ? getSlotsForDate(date) : []), [date]);

  function selectDate(iso: string) {
    setDate(iso);
    setSlot(""); // last date's slot won't necessarily exist for the new date
  }

  const isTodaySelected = date ? isExpressDate(date) : false;
  const selectedSlotIsExpress = slots.find((s) => s.label === slot)?.isExpress ?? false;
  const labCount = useMemo(() => new Set(items.map((i) => i.labId)).size, [items]);

  const isMember = Boolean(user?.membershipActive);
  const buyingMembership = wantsMembership && !isMember;
  const membershipDiscount = isMember || wantsMembership ? Math.round((totalPrice * MEMBERSHIP_DISCOUNT_PERCENT) / 100) : 0;
  const useMembershipDiscount = membershipDiscount > (appliedCoupon?.discount ?? 0);
  const bestDiscount = useMembershipDiscount ? membershipDiscount : (appliedCoupon?.discount ?? 0);

  // A cart spanning multiple labs splits into one booking per lab (separate
  // phlebotomist visits), and diagnosticFee/expressFee/hardCopyFee are each
  // charged per booking server-side (create-booking.ts) — so all three must
  // scale by labCount here too, or this preview understates what's actually
  // charged once the bookings are created.
  const diagnosticFee = DIAGNOSTIC_FEE * Math.max(labCount, 1);
  const expressFee = selectedSlotIsExpress ? EXPRESS_FEE * Math.max(labCount, 1) : 0;
  const hardCopyFee = wantsHardCopy ? HARD_COPY_FEE * Math.max(labCount, 1) : 0;
  const membershipFee = buyingMembership ? MEMBERSHIP_FEE : 0;

  useEffect(() => {
    if (hydrated && items.length === 0 && !loading && !bookingComplete) {
      router.replace("/cart");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, items.length, bookingComplete]);

  async function checkEligibleCoupon() {
    try {
      const res = await fetch(`/api/coupons/eligible?subtotal=${totalPrice}`);
      const data = await res.json();
      if (data.coupon?.valid) {
        setAppliedCoupon({ code: data.coupon.code, discount: data.coupon.discount, description: data.coupon.description });
        setCouponInput(data.coupon.code);
      }
    } catch {
      // silently skip — not essential to checkout succeeding
    }
  }

  async function fetchMyCoupons() {
    try {
      const res = await fetch(`/api/coupons/mine?subtotal=${totalPrice}`);
      const data = await res.json();
      setMyCoupons(data.coupons ?? []);
    } catch {
      // silently skip — not essential to checkout succeeding
    }
  }

  useEffect(() => {
    // Fetching eligibility from an external system (the coupon API) once the
    // cart total is known on mount — not derived state, just deferred by the
    // await inside checkEligibleCoupon()/fetchMyCoupons(), which the linter
    // can't see through.
    if (user && hydrated && totalPrice > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      checkEligibleCoupon();
      fetchMyCoupons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  async function handleLogin(loggedInUser: NonNullable<AuthUser>) {
    login(loggedInUser);
    try {
      const [patientsRes, addressesRes] = await Promise.all([
        fetch("/api/account/patients"),
        fetch("/api/account/addresses"),
      ]);
      const patientsData = await patientsRes.json();
      const addressesData = await addressesRes.json();
      const fetchedPatients: SavedPatient[] = patientsData.patients ?? [];
      const fetchedAddresses: SavedAddress[] = addressesData.addresses ?? [];
      setPatients(fetchedPatients);
      setAddresses(fetchedAddresses);
      setSelectedPatientId(fetchedPatients[0]?.id ?? NEW);
      setSelectedAddressId(pickDefaultAddress(fetchedPatients[0], fetchedAddresses));
    } catch {
      // fall back to manual entry if this fails — not fatal
    }
    checkEligibleCoupon();
    fetchMyCoupons();
  }

  function selectPatient(patient: SavedPatient) {
    setSelectedPatientId(patient.id);
    setSelectedAddressId(pickDefaultAddress(patient, addresses));
  }

  async function applyCoupon(codeOverride?: string) {
    const code = codeOverride ?? couponInput;
    if (!code.trim()) return;
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal: totalPrice }),
      });
      const data = await res.json();
      if (!data.valid) {
        setCouponError(data.error ?? "That coupon isn't valid.");
        setAppliedCoupon(null);
        return;
      }
      setAppliedCoupon({ code: data.code, discount: data.discount, description: data.description });
      setCouponInput(data.code);
    } catch {
      setCouponError("Couldn't check that coupon — try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!user) {
      setShowLogin(true);
      return;
    }

    const usingNewPatient = selectedPatientId === NEW;
    const usingNewAddress = selectedAddressId === NEW;

    if (usingNewPatient && (!newPatientName.trim() || !newPatientAge)) {
      setError("Enter the patient's name and age.");
      return;
    }
    if (usingNewAddress) {
      if (!newAddressLine.trim() || !newCity.trim() || !/^\d{6}$/.test(newPincode)) {
        setError("Enter a complete address with a valid 6-digit pincode.");
        return;
      }
      const pinCity = cityForPincode(newPincode);
      const chosenCity = cityByLabel(newCity);
      if (!pinCity) {
        setError(`Home collection isn't available at pincode ${newPincode} yet — we currently serve ${SERVICEABLE_AREAS_HELP}.`);
        return;
      }
      if (chosenCity && pinCity.key !== chosenCity.key) {
        setError(`Pincode ${newPincode} doesn't look like it's in ${chosenCity.label}. Pick the matching city or check the pincode.`);
        return;
      }
    } else {
      const saved = addresses.find((a) => a.id === selectedAddressId);
      if (saved && !cityForPincode(saved.pincode)) {
        setError(`We no longer collect at ${saved.label} (pincode ${saved.pincode}) — we currently serve ${SERVICEABLE_AREAS_HELP}. Add an address in one of those areas.`);
        return;
      }
    }
    if (!date || !slot) {
      setError("Pick a collection date and time slot.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            labId: i.labId,
            price: i.price,
            mrp: i.mrp,
          })),
          patient: usingNewPatient
            ? { name: newPatientName.trim(), age: Number(newPatientAge), relationship: newPatientRelationship.toLowerCase() }
            : { id: selectedPatientId },
          address: usingNewAddress
            ? {
                label: newAddressLabel.trim() || "Home",
                addressLine: newAddressLine.trim(),
                city: newCity.trim(),
                pincode: newPincode.trim(),
                latitude: newLocation?.lat,
                longitude: newLocation?.lng,
              }
            : { id: selectedAddressId },
          phone: user.phone,
          scheduledDate: date,
          scheduledSlot: slot,
          couponCode: appliedCoupon?.code,
          wantsHardCopy,
          wantsMembership,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not create booking.");
      setBookingComplete(true);
      clear();
      router.push(`/booking/confirmed?codes=${data.bookingCodes.join(",")}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  const finalTotal =
    Math.max(0, totalPrice - bestDiscount) + diagnosticFee + expressFee + hardCopyFee + membershipFee;

  return (
    <>
      {!user && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-gold-soft bg-gold-soft px-4 py-3">
          <p className="text-sm text-ink">Log in with your phone number to complete this booking.</p>
          <button
            onClick={() => setShowLogin(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-dark"
          >
            <LogIn size={14} /> Log in
          </button>
        </div>
      )}

      <form onSubmit={submit} className="space-y-6">
        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <UserRound size={17} className="text-brand" /> Who is this test for?
          </h2>
          <div className="mb-3 flex flex-wrap gap-2">
            {patients.map((p) => (
              <SelectCard key={p.id} selected={selectedPatientId === p.id} onClick={() => selectPatient(p)}>
                {p.name} <span className="text-ink-faint">({p.age}{p.relationship === "self" ? ", you" : `, ${p.relationship}`})</span>
              </SelectCard>
            ))}
            <SelectCard selected={selectedPatientId === NEW} onClick={() => setSelectedPatientId(NEW)}>
              <Plus size={13} className="inline -mt-0.5" /> Someone else
            </SelectCard>
          </div>

          {selectedPatientId === NEW && (
            <div className="grid gap-3 rounded-lg border border-border bg-bg p-3 sm:grid-cols-3">
              <Field label="Full name">
                <input value={newPatientName} onChange={(e) => setNewPatientName(e.target.value)} placeholder="Full name" className="input" />
              </Field>
              <Field label="Age">
                <input
                  type="number"
                  min={1}
                  max={120}
                  value={newPatientAge}
                  onChange={(e) => setNewPatientAge(e.target.value)}
                  placeholder="Age in years"
                  className="input"
                />
              </Field>
              <Field label="Relationship">
                <select value={newPatientRelationship} onChange={(e) => setNewPatientRelationship(e.target.value)} className="input">
                  {RELATIONSHIPS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <MapPin size={17} className="text-brand" /> Sample collection address
          </h2>
          {selectedPatientId !== NEW && patients.find((p) => p.id === selectedPatientId)?.lastAddressId && (
            <p className="mb-2 text-xs text-ink-faint">Defaulted to the address you last used for this person.</p>
          )}
          <div className="mb-3 flex flex-col gap-2">
            {addresses.map((a) => (
              <SelectCard key={a.id} selected={selectedAddressId === a.id} onClick={() => setSelectedAddressId(a.id)} block>
                <span className="font-medium">{a.label}</span>
                <span className="block text-xs text-ink-soft">
                  {a.addressLine}, {a.city} – {a.pincode}
                </span>
              </SelectCard>
            ))}
            <SelectCard selected={selectedAddressId === NEW} onClick={() => setSelectedAddressId(NEW)} block>
              <span className="font-medium">
                <Plus size={13} className="mr-1 inline -mt-0.5" /> New address
              </span>
            </SelectCard>
          </div>

          {selectedAddressId === NEW && (
            <div className="grid gap-3 rounded-lg border border-border bg-bg p-3">
              <div className="grid gap-3 sm:grid-cols-3">
                <Field label="Label">
                  <input value={newAddressLabel} onChange={(e) => setNewAddressLabel(e.target.value)} placeholder="Home / Office" className="input" />
                </Field>
                <Field label="City">
                  <select value={newCity} onChange={(e) => setNewCity(e.target.value)} className="input">
                    {SERVICEABLE_CITIES.map((c) => (
                      <option key={c.key} value={c.label}>
                        {c.label}
                      </option>
                    ))}
                    <option disabled>{COMING_SOON_NOTE}…</option>
                  </select>
                </Field>
                <Field label="Pincode">
                  <input
                    value={newPincode}
                    onChange={(e) => setNewPincode(e.target.value.replace(/\D/g, ""))}
                    maxLength={6}
                    placeholder="180001"
                    className="input"
                  />
                  {newPincode.length === 6 && !cityForPincode(newPincode) && (
                    <span className="mt-1 block text-xs text-accent">
                      Not in our home-collection area yet — we serve {SERVICEABLE_AREAS_HELP}.
                    </span>
                  )}
                </Field>
              </div>
              <Field label="Address">
                <input
                  value={newAddressLine}
                  onChange={(e) => setNewAddressLine(e.target.value)}
                  placeholder="House no., street, landmark"
                  className="input"
                />
              </Field>
              <LocationPicker value={newLocation} onChange={setNewLocation} />
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <CalendarDays size={17} className="text-brand" /> Pick a collection slot
          </h2>
          <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
            {days.map((d) => (
              <button
                type="button"
                key={d.iso}
                onClick={() => selectDate(d.iso)}
                className={`shrink-0 rounded-lg border px-3 py-2 text-xs font-medium ${
                  date === d.iso ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:border-brand"
                }`}
              >
                {d.isToday ? "Today" : d.label}
              </button>
            ))}
          </div>

          {isTodaySelected && slots.some((s) => s.isExpress) && (
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-accent">
              <Zap size={13} /> Slots tagged <b>Express</b> are within the next {EXPRESS_WINDOW_MINUTES} minutes
              and add a {formatInr(EXPRESS_FEE)} fee — later slots today are priced normally.
            </p>
          )}

          {date && slots.length === 0 ? (
            <p className="text-sm text-ink-soft">No more slots open today — pick another date.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {slots.map((s) => (
                <button
                  type="button"
                  key={s.label}
                  onClick={() => setSlot(s.label)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium ${
                    slot === s.label ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink-soft hover:border-brand"
                  }`}
                >
                  {s.label}
                  {s.isExpress && (
                    <span className="flex items-center gap-0.5 rounded-full bg-accent px-1.5 py-0.5 text-[9px] font-semibold text-white">
                      <Zap size={9} /> Express
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <label
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
            wantsHardCopy ? "border-brand bg-brand-soft/40" : "border-border bg-surface hover:border-brand/50"
          }`}
        >
          <input
            type="checkbox"
            className="mt-1 shrink-0"
            checked={wantsHardCopy}
            onChange={(e) => setWantsHardCopy(e.target.checked)}
          />
          <span className="min-w-0">
            <span className="mb-1 flex items-center gap-2 font-display text-base font-semibold text-ink">
              <Printer size={17} className="text-brand" /> Hard copy reports
            </span>
            <span className="block text-sm text-ink">
              Add printed reports, delivered with your sample collection —{" "}
              <span className="font-mono">{formatInr(HARD_COPY_FEE)}</span>
              {labCount > 1 ? ` × ${labCount} labs` : ""}. Digital reports are always free either way.
            </span>
          </span>
        </label>

        {!isMember && (
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
              wantsMembership ? "border-gold bg-gold-soft" : "border-gold-soft bg-gold-soft/40 hover:border-gold/60"
            }`}
          >
            <input
              type="checkbox"
              className="mt-1 shrink-0"
              checked={wantsMembership}
              onChange={(e) => setWantsMembership(e.target.checked)}
            />
            <span className="min-w-0 text-sm">
              <span className="flex items-center gap-1.5 font-semibold text-ink">
                <Crown size={15} className="text-gold" /> Become a Member — {formatInr(MEMBERSHIP_FEE)}/yr
              </span>
              <span className="mt-0.5 block text-ink-soft">
                {MEMBERSHIP_DISCOUNT_PERCENT}% off every booking for a year, including this one.
              </span>
            </span>
          </label>
        )}

        <div className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 flex items-center gap-2 font-display text-base font-semibold text-ink">
            <Tag size={17} className="text-brand" /> Coupon
          </h2>
          {appliedCoupon ? (
            <div className="flex items-center justify-between rounded-lg border border-success bg-success-soft px-3 py-2.5">
              <div>
                <p className="text-sm font-semibold text-success">
                  {appliedCoupon.code} applied — you save {formatInr(appliedCoupon.discount)}
                </p>
                <p className="text-xs text-ink-soft">{appliedCoupon.description}</p>
              </div>
              <button type="button" onClick={removeCoupon} className="text-ink-faint hover:text-accent" aria-label="Remove coupon">
                <X size={16} />
              </button>
            </div>
          ) : (
            <>
              {myCoupons.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1.5 text-xs font-medium text-ink-soft">Your coupons</p>
                  <div className="flex flex-wrap gap-2">
                    {myCoupons.map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => applyCoupon(c.code)}
                        disabled={couponLoading}
                        className="flex items-center gap-1.5 rounded-lg border border-dashed border-brand px-3 py-1.5 text-xs font-medium text-brand-dark hover:bg-brand-soft disabled:opacity-50"
                      >
                        <span className="font-mono font-semibold">{c.code}</span>
                        <span className="text-ink-soft">— save {formatInr(c.discount)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <input
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="input"
                />
                <button
                  type="button"
                  onClick={() => applyCoupon()}
                  disabled={couponLoading || !couponInput.trim()}
                  className="shrink-0 rounded-lg border border-brand px-3 py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white disabled:opacity-50"
                >
                  {couponLoading ? <Loader2 size={15} className="animate-spin" /> : "Apply"}
                </button>
              </div>
            </>
          )}
          {couponError && <p className="mt-2 text-sm text-accent">{couponError}</p>}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-soft">Total MRP</span>
            <span className="font-mono text-ink-faint line-through">{formatInr(totalMrp)}</span>
          </div>
          {bestDiscount > 0 && (
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-success">
                {useMembershipDiscount ? `Membership discount (${MEMBERSHIP_DISCOUNT_PERCENT}%)` : `Coupon (${appliedCoupon?.code})`}
              </span>
              <span className="font-mono text-success">−{formatInr(bestDiscount)}</span>
            </div>
          )}
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-ink-soft">Diagnostic fee{labCount > 1 ? ` × ${labCount} labs` : ""}</span>
            <span className="font-mono text-ink">{formatInr(diagnosticFee)}</span>
          </div>
          {expressFee > 0 && (
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Express fee (same-day){labCount > 1 ? ` × ${labCount} labs` : ""}</span>
              <span className="font-mono text-ink">{formatInr(expressFee)}</span>
            </div>
          )}
          {hardCopyFee > 0 && (
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Hard copy reports</span>
              <span className="font-mono text-ink">{formatInr(hardCopyFee)}</span>
            </div>
          )}
          {membershipFee > 0 && (
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="text-ink-soft">Membership</span>
              <span className="font-mono text-ink">{formatInr(membershipFee)}</span>
            </div>
          )}
          <p className="mb-3 text-xs text-ink-faint">
            Coupon and membership discounts don&apos;t apply to the diagnostic fee, express fee, hard copy or
            membership cost.
          </p>
          <div className="mb-4 flex items-center justify-between border-t border-border pt-3">
            <span className="font-medium text-ink">Amount payable</span>
            <span className="font-mono text-xl font-semibold text-brand-dark">{formatInr(finalTotal)}</span>
          </div>
          {error && <p className="mb-3 text-sm text-accent">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-3 text-sm font-semibold text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {user ? "Confirm booking" : "Log in & confirm booking"}
          </button>
          <p className="mt-2 text-center text-xs text-ink-faint">
            Pay cash to the phlebotomist at the time of collection, or online — details in your confirmation.
          </p>
        </div>
      </form>

      {showLogin && (
        <LoginModal onClose={() => setShowLogin(false)} onSuccess={handleLogin} />
      )}
    </>
  );
}

function SelectCard({
  selected,
  onClick,
  children,
  block,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  block?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-1.5 rounded-lg border px-3 py-2 text-left text-sm ${block ? "w-full" : "items-center"} ${
        selected ? "border-brand bg-brand-soft text-brand-dark" : "border-border text-ink hover:border-brand"
      }`}
    >
      <span className="mt-0.5 h-3.5 w-3.5 shrink-0">{selected && <Check size={14} />}</span>
      <span className={block ? "min-w-0 flex-1" : undefined}>{children}</span>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-ink-soft">{label}</span>
      {children}
    </label>
  );
}
