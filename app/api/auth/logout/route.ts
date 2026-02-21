import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashToken } from "@/lib/jwt";
import { ok, ApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { refresh_token } = body;

    if (!refresh_token) {
      return ApiError.badRequest("refresh_token is required");
    }

    // ── Find and revoke the specific refresh token ───────
    const tokenHash = hashToken(refresh_token);
    const stored = await db.refreshToken.findUnique({
      where: { token_hash: tokenHash },
    });

    if (!stored || stored.revoked) {
      return ApiError.badRequest("Refresh token not found or already revoked");
    }

    await db.refreshToken.update({
      where: { token_hash: tokenHash },
      data: { revoked: true, revoked_at: new Date() },
    });

    return ok({ message: "Logged out successfully" });
  } catch (err) {
    console.error("[POST /auth/logout]", err);
    return ApiError.internal();
  }
}
