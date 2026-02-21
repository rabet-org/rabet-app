import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashToken, verifyRefreshToken } from "@/lib/jwt";
import { ok, ApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return ApiError.badRequest("refresh_token is required");
    }

    // ── Verify the refresh token to identify the user ────
    let payload;
    try {
      payload = verifyRefreshToken(refresh_token);
    } catch {
      return ApiError.unauthorized("Invalid or expired refresh token");
    }

    // ── Ensure the token exists in DB ────────────────────
    const tokenHash = hashToken(refresh_token);
    const stored = await db.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!stored || stored.revoked) {
      return ApiError.unauthorized(
        "Refresh token not found or already revoked",
      );
    }

    // ── Revoke all non-revoked refresh tokens for this user
    const result = await db.refreshToken.updateMany({
      where: { user_id: payload.sub, revoked: false },
      data: { revoked: true, revoked_at: new Date() },
    });

    return ok({
      message: "All sessions revoked",
      sessions_revoked: result.count,
    });
  } catch (err) {
    console.error("[POST /auth/logout-all]", err);
    return ApiError.internal();
  }
}
