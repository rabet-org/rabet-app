import jwt from "jsonwebtoken";
import crypto from "crypto";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES_IN ?? "30m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: string;
}

// ─── Access Token ────────────────────────────────────────

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
}

// ─── Refresh Token ───────────────────────────────────────

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_EXPIRES,
  } as jwt.SignOptions);
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
}

// ─── Token expiry helpers ────────────────────────────────

/** Returns access token expiry in seconds (for expires_in field) */
export function getAccessExpiresInSeconds(): number {
  const val = ACCESS_EXPIRES;
  if (val.endsWith("m")) return parseInt(val) * 60;
  if (val.endsWith("h")) return parseInt(val) * 3600;
  if (val.endsWith("d")) return parseInt(val) * 86400;
  return 1800;
}

/** Returns a Date for when the refresh token expires */
export function getRefreshExpiryDate(): Date {
  const val = REFRESH_EXPIRES;
  const now = Date.now();
  if (val.endsWith("m")) return new Date(now + parseInt(val) * 60_000);
  if (val.endsWith("h")) return new Date(now + parseInt(val) * 3_600_000);
  if (val.endsWith("d")) return new Date(now + parseInt(val) * 86_400_000);
  return new Date(now + 7 * 86_400_000);
}

// ─── Opaque token utilities ──────────────────────────────

/** Generate a secure random hex token (for email verification / password reset) */
export function generateOpaqueToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Hash an opaque token before storing (SHA-256) */
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
