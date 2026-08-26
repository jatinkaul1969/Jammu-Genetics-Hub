import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

// Per-account salted password hashing for staff logins (unlike the single
// shared ADMIN_PASSWORD, each staff member has their own password, so it
// needs real per-user hashing rather than a fixed hash comparison).
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  if (candidate.length !== expected.length) return false;
  return timingSafeEqual(candidate, expected);
}
