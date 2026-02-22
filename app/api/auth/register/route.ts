import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, isStrongPassword } from "@/lib/password";
import { generateOpaqueToken, hashToken } from "@/lib/jwt";
import { sendVerificationEmail } from "@/lib/email";
import { created, ApiError } from "@/lib/api-response";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, full_name, phone, role } = body;

    // ── Validation ──────────────────────────────────────
    if (!email || !password || !full_name) {
      return ApiError.badRequest("email, password, and full_name are required");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ApiError.badRequest("Invalid email format");
    }

    if (!isStrongPassword(password)) {
      return ApiError.badRequest(
        "Password must be at least 8 characters with one uppercase letter and one digit",
      );
    }

    // Validate role
    const userRole = role === "provider" ? "provider" : "client";

    // ── Check duplicate email ────────────────────────────
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return ApiError.conflict("An account with this email already exists");
    }

    // ── Create user atomically ───────────────────────────
    const password_hash = await hashPassword(password);
    const verificationToken = generateOpaqueToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h

    const user = await db.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email,
          role: userRole,
          auth: {
            create: {
              password_hash,
              auth_provider: "local",
              email_verification_token: hashToken(verificationToken),
              email_verification_token_expires: tokenExpiry,
            },
          },
          profile: {
            create: { full_name, phone: phone ?? null },
          },
        },
        include: { profile: true },
      });
      return newUser;
    });

    // ── Send verification email (non-blocking) ───────────
    sendVerificationEmail(email, verificationToken).catch(console.error);

    return created({
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          email_verified: user.email_verified,
          profile: {
            full_name: user.profile?.full_name,
            phone: user.profile?.phone ?? null,
          },
          created_at: user.created_at,
        },
        message: "Verification email sent",
      },
    });
  } catch (err) {
    console.error("[POST /auth/register]", err);
    return ApiError.internal();
  }
}
