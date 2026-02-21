import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import {
  verifyRefreshToken,
  signAccessToken,
  hashToken,
  getAccessExpiresInSeconds,
} from "@/lib/jwt";
import { ok, ApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return ApiError.badRequest("refresh_token is required");
    }

    // ── Verify JWT signature ─────────────────────────────
    let payload;
    try {
      payload = verifyRefreshToken(refresh_token);
    } catch {
      return ApiError.unauthorized("Invalid or expired refresh token");
    }

    // ── Check token exists in DB and is not revoked ──────
    const stored = await db.refreshToken.findUnique({
      where: { token_hash: hashToken(refresh_token) },
    });

    if (!stored || stored.revoked || stored.expires_at < new Date()) {
      return ApiError.unauthorized(
        "Refresh token is invalid, expired, or revoked",
      );
    }

    // ── Issue new access token ───────────────────────────
    const newAccessToken = signAccessToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
    });

    return ok({
      access_token: newAccessToken,
      expires_in: getAccessExpiresInSeconds(),
    });
  } catch (err) {
    console.error("[POST /auth/refresh]", err);
    return ApiError.internal();
  }
}
