// Where Jammu Genetics Hub currently sends its own phlebotomists. Home
// collection is only offered in these cities for now — the storefront lets
// people browse and compare from anywhere, but a booking's collection
// pincode must fall inside one of these ranges (enforced client-side in
// checkout AND server-side in create-booking.ts, so the fee/slot logic is
// never the only gate).
//
// Pincodes are matched by prefix rather than an explicit list — the first
// 3 digits of an Indian PIN identify the sorting district, which is precise
// enough here (Jammu city + immediate district is 180/181; Greater Mumbai
// incl. suburbs is 400). Add a city by adding an entry here — nothing else
// needs to change.

export type ServiceableCity = {
  key: string;
  label: string;
  /** Leading digits an in-area 6-digit pincode must start with. */
  pincodePrefixes: string[];
  /** State/UT — used in PostalAddress structured data (schema.org). */
  state: string;
};

export const SERVICEABLE_CITIES: ServiceableCity[] = [
  { key: "jammu", label: "Jammu", pincodePrefixes: ["180", "181"], state: "Jammu and Kashmir" },
  { key: "mumbai", label: "Mumbai", pincodePrefixes: ["400"], state: "Maharashtra" },
];

// Shown next to the "more cities coming soon" note in the city picker.
export const COMING_SOON_NOTE = "More cities coming soon";

export function isValidPincodeFormat(pincode: string): boolean {
  return /^\d{6}$/.test(pincode.trim());
}

/** The serviceable city a pincode belongs to, or null if we don't cover it. */
export function cityForPincode(pincode: string): ServiceableCity | null {
  const p = pincode.trim();
  if (!isValidPincodeFormat(p)) return null;
  return SERVICEABLE_CITIES.find((c) => c.pincodePrefixes.some((prefix) => p.startsWith(prefix))) ?? null;
}

export function isServiceablePincode(pincode: string): boolean {
  return cityForPincode(pincode) !== null;
}

/** True if the pincode is in `cityKey`'s range specifically. */
export function pincodeMatchesCity(pincode: string, cityKey: string): boolean {
  const city = cityForPincode(pincode);
  return city !== null && city.key === cityKey;
}

export function cityByKey(key: string): ServiceableCity | undefined {
  return SERVICEABLE_CITIES.find((c) => c.key === key);
}

export function cityByLabel(label: string): ServiceableCity | undefined {
  const l = label.trim().toLowerCase();
  return SERVICEABLE_CITIES.find((c) => c.label.toLowerCase() === l);
}

// Human-readable "we serve Jammu (180xxx/181xxx) and Mumbai (400xxx)" style
// hint, used in error messages and helper text.
export const SERVICEABLE_AREAS_HELP = SERVICEABLE_CITIES.map(
  (c) => `${c.label} (${c.pincodePrefixes.map((p) => `${p}xxx`).join(" / ")})`
).join(" and ");
