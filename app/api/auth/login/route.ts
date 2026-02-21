import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { comparePassword } from "@/lib/password";
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  getAccessExpiresInSeconds,
  getRefreshExpiryDate,
} from "@/lib/jwt";
import { ok, ApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    // ── Validation ──────────────────────────────────────
    if (!email || !password) {
      return ApiError.badRequest("email and password are required");
    }

    // ── Look up user ─────────────────────────────────────
    const user = await db.user.findUnique({
      where: { email },
      include: { auth: true, profile: true },
    });

    if (!user || !user.auth || !user.auth.password_hash) {
      return ApiError.unauthorized("Invalid email or password");
    }

    if (!user.is_active || user.is_blocked) {
      return ApiError.forbidden(
        user.is_blocked
          ? "Your account has been blocked. Contact support."
          : "Your account is inactive.",
      );
    }

    // ── Verify password ──────────────────────────────────
    const valid = await comparePassword(password, user.auth.password_hash);
    if (!valid) {
      return ApiError.unauthorized("Invalid email or password");
    }

    // ── Issue tokens ─────────────────────────────────────
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const ipAddress =
      req.headers.get("x-forwarded-for") ??
      req.headers.get("x-real-ip") ??
      null;
    const userAgent = req.headers.get("user-agent") ?? null;

    await db.$transaction(async (tx) => {
      // Store hashed refresh token
      await tx.refreshToken.create({
        data: {
          user_id: user.id,
          token_hash: hashToken(refreshToken),
          device_info: userAgent,
          ip_address: ipAddress,
          expires_at: getRefreshExpiryDate(),
        },
      });
      // Update last login
      await tx.user.update({
        where: { id: user.id },
        data: { last_login_at: new Date() },
      });
    });

    return ok({
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: getAccessExpiresInSeconds(),
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        profile: {
          full_name: user.profile?.full_name ?? null,
          avatar_url: user.profile?.avatar_url ?? null,
        },
      },
    });
  } catch (err) {
    console.error("[POST /auth/login]", err);
    return ApiError.internal();
  }
}
