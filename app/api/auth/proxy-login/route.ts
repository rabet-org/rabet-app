import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { comparePassword } from "@/lib/password";
import {
  signAccessToken,
  signRefreshToken,
  hashToken,
  getAccessExpiresInSeconds,
  getRefreshExpiryDate,
} from "@/lib/jwt";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // ── Validation ──────────────────────────────────────
    if (!email || !password) {
      return NextResponse.json(
        { message: "email and password are required" },
        { status: 400 }
      );
    }

    // ── Look up user ─────────────────────────────────────
    const user = await db.user.findUnique({
      where: { email },
      include: { auth: true, profile: true },
    });

    if (!user || !user.auth || !user.auth.password_hash) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.is_active || user.is_blocked) {
      return NextResponse.json(
        {
          message: user.is_blocked
            ? "Your account has been blocked. Contact support."
            : "Your account is inactive.",
        },
        { status: 403 }
      );
    }

    // ── Verify password ──────────────────────────────────
    const valid = await comparePassword(password, user.auth.password_hash);
    if (!valid) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
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

    await db.$transaction(async (tx: any) => {
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

    // ── Set cookies ──────────────────────────────────────
    const cookieStore = await cookies();
    const safeCookies = cookieStore as any;

    safeCookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getAccessExpiresInSeconds(),
      path: "/",
    });

    safeCookies.set("refresh_token", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
    });

    safeCookies.set("user_role", user.role, {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: getAccessExpiresInSeconds(),
      path: "/",
    });

    // ── Return response ──────────────────────────────────
    return NextResponse.json({
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
      message: "Logged in securely",
    });
  } catch (error: any) {
    console.error("[POST /api/auth/proxy-login] Error:", error);
    console.error("Error stack:", error?.stack);
    console.error("Error message:", error?.message);
    return NextResponse.json(
      { 
        message: "Internal server error",
        error: process.env.NODE_ENV === "development" ? error?.message : undefined
      },
      { status: 500 }
    );
  }
}
